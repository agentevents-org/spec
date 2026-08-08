# AgentEvents

AgentEvents is a common specification for describing the runtime activity of AI
agents — agent runs, tool calls, and model invocations — as
[CloudEvents](https://github.com/cloudevents/spec).

## Background

AI agent frameworks (LangChain, CrewAI, AutoGen, the OpenAI Agents SDK, the
Claude Agent SDK, and many in-house systems) each emit their own shape of
telemetry for what an agent did: which tools it called, which model it
invoked, whether a run succeeded. There is no common way to describe this
activity, which means every consumer — observability platforms, evaluation
tooling, cost dashboards, audit systems — has to write a bespoke integration
per framework.

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
- [`governance.md`](governance.md) — how decisions get made.

## Status

This is an early, `0.1.0-draft` specification. Expect breaking changes.
The core vocabulary covers `agentRun`, `toolCall`, `modelInvocation`,
`agentHandoff`, and `guardrail`, and events can be connected with causal
[links](links.md). Planned next steps: a broader vocabulary (memory
operations, human-in-the-loop approvals) and reference SDKs.

## License

[Apache License 2.0](LICENSE)
