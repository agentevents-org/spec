<!--
---
linkTitle: "Governance"
weight: 110
hide_summary: true
icon: "fa-solid fa-gavel"
description: >
   How AgentEvents is governed
---
-->
# Governance

## Principles

AgentEvents follows the same lightweight, consensus-seeking model used by
[CDEvents](https://github.com/cdevents/spec/blob/main/governance.md) and other
CNCF-style specification projects:

- **Openness** — participation is open to anyone; discussion and decisions
  happen in public, in this repository.
- **Consensus** — changes are proposed as pull requests and merged once
  maintainers agree there is rough consensus and no unresolved objections.
- **Compatibility** — breaking changes to a released (non-draft) event type
  require a new major or minor version of that event type; they cannot be
  made in place.

## Roles

- **Maintainers** — listed in [`CODEOWNERS`](CODEOWNERS). Maintainers review
  and merge pull requests, cut releases, and are responsible for the overall
  technical direction of the spec.
- **Contributors** — anyone who opens an issue or pull request.

## Adding or changing an event type

1. Open an issue describing the subject/predicate being proposed or changed,
   including a concrete use case and, if possible, examples from an existing
   agent framework's own event/telemetry format.
2. Open a pull request that adds:
   - an entry in the relevant vocabulary document (e.g. `core.md`)
   - a JSON Schema under `schemas/`
   - a conformance fixture under `conformance/`
3. A maintainer merges once there is rough consensus.

## Versioning

- The specification as a whole has a `specversion` (see
  [`spec.md`](spec.md#specversion)), currently `0.1.0-draft`.
- Each event `type` carries its own `major.minor.patch` version, independent
  of the overall specification version, following semantic versioning:
  - **patch**: clarifications that don't change the schema
  - **minor**: backwards-compatible additions (new OPTIONAL fields)
  - **major**: breaking changes (new REQUIRED fields, removed/renamed fields,
    changed semantics)
