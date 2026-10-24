# AgentEvents

AgentEvents is a common specification for describing AI agent lifecycle activity
across harnesses, tools, model services, governance services, and management
platforms as [CloudEvents](https://github.com/cloudevents/spec).

## Background

Agent harnesses, frameworks, gateways, and policy services each describe
their own part of an agent's activity: which tools it called, which model it
invoked, which decisions governed its actions, and whether a run succeeded.
Management platforms need to connect that activity across component boundaries.
OpenTelemetry already defines GenAI conventions for observing much of this
activity. AgentEvents complements
those conventions with a CloudEvents vocabulary that applications can
subscribe to and process independently: for example, a live run interface
consuming lifecycle updates, or a policy/evaluation pipeline consuming
activity from several runtimes. See [OpenTelemetry interoperability](otel.md).

[CloudEvents](https://github.com/cloudevents/spec) already solves the generic
envelope problem (how to identify, route and transport an event) but
deliberately leaves the payload opaque. AgentEvents does for AI agent activity
what [CDEvents](https://github.com/cdevents/spec) did for continuous delivery:
it defines a vocabulary of *subjects* (the things that happen — an agent run,
a tool call, a model invocation) and *predicates* (what happened to them —
queued, started, finished), carried as the `data` payload of a CloudEvent.

## Specification

The specification is a work in progress. Key documents:

- [`spec.md`](spec.md) — the AgentEvents context and subject model, common to
  every event type.
- [`core.md`](core.md) — the core vocabulary: `agentRun`, `toolCall`, and
  `modelInvocation`.
- [`cloudevents-binding.md`](cloudevents-binding.md) — how AgentEvents map onto
  CloudEvents context attributes.
- [`links.md`](links.md) — how to connect related AgentEvents with `chainId`
  and `links` (e.g. the `toolCall` that a `modelInvocation` triggered).
- [`custom/`](custom/README.md) — how frameworks and vendors define
  tool-specific custom events that stay compatible with AgentEvents.
- [`schemas/`](schemas) — JSON Schema for every event type.
- [`conformance/`](conformance) — example event payloads, one per event type,
  used to validate the schemas and as SDK test fixtures.
- [`otel.md`](otel.md) — OpenTelemetry mappings and trace correlation.
- [`Lifecycle contract plan`](proposals/lifecycle-contracts.md) — proposed
  connection points and contract work, grounded in AAIF project interfaces.
- [`conformance/scenarios/`](conformance/scenarios/) — a checked integration scenario.
- [`governance.md`](governance.md) — how decisions get made.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — local validation and contribution process.

## Status

This is an early, `0.1.0-draft` specification. Expect breaking changes.
The core vocabulary covers `agentRun`, `toolCall`, `modelInvocation`,
`agentHandoff`, and `guardrail`, and events can be connected with causal
[links](links.md). The [lifecycle contract plan](proposals/lifecycle-contracts.md)
sets out proposed support for harness, governance, approval, delegation,
context, and environment boundaries, with token usage as an optional extension.
The plan does not add event types or change the current schemas.

## License

[Apache License 2.0](LICENSE)
