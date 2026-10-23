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
community specification projects. This describes the process and does not
claim affiliation with CNCF or CDF:

- **Openness** — participation is open to anyone; discussion and decisions
  happen in public, in this repository.
- **Consensus** — changes are proposed as pull requests and merged once
  maintainers agree there is rough consensus and no unresolved objections.
- **Compatibility** — breaking changes to a released (non-draft) event type
  require a new major version once the type reaches 1.0. Before 1.0, a new
  minor version MAY introduce breaking changes. Published releases cannot
  be changed in place.

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
  of the overall specification version, following semantic versioning. Once the type reaches 1.0:
  - **patch**: clarifications that don't change the schema
  - **minor**: additions that do not change existing semantics (new OPTIONAL
    fields). Strict schemas still reject unknown fields, so consumers need the
    new schema or a tolerant consumer profile to accept them (see
    [Consumer compatibility](#consumer-compatibility))
  - **major**: breaking changes (new REQUIRED fields, removed/renamed fields,
    changed semantics)

During initial development (`0.x`), minor versions MAY introduce breaking
changes. Prereleases such as `0.1.0-draft` are unstable; changes in this
unreleased working draft are proposals until a release is tagged. The
specification and event versions are independent even when their numbers
coincide. Prerelease and build suffixes follow [SemVer 2.0.0](https://semver.org/).

### Consumer compatibility

The published JSON Schemas are strict producer schemas for exact versions.
They are not forward-compatible consumer schemas. Each consumer MUST be
configured with the specification and event versions it supports, typically
through deployment configuration; an application-level capability exchange
MAY be used where the transport allows one. Consumers MUST select the
matching versioned schema and MUST NOT validate a
newer event against an older strict schema. Unsupported versions MUST be
rejected or quarantined with an explicit unsupported-version result; they
MUST NOT be silently interpreted as the nearest known version.

Supporting an OPTIONAL feature's semantics is distinct from accepting its
syntax in a supported version. A consumer MAY ignore supported-version
OPTIONAL fields after validation. A future compatible minor release still
requires a matching schema (or an explicitly documented tolerant consumer
profile); compatibility does not imply that an older strict schema accepts
newer events. No automatic minor-version compatibility is promised for `0.x`.
The maintainer decision is to keep strict consumer validation for the current
`0.x` draft. Revisit whether to publish a tolerant consumer profile before
1.0, informed by adapter experience and community feedback.

For example, if a future compatible minor version adds an optional
`deploymentName` field, an older strict schema rejects that unknown field
(and the new event type version). A tolerant consumer profile would define
which newer versions a consumer can accept and which unknown fields it can
ignore while still checking required fields and known value types. It would
not mean accepting arbitrary versions or skipping validation. This draft
publishes strict schemas only; a second profile is not needed for initial
community feedback.
