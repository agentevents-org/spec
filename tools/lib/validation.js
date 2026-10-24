import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { globSync } from "glob";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const loadJSON = (file) => JSON.parse(readFileSync(file, "utf8"));
const ajv = new Ajv2020({ strict: false, validateFormats: true, allErrors: true });
addFormats(ajv);
const schemas = [
  ...globSync(join(ROOT, "schemas/*.json")),
  ...globSync(join(ROOT, "schemas/links/*.json")),
  ...globSync(join(ROOT, "schemas/common/*.json")),
  join(ROOT, "custom/schema.json"),
].map(loadJSON);
for (const schema of schemas) ajv.addSchema(schema);
// Compile even schemas without a fixture; resolve every reference locally.
for (const schema of schemas) ajv.getSchema(schema.$id);
export const schemaCount = schemas.length;
const custom = ajv.getSchema(schemas.find((s) => s.$id.endsWith("/custom")).$id);
const eventValidators = new Map();
for (const schema of schemas) {
  const type = schema.properties?.context?.properties?.type?.enum?.[0];
  if (type) eventValidators.set(type, ajv.getSchema(schema.$id));
}
export const eventKey = (context) => JSON.stringify([context.source, context.id]);
const subjectKey = (subject, source) => JSON.stringify([subject.source ?? source, subject.id]);

// JSON Schema only: what any conforming 2020-12 validator can check.
export function validateSchema(event) {
  const type = event?.context?.type;
  const validate = typeof type === "string" && type.startsWith("dev.agent-events.x.")
    ? custom : eventValidators.get(type);
  if (!validate) throw new Error(`Unsupported event type/version: ${type}`);
  if (!validate(event)) throw new Error(ajv.errorsText(validate.errors, { separator: "\n" }));
  return event;
}

// Schema plus rules JSON Schema cannot express; SDKs must implement these in code.
export function validateEvent(event) {
  validateSchema(event);
  const type = event.context.type;
  const c = event.subject.content;
  if (type.startsWith("dev.agent-events.modelinvocation.finished.") &&
      [c.promptTokens, c.completionTokens, c.totalTokens].every((n) => n !== undefined) &&
      c.promptTokens + c.completionTokens !== c.totalTokens) {
    throw new Error("totalTokens must equal promptTokens + completionTokens");
  }
  return event;
}

// This checks the AgentEvents JSON structured-mode profile, not all CE formats.
export function validateEnvelope(envelope) {
  if (!envelope || envelope.specversion !== "1.0" || envelope.datacontenttype !== "application/json") {
    throw new Error("Expected CloudEvents 1.0 structured JSON profile");
  }
  const event = validateEvent(envelope.data);
  const expected = {
    id: event.context.id, source: event.context.source, type: event.context.type,
    subject: event.subject.id, time: event.context.timestamp,
  };
  for (const [name, value] of Object.entries(expected)) {
    if (envelope[name] !== value) throw new Error(`Envelope/payload mismatch: ${name}`);
  }
  if (envelope.chainid !== undefined && envelope.chainid !== event.context.chainId) {
    throw new Error("Envelope/payload mismatch: chainid");
  }
  return event;
}

// A closed scenario is a test artifact: unlike a live delivery stream it must
// contain every linked event and every lifecycle start/finish it demonstrates.
// It also requires linked events to share a chain, which is stricter than the
// spec: detached work in a separate chain MAY link back. Not consumer logic.
export function validateScenario(events) {
  if (!Array.isArray(events) || events.length === 0) throw new Error("Empty scenario");
  const byEvent = new Map();
  const bySubject = new Map();
  for (const raw of events) {
    const event = validateEvent(raw);
    const key = eventKey(event.context);
    if (byEvent.has(key)) {
      if (!isDeepStrictEqual(byEvent.get(key), event)) throw new Error("Conflicting duplicate event identity");
      continue;
    }
    byEvent.set(key, event);
    const type = event.context.type.split(".")[2];
    const sk = JSON.stringify([type, subjectKey(event.subject, event.context.source)]);
    if (!bySubject.has(sk)) bySubject.set(sk, []);
    bySubject.get(sk).push(event);
  }
  for (const event of byEvent.values()) {
    for (const link of event.context.links ?? []) {
      const endpoint = link.from ?? link.target;
      if (!endpoint) continue;
      const linked = byEvent.get(eventKey({ source: endpoint.source ?? event.context.source, id: endpoint.contextId }));
      if (!linked) throw new Error("Unresolved event link");
      if (linked.context.chainId !== event.context.chainId) throw new Error("Scenario chain mismatch");
      if ((link.linkType !== "RELATION" || ["TRIGGER", "RETRY"].includes(link.linkKind)) &&
          Date.parse(linked.context.timestamp) > Date.parse(event.context.timestamp)) {
        throw new Error("Causal link points into the future");
      }
    }
  }
  for (const group of bySubject.values()) {
    const first = group[0];
    const kind = first.context.type.split(".")[2];
    const predicate = (e) => e.context.type.split(".")[3];
    const start = group.find((e) => predicate(e) === "started");
    const finish = group.find((e) => predicate(e) === "finished");
    const predicates = group.map(predicate);
    if (new Set(predicates).size !== predicates.length) throw new Error("Repeated lifecycle predicate");
    if (kind !== "guardrail") {
      if (!finish || (!start && finish.subject.content.outcome !== "cancel")) throw new Error("Incomplete scenario lifecycle");
      if (start && Date.parse(start.context.timestamp) > Date.parse(finish.context.timestamp)) throw new Error("Finish precedes start");
      for (const name of ["parentAgentRun", "agentRun", "sourceAgentRun"]) {
        const refs = group.map((e) => e.subject.content[name]);
        const keys = refs.map((ref, i) => ref ? subjectKey(ref, group[i].context.source) : null);
        if (!keys.every((key) => key === keys[0])) throw new Error(`Inconsistent ${name}`);
      }
    } else {
      const decision = group.find((e) => predicate(e) === "triggered");
      const blocked = group.find((e) => predicate(e) === "blocked");
      if (!decision || (decision.subject.content.action === "block") !== Boolean(blocked)) throw new Error("Missing or unexpected blocked/triggered pair");
      if (blocked) {
        const normalized = (e) => {
          const { action, ...content } = e.subject.content;
          return {
            ...content,
            agentRun: subjectKey(content.agentRun, e.context.source),
            evaluatedSubject: {
              type: content.evaluatedSubject.type,
              identity: subjectKey(content.evaluatedSubject, e.context.source),
            },
          };
        };
        if (!isDeepStrictEqual(normalized(decision), normalized(blocked))) throw new Error("Guardrail decision metadata differs");
      }
    }
  }
  // All embedded run references must resolve within this closed scenario.
  const runs = new Map([...bySubject.values()].filter((g) => g[0].context.type.split(".")[2] === "agentrun")
    .map((g) => [subjectKey(g[0].subject, g[0].context.source), g]));
  for (const event of byEvent.values()) {
    for (const name of ["agentRun", "sourceAgentRun", "targetAgentRun", "parentAgentRun"]) {
      const ref = event.subject.content[name];
      if (ref && !runs.has(subjectKey(ref, event.context.source))) throw new Error(`Unresolved ${name}`);
    }
  }
  for (const [key, group] of runs) {
    const seen = new Set([key]);
    let current = group[0];
    while (current.subject.content.parentAgentRun) {
      const parent = subjectKey(current.subject.content.parentAgentRun, current.context.source);
      if (seen.has(parent)) throw new Error("Containment cycle");
      seen.add(parent);
      current = runs.get(parent)[0];
    }
  }
  for (const event of byEvent.values()) {
    if (event.context.links?.some((l) => l.linkType === "END")) {
      for (const other of byEvent.values()) {
        if (other.context.chainId === event.context.chainId && Date.parse(other.context.timestamp) > Date.parse(event.context.timestamp)) {
          throw new Error("Scenario work outlives END");
        }
      }
    }
  }
  return events;
}
