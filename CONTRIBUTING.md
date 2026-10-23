# Contributing

Use [repository issues](https://github.com/agentevents-org/spec/issues) to
propose changes and ask questions. The maintainer is
[@link108](https://github.com/link108), listed in [CODEOWNERS](CODEOWNERS);
governance describes the consensus and review process.
This project does not claim CNCF or CDF affiliation.

## Local validation

Use Node.js 20 or newer. From the repository root:

```sh
npm --prefix tools ci
npm --prefix tools run validate
```

Validation compiles every event and link schema locally, checks positive
and negative fixtures, validates the structured CloudEvent example, checks
the closed integration scenario, and runs contract regression tests.
Schema validation alone cannot establish delivery guarantees or the behavior
of an SDK. The tools never fetch a producer-supplied schema URI.

## Changes

Describe the consumer use case and before/after behavior in your issue or
pull request. Changes to a contract should update its prose, schema (including
shared definitions under `schemas/common/`), positive example and relevant negative/regression cases together. Explain
compatibility implications, including any change to this unreleased draft.
Run local validation before requesting review. Maintainers merge after rough
consensus, as described in [governance](governance.md).

## Schema distribution

Use schemas from the same tagged release or repository revision as the
specification. Keep `schemas/common/` and `schemas/links/` alongside event
schemas so relative references resolve offline. Custom events also use those schemas;
their `$id` values establish the resolution base. HTTPS `$id` values identify
schemas and do not promise a hosted endpoint. Configure consumers with local
schema registries rather than relying on public URL availability.

The project domain is `agent-events.dev`; private reports go to
[cameron@agent-events.dev](mailto:cameron@agent-events.dev). Hosted schema
distribution and repository permissions remain operational checks; see
[release checklist](RELEASE-CHECKLIST.md).
