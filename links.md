<!--
---
linkTitle: "Links"
weight: 90
hide_summary: true
icon: "fa-solid fa-link"
description: >
   Future work: causal links between AgentEvents
---
-->
# Links (future work)

> __Status__: not yet part of the normative specification. This document is
> a placeholder describing planned work, referenced from
> [`spec.md`](spec.md#optional-context-attributes).

AI agent execution is inherently causal: a `modelInvocation` decides to make
a `toolCall`; a `toolCall`'s result feeds back into the next
`modelInvocation`; one `agentRun` may in the future hand off to another
agent's run. Today, AgentEvents lets consumers infer some of this structure
only indirectly, through the `agentRun` reference embedded in `toolCall` and
`modelInvocation` subjects (see [`core.md`](core.md)) — that connects a
child event to its parent run, but not one event to the specific event that
triggered it.

CDEvents solved the general version of this problem with a
[links specification](https://github.com/cdevents/spec/blob/main/links.md)
that adds `chainId` and `links` context attributes, letting producers
express `PATH`, `RELATION`, and `END` relationships between events.

AgentEvents intends to adopt an equivalent mechanism once the core
vocabulary (see [`core.md`](core.md)) has been validated against real agent
runtimes. Expected shape, subject to change:

- A `links` context attribute: a list of link objects, each pointing at
  another event's `context.id` (+ `source`), with a `linkType` describing
  the relationship (e.g. `TRIGGER`, to say "this `toolCall` was triggered by
  that `modelInvocation`").
- A `chainId` context attribute to group all events belonging to the same
  `agentRun` end-to-end trace, independent of the parent-reference fields
  already present in `toolCall`/`modelInvocation` subjects.

This document will be replaced with the normative specification once the
design is finalized; track progress via the project's issues.
