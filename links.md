<!--
---
linkTitle: "Links"
weight: 90
hide_summary: true
icon: "fa-solid fa-link"
description: >
   Connecting AgentEvents with causal links
---
-->
# Connecting Events — Links <!-- omit in toc -->

## Abstract <!-- omit in toc -->

AI agent execution is inherently causal: a `modelInvocation` decides to make
a `toolCall`; a `toolCall`'s result feeds back into the next
`modelInvocation`; one `agentRun` may hand off to another agent's run via
`agentHandoff`. The [`agentRun` reference](core.md) embedded in `toolCall`,
`modelInvocation`, and `agentHandoff` subjects connects a child event to its
parent run, but not one event to the specific event that caused it, and not
events across agent handoffs into a single end-to-end trace. Links, and the
[`chainId`](spec.md#chainid) context attribute, close that gap.

This document defines the normative shape of the `links` context attribute
introduced in [`spec.md`](spec.md#links). It is scoped down from
[CDEvents' links proposal](https://github.com/cdevents/spec/blob/main/links.md)
to the parts needed for a first, useful version: links are always embedded
directly in the AgentEvent that carries them (no standalone link-service
payloads, no cross-domain `domainId` linking, no separate `START` link
type). Those remain candidates for a future revision if a standalone
links-service use case emerges.

## Table Of Contents <!-- omit in toc -->

<!-- toc -->
- [Overview](#overview)
- [chainId](#chainid)
- [Link Types](#link-types)
  - [Path Link](#path-link)
  - [Relation Link](#relation-link)
  - [End Link](#end-link)
- [Examples](#examples)
<!-- /toc -->

## Overview

Every link object refers to another AgentEvent by its
[`context.id`](spec.md#id-context), called a `contextId` in link objects.
Each `from` or `target` endpoint MAY also contain `source` (a non-empty
URI-reference). When omitted, it defaults to the containing event's
`context.source`. Producers MUST include it when linking to a different
source. A shared `chainId` groups events but never makes bare IDs globally
unique. Link endpoints identify events by `(source, contextId)`; embedded
subject references identify subjects by `(source, id)`.

For example, `/runtime/a` and `/runtime/b` can both emit event `"1"` in one
chain. A link in `/runtime/b` to the first source MUST use
`{"contextId": "1", "source": "/runtime/a"}`. See the
[checked scenario](conformance/scenarios/handoff.json).

There is no separate `START` link type: since every AgentEvent already
carries its own `context.id`, the earliest observed event
is only a partial view of the chain and MUST NOT be assumed to be its start.
An explicit `END` link type does exist, because inferring the end of a chain is not generally
possible (a chain may have gaps, branches, or simply stop being observed).

## chainId

[`chainId`](spec.md#chainid) groups all AgentEvents belonging to the same
end-to-end trace. Typically a producer generates one `chainId` per top-level
`agentRun` and propagates it to every event caused by that run, including
across `agentHandoff` boundaries into other agents' runs — this is what lets
a consumer reconstruct a full multi-agent trace even though each `agentRun`
already scopes its own `toolCall`s and `modelInvocation`s independently via
the embedded `agentRun` reference.

If an event has no `chainId`, consumers MUST NOT assume it is related to any
other event by chain; `links` (below) may still connect it explicitly.

## Link Types

Endpoints in the tables below MAY also include `source`, with the default
defined in [Overview](#overview). All link objects share two fields:

| Name | Description |
|------|-------------|
| `linkType` | REQUIRED. One of `PATH`, `RELATION`, or `END`. |
| `tags` | OPTIONAL. A map of string keys to string values, for producer-defined metadata about the link itself (not the linked event). |

### Path Link

A `PATH` link indicates that this event directly follows another event on
some path — most commonly, the previous predicate of the same subject (e.g.
`toolCall.started` → `toolCall.finished`), but it MAY also connect different
subjects (e.g. the `agentHandoff.finished` that led to this `agentRun.started`).

| Name | Description |
|------|-------------|
| `from` | REQUIRED. `{ "contextId": "<id of the preceding event>" }` |

### Relation Link

A `RELATION` link adds contextual meaning to why two events are connected,
via a free-form `linkKind` — for example `TRIGGER` to say "this event was
caused by that one". AgentEvents does not close the set of valid
`linkKind` values; producers are encouraged to reuse existing ones where
applicable (`TRIGGER` is the one used throughout this spec's own examples).
`RETRY` points from an event of a new execution attempt to an event of the
attempt it replaces (see
[delivery and execution identity](spec.md#delivery-and-execution-identity)).

| Name | Description |
|------|-------------|
| `linkKind` | REQUIRED. Free-form string describing the relationship, e.g. `TRIGGER`. |
| `target` | REQUIRED. `{ "contextId": "<id of the related event>" }` |

### End Link

An `END` link declares that the producer responsible for the chain considers
its execution complete. An event containing `END` MUST have `chainId`.
The responsible producer MUST account for joined child work before declaring
completion. Detached work that can outlive the chain MUST use a separate
chain (and MAY link back to the originating event).

An `END` can arrive before earlier events or while events are missing. It
MUST NOT be interpreted as proof of delivery, complete history or retention.
`from`, when present, points to the last event of joined work whose
completion led the producer to declare the chain complete (for example, the
final child run's `finished`). It may differ from this event's own `PATH`
predecessor, and it is not a reference to all branches or the chain's start.
A consumer needing complete history requires an application-level delivery
or reconciliation protocol.

| Name | Description |
|------|-------------|
| `from` | OPTIONAL. `{ "contextId": "<id of the preceding event>" }`, if applicable. |

## Examples

A `toolCall.started` event that was triggered by a specific
`modelInvocation.finished` event, both part of the same chain:

```json
{
  "context": {
    "specversion": "0.1.0-draft",
    "id": "a234-1234-1234",
    "chainId": "7ff3f526-1a0e-4d35-8a4c-7d6295e97359",
    "source": "/staging/my-agent-runtime",
    "type": "dev.agentevents.toolcall.started.0.1.0-draft",
    "timestamp": "2026-08-05T17:31:12Z",
    "links": [
      {
        "linkType": "RELATION",
        "linkKind": "TRIGGER",
        "target": {
          "contextId": "d567-4567-4567"
        }
      }
    ]
  },
  "subject": {
    "id": "call-456",
    "content": {
      "toolName": "search_web",
      "agentRun": { "id": "run-1234", "source": "/staging/my-agent-runtime" }
    }
  }
}
```

The `agentRun.finished` event declaring completion of the same chain, after
the handoff-finished fixture (`f789-6789-6789`):

```json
{
  "context": {
    "specversion": "0.1.0-draft",
    "id": "fb455028-a876-430e-a5ff-4b2ece77e827",
    "chainId": "7ff3f526-1a0e-4d35-8a4c-7d6295e97359",
    "source": "/staging/my-agent-runtime",
    "type": "dev.agentevents.agentrun.finished.0.1.0-draft",
    "timestamp": "2026-08-05T17:31:42Z",
    "links": [
      {
        "linkType": "END",
        "from": {
          "contextId": "f789-6789-6789"
        }
      }
    ]
  },
  "subject": {
    "id": "run-1234",
    "content": {
      "agentName": "research-assistant",
      "outcome": "success"
    }
  }
}
```
