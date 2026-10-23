# JSON Schemas

Core event schemas use versioned `$id` values and retain their filenames. Each one
refines the shared event envelope with its event type and subject content.
The custom schema in `custom/schema.json` uses the same envelope.

Structural definitions live in [common/definitions.json](common/definitions.json):
context, subject identity, embedded subject and event references, completion
outcomes, guardrail stages/targets, link tags and custom-data encoding rules.
The `_defs/` directory contains vocabulary glossary records, not structural
JSON Schema components.

The shared envelope declares its permitted root, context and subject fields.
Event schemas refine the existing `context.type` and `subject.content` fields
through `allOf`; content requirements and unknown-field rejection remain
specific to each event. Put shared contract changes in `common/definitions.json`
and event-specific changes in the corresponding event schema.

## Offline use

Distribute `schemas/common/` and `schemas/links/` with the event schemas and
`custom/schema.json`. Register every structural schema by `$id` in your local
JSON Schema 2020-12 validator before compiling an event schema. Relative
references resolve against `$id`, not the filesystem path. The repository
validator demonstrates this registration in `tools/lib/validation.js` and
performs no remote schema fetching.

Existing consumers must include the new common schema in their registries
when adopting this revision. Payload shapes and validation rules are unchanged by the structural
refactor. Schema `$id` values use the confirmed
project domain `agent-events.dev`; local registries must register these IDs.
A `$id` is an identifier; it need not be fetched from a public web endpoint.
