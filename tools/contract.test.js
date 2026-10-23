import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "glob";
import { ROOT, loadJSON, validateEvent, validateEnvelope, validateScenario } from "./lib/validation.js";
const fixture = (name) => loadJSON(join(ROOT, name));
const run = () => fixture("conformance/agentrun_finished.json");
const scenario = () => fixture("conformance/scenarios/handoff.json");
const custom = () => fixture("custom/conformance.json");

for (const subject of ["agentrun", "toolcall", "modelinvocation", "agenthandoff"]) {
  test(`${subject}.finished requires an outcome`, () => {
    const e = fixture(`conformance/${subject}_finished.json`);
    delete e.subject.content.outcome;
    assert.throws(() => validateEvent(e), /outcome/);
  });
}
for (const value of [[], true, false, null, 42, "plain JSON string", { safe: "metadata" }]) {
  test(`JSON custom data supports ${JSON.stringify(value)}`, () => {
    const e = run(); e.customData = value;
    assert.doesNotThrow(() => validateEvent(e));
    e.customDataContentType = "Application/JSON; charset=utf-8";
    assert.doesNotThrow(() => validateEvent(e));
  });
}
test("non-JSON custom data requires canonical base64", () => {
  for (const value of ["", "Zg==", "Zm8=", "Zm9v", "PHRyYWNlPjwvdHJhY2U+"]) {
    const e = run(); Object.assign(e, { customData: value, customDataContentType: "text/plain" });
    assert.doesNotThrow(() => validateEvent(e));
  }
  for (const value of ["Zg==\n", "Zg", "Zh==", "Zm9=", "???", true, {}]) {
    const e = run(); Object.assign(e, { customData: value, customDataContentType: "text/plain" });
    assert.throws(() => validateEvent(e));
  }
});
for (const name of ["openai-agents-handoff", "crewai-task_step"]) {
  for (const version of ["0.1.0-draft", "1.0.0-rc.1", "1.0.0+build.1", "1.2.3-0.alpha+build.01"]) {
    test(`custom grammar accepts ${name} / ${version}`, () => {
      const e = custom(); e.context.type = `dev.agenteventsx.${name}.finished.${version}`;
      assert.doesNotThrow(() => validateEvent(e));
    });
  }
}
test("custom grammar rejects invalid SemVer", () => {
  for (const version of ["01.2.3", "1.02.3", "1.2.03", "1.2.3-01", "1.2.3-", "1.2.3+", "1.2.3\n"]) {
    const e = custom(); e.context.type = `dev.agenteventsx.openai-agents-handoff.finished.${version}`;
    assert.throws(() => validateEvent(e));
  }
});
test("all five duplicated envelope fields must agree with payload", () => {
  const e = fixture("conformance/envelopes/toolcall.json");
  assert.doesNotThrow(() => validateEnvelope(e));
  for (const field of ["id", "source", "type", "subject", "time"]) {
    const mismatch = structuredClone(e); mismatch[field] = "different";
    assert.throws(() => validateEnvelope(mismatch), /mismatch/);
  }
});
test("closed scenario permits reordered delivery and exact retransmissions", () => {
  const events = scenario(); events.reverse(); events.push(structuredClone(events[0]));
  assert.doesNotThrow(() => validateScenario(events));
});
test("a conflicting retransmission is invalid", () => {
  const events = scenario(); const copy = structuredClone(events[0]);
  copy.subject.content.agentName = "different"; events.push(copy);
  assert.throws(() => validateScenario(events), /Conflicting duplicate/);
});
test("cross-source event links resolve by source plus ID", () => {
  const events = scenario();
  const child = events.find((e) => e.context.source === "/runtime/b" && e.context.id === "1");
  delete child.context.links[0].target.source;
  assert.throws(() => validateScenario(events), /Unresolved event link/);
});
test("cross-source parent references require a source", () => {
  const events = scenario();
  for (const e of events.filter((e) => e.context.source === "/runtime/b")) delete e.subject.content.parentAgentRun.source;
  assert.throws(() => validateScenario(events), /Unresolved parentAgentRun/);
});
test("causal timeline rejects a model finishing after its triggered tool starts", () => {
  const events = scenario(); events.find((e) => e.context.type.includes("modelinvocation.finished")).context.timestamp = "2026-08-05T17:31:09Z";
  assert.throws(() => validateScenario(events), /future/);
});
test("linked events in the scenario must share chain membership", () => {
  const events = scenario(); delete events.find((e) => e.context.type.includes("modelinvocation.finished")).context.chainId;
  assert.throws(() => validateScenario(events), /chain mismatch/);
});
test("blocked guardrail requires a matching decision identity and metadata", () => {
  const events = scenario(); events.find((e) => e.context.type.includes("guardrail.blocked")).subject.id = "wrong-evaluation";
  assert.throws(() => validateScenario(events), /pair/);
  const changed = scenario(); changed.find((e) => e.context.type.includes("guardrail.blocked")).subject.content.stage = "output";
  assert.throws(() => validateScenario(changed), /metadata differs/);
});
test("containment cycles are invalid", () => {
  const events = scenario();
  for (const e of events.filter((e) => e.context.type.includes("agentrun.") && e.subject.id === "root")) {
    e.subject.content.parentAgentRun = { id: "child", source: "/runtime/b" };
  }
  assert.throws(() => validateScenario(events), /Containment cycle/);
});
test("END must follow joined scenario work", () => {
  const events = scenario();
  const end = events.find((e) => e.context.links?.some((l) => l.linkType === "END"));
  end.context.links = [{ linkType: "END" }]; end.context.timestamp = "2026-08-05T17:31:16Z";
  assert.throws(() => validateScenario(events), /outlives END/);
});
test("cancel-before-start is a complete execution attempt", () => {
  const e = run(); e.subject.content.outcome = "cancel"; e.context.links = [{ linkType: "END" }];
  assert.doesNotThrow(() => validateScenario([e]));
});
test("core event tables agree with schema fields and requiredness", () => {
  const core = readFileSync(join(ROOT, "core.md"), "utf8");
  const sections = core.split(/^### /m);
  for (const file of globSync(join(ROOT, "schemas/*.json"))) {
    const schema = loadJSON(file);
    const [, , subject, predicate] = schema.properties.context.properties.type.enum[0].split(".");
    const section = sections.find((s) => s.toLowerCase().startsWith(`\x5b\x60${subject} ${predicate}\x60\x5d`));
    assert.ok(section, `${subject}.${predicate} has a documentation table`);
    const content = schema.properties.subject.properties.content;
    const rows = section.split("\n").filter((line) => /^\| [a-zA-Z]+ \|/.test(line) && !line.startsWith("| Field |"))
      .map((line) => { const columns = line.split("|").map((c) => c.trim()); return [line, columns[1], columns[4]]; });
    const fields = new Set(["id", "source", ...Object.keys(content.properties)]);
    for (const [, field, required] of rows) {
      assert.ok(fields.has(field), `Undeclared field ${subject}.${predicate}.${field}`);
      const expected = field === "id" || (content.required ?? []).includes(field);
      assert.equal(required.trim() === "✅", expected, `${subject}.${predicate}.${field} requiredness`);
    }
    assert.deepEqual(new Set(rows.map((row) => row[1])), fields, `${subject}.${predicate} documents all fields`);
  }
});

test("optional chain routing extension must match payload", () => {
  const e = fixture("conformance/envelopes/toolcall.json");
  e.chainid = e.data.context.chainId;
  assert.doesNotThrow(() => validateEnvelope(e));
  e.chainid = "wrong";
  assert.throws(() => validateEnvelope(e), /mismatch: chainid/);
});
test("embedded references inherit event source even when subject source differs", () => {
  const events = scenario();
  for (const e of events.filter((e) => e.subject.id === "search-1")) e.subject.source = "/subject-origin";
  assert.doesNotThrow(() => validateScenario(events));
});
test("guardrail references with explicit default sources identify the same subjects", () => {
  const events = scenario();
  const blocked = events.find((e) => e.context.type.includes("guardrail.blocked"));
  blocked.subject.content.agentRun.source = blocked.context.source;
  blocked.subject.content.evaluatedSubject.source = blocked.context.source;
  assert.doesNotThrow(() => validateScenario(events));
});
test("re-emitting a guardrail decision with a new event ID does not create a new evaluation", () => {
  const events = scenario();
  const copy = structuredClone(events.find((e) => e.context.type.includes("guardrail.triggered")));
  copy.context.id = "duplicate-decision"; events.push(copy);
  assert.throws(() => validateScenario(events), /Repeated lifecycle/);
});

test("every event retains a strict envelope, context and subject after schema reuse", () => {
  const examples = [
    ...globSync(join(ROOT, "conformance/*.json")).map(loadJSON),
    custom(),
  ];
  for (const seed of examples) {
    for (const path of [[], ["context"], ["subject"]]) {
      const event = structuredClone(seed);
      let container = event;
      for (const name of path) container = container[name];
      container.unknownField = "unexpected";
      assert.throws(() => validateEvent(event), /additional properties/);
    }
    const event = structuredClone(seed);
    event.context.specversion = "999.0.0";
    assert.throws(() => validateEvent(event), /constant/);
  }
});

test("core content stays strict while custom subject content remains extensible", () => {
  for (const file of globSync(join(ROOT, "conformance/*.json"))) {
    const event = loadJSON(file);
    event.subject.content.unknownField = true;
    assert.throws(() => validateEvent(event), /additional properties/);
  }
  const event = custom(); event.subject.content.frameworkSpecific = { nested: true };
  assert.doesNotThrow(() => validateEvent(event));
});

test("both guardrail predicates require tool stage to target a toolCall", () => {
  for (const predicate of ["triggered", "blocked"]) {
    const event = fixture(`conformance/guardrail_${predicate}.json`);
    event.subject.content.stage = "tool";
    for (const type of ["agentRun", "modelInvocation"]) {
      event.subject.content.evaluatedSubject.type = type;
      assert.throws(() => validateEvent(event), /constant/);
    }
    event.subject.content.evaluatedSubject.type = "toolCall";
    assert.doesNotThrow(() => validateEvent(event));
  }
});
