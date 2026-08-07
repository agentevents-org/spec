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
// Validates every schema in schemas/*.json compiles, and every conformance
// fixture in conformance/*.json (plus custom/conformance.json) validates
// against its corresponding schema.

import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { globSync } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, "..");
const EXAMPLES_FOLDER = join(ROOT, "conformance");
const SCHEMAS_FOLDER = join(ROOT, "schemas");

function loadJSON(filepath) {
  try {
    return JSON.parse(readFileSync(filepath, "utf8"));
  } catch (error) {
    console.error(`Error loading ${filepath}: ${error.message}`);
    throw error;
  }
}

function createAjv() {
  const ajv = new Ajv2020({
    strict: false,
    validateFormats: true,
    allErrors: true,
  });
  addFormats(ajv);
  return ajv;
}

function testSchemas() {
  console.log("==> Testing Schema Files");

  let schemaFailed = 0;
  const eventSchemaFiles = globSync(join(SCHEMAS_FOLDER, "*.json"));
  const numSchemas = eventSchemaFiles.length + 1; // + custom/schema.json

  for (const schemaFile of eventSchemaFiles) {
    try {
      const ajv = createAjv();
      const schema = loadJSON(schemaFile);
      ajv.compile(schema);
    } catch (error) {
      console.error(`Failed to compile ${schemaFile}: ${error.message}`);
      schemaFailed++;
    }
  }

  try {
    const ajv = createAjv();
    const customSchema = loadJSON(join(ROOT, "custom/schema.json"));
    ajv.compile(customSchema);
  } catch (error) {
    console.error(`Failed to compile custom schema: ${error.message}`);
    schemaFailed++;
  }

  console.log(
    `${numSchemas - schemaFailed} out of ${numSchemas} schemas are valid`,
  );

  return schemaFailed;
}

function testConformance() {
  console.log("\n==> Testing Conformance Files");

  let exampleFailed = 0;
  const exampleFiles = globSync(join(EXAMPLES_FOLDER, "*.json"));
  const numExamples = exampleFiles.length + 1; // + custom/conformance.json

  for (const exampleFile of exampleFiles) {
    const exampleFileName = basename(exampleFile);
    const subjectPredicate = basename(exampleFileName, ".json");
    const [subject, predicate] = subjectPredicate.split("_");
    const schemaFile = join(SCHEMAS_FOLDER, `${subject}${predicate}.json`);

    process.stdout.write(`${subject} ${predicate}: `);

    try {
      const ajv = createAjv();
      const schema = loadJSON(schemaFile);
      const example = loadJSON(exampleFile);
      const validate = ajv.compile(schema);
      const valid = validate(example);

      if (!valid) {
        console.log("invalid");
        console.error(validate.errors);
        exampleFailed++;
      } else {
        console.log("valid");
      }
    } catch (error) {
      console.log("failed");
      console.error(`Error: ${error.message}`);
      exampleFailed++;
    }
  }

  process.stdout.write("custom example: ");
  try {
    const ajv = createAjv();
    const customSchema = loadJSON(join(ROOT, "custom/schema.json"));
    const customExample = loadJSON(join(ROOT, "custom/conformance.json"));
    const validate = ajv.compile(customSchema);
    const valid = validate(customExample);

    if (!valid) {
      console.log("invalid");
      console.error(validate.errors);
      exampleFailed++;
    } else {
      console.log("valid");
    }
  } catch (error) {
    console.log("failed");
    console.error(`Error: ${error.message}`);
    exampleFailed++;
  }

  console.log(
    `${numExamples - exampleFailed} out of ${numExamples} examples are valid`,
  );

  return exampleFailed;
}

try {
  const schemaFailed = testSchemas();
  const exampleFailed = testConformance();

  const totalFailed = schemaFailed + exampleFailed;
  process.exit(totalFailed === 0 ? 0 : 1);
} catch (error) {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}
