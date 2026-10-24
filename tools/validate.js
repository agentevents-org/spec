#!/usr/bin/env node
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Validate schemas, positive/negative fixtures, envelopes and closed scenarios.
import { basename, join, relative } from "node:path";
import { globSync } from "glob";
import { ROOT, loadJSON, schemaCount, validateEvent, validateSchema, validateEnvelope, validateScenario } from "./lib/validation.js";

let failed = 0;
let checked = 0;
console.log(`${schemaCount} schemas compiled locally`);
// The optional fourth entry must pass first: semantic fixtures are
// schema-valid but violate a rule enforced in code.
for (const [pattern, validate, invalid, precondition] of [
  ["conformance/*.json", validateEvent, false],
  ["custom/conformance.json", validateEvent, false],
  ["conformance/scenarios/*.json", validateScenario, false],
  ["conformance/envelopes/*.json", validateEnvelope, false],
  ["conformance/invalid/*.json", validateSchema, true],
  ["conformance/semantic/*.json", validateEvent, true, validateSchema],
]) {
  for (const file of globSync(join(ROOT, pattern)).sort()) {
    checked++;
    try {
      const fixture = loadJSON(file);
      if (pattern === "conformance/*.json") {
        const [subject, predicate] = basename(file, ".json").split("_");
        if (!fixture.context?.type?.startsWith(`dev.agent-events.${subject}.${predicate}.`)) {
          throw new Error("Fixture filename does not match its event type");
        }
      }
      if (precondition) precondition(fixture);
      let error;
      try { validate(fixture); } catch (e) { error = e; }
      if (invalid ? !error : error) throw error ?? new Error("Invalid fixture unexpectedly accepted");
      console.log(`PASS ${relative(ROOT, file)}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${relative(ROOT, file)}: ${error.message}`);
    }
  }
}
console.log(`${checked - failed}/${checked} fixtures and scenarios passed`);
process.exitCode = failed ? 1 : 0;
