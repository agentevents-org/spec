# Custom Event Types

## Introduction

AgentEvents brings standardization for events consumed and produced by AI
agent frameworks and runtimes. Some of these frameworks already produce
events, in their own specific formats. Some of these events exist or can be
mapped to events available in the AgentEvents [core vocabulary](../core.md).
Some events might be added to AgentEvents, if they're considered for
interoperability by the community. Some events, however, are very specific
to a framework or are not relevant from an interoperability point of view.

Custom event types exist as a means to make it easier for frameworks to
adopt AgentEvents and provide event producers and consumers with a
consistent way to produce and consume events aligned to the AgentEvents
specification.

To ensure interoperability, frameworks should use events available in the
AgentEvents specification as much as possible. Missing events can be
proposed to the community and included in future releases. Custom events
are meant for events that are strictly framework-specific and thus not good
candidates for the core vocabulary.

Custom events can be used as an interim solution until new events are
included in the AgentEvents specification. When considering this option,
please note that migrating from custom events to core AgentEvents may be
disruptive for both event consumers and producers, so it's not recommended
to use interim custom events at a large scale.

### Specification

The following features of the specification are related to custom events:

- **The `dev.agenteventsx` event-type namespace**: reserved for events that
  are compliant with the AgentEvents specification, whose subject structure
  and semantics are defined outside of AgentEvents.
- **The [`schemaUri`](../spec.md#schemauri) property in the `context`**:
  events may supply their schema URI via this `context` property. Events
  must **always** validate against the AgentEvents official
  [custom schema](schema.json) too.
- **The [`dev.agenteventsx` jsonschema](schema.json)**: any event of type
  `dev.agenteventsx.*` must respect this schema as well as any additional
  schema supplied via `schemaUri`.
- **The `subject` format for `dev.agenteventsx` events**: subjects must be in
  the format `<framework-name>-<subject-name>` to avoid event-type conflicts
  across frameworks.
- **The [registry](registry.md)**: maintainers of `dev.agenteventsx`
  specifications are encouraged to add their specification to the shared
  [registry](registry.md).

### Versioning

Similar to regular AgentEvents, custom AgentEvents include two versions:

- The specification version: this indicates the base AgentEvents-defined
  [schema](schema.json) that is adopted by the event.
- The event version: this must follow semantic versioning (see
  [`governance.md`](../governance.md#versioning)). Changes of versions for
  custom AgentEvents are decoupled from AgentEvents releases.

### SDKs

When consuming (parsing) an event with `context.schemaUri`, SDKs SHOULD
fetch the schema defined in `context.schemaUri` and **additionally**
validate the event against that schema, unless security concerns dictate
otherwise.

When consuming (parsing) an event with a `dev.agenteventsx` type, SDKs will
return an object that is identical in structure for all events, and which
includes an unparsed blob for the `subject.content` part. SDKs MAY provide a
way for users to register a function to parse the `subject.content` of
these messages.

## Transitioning Custom AgentEvents to Standard AgentEvents

In certain cases, custom events may be implemented as a stopgap solution to
allow for faster AgentEvents adoption. The custom event may eventually make
its way into the AgentEvents specification, with a structure that could
differ from the original one defined in the custom event.

### Promoting a Custom AgentEvent to a Standard AgentEvent

To create a new AgentEvent, start with an issue:

- Propose the new event in a GitHub issue. Attach relevant use cases and
  context from the corresponding custom event, and highlight why the event
  would be beneficial from an interoperability point of view.
- Create a pull request that adds the event to the relevant vocabulary
  document (see [`governance.md`](../governance.md#adding-or-changing-an-event-type)
  for the full checklist: vocabulary entry, JSON Schema, conformance
  fixture).
- Once merged, the new event is available in the spec.

## Example of a Custom Event

The following example shows how an existing framework-specific event can be
adapted into an AgentEvents custom event. It's based on the kind of internal
callback event a LangChain-based application might emit, which would not be
a good fit for the AgentEvents core vocabulary.

Original framework-specific event:

```json
{
  "event": "on_chain_end",
  "run_id": "5328c37f-bb7e-4bb7-84ea-9f5f85e4a7ce",
  "chain_type": "AgentExecutor",
  "tags": ["research", "web-search"],
  "parent_run_id": null
}
```

Corresponding AgentEvent using a `dev.agenteventsx.*` type:

```json
{
  "context": {
    "specversion": "0.1.0-draft",
    "id": "271069a8-fc18-44f1-b38f-9d70a1695819",
    "source": "/staging/langchain-app",
    "type": "dev.agenteventsx.langchain-callback.finished.0.1.0",
    "timestamp": "2026-08-05T17:31:05.315384Z",
    "schemaUri": "https://myorg.com/agenteventsx/schema/langchain-callback/finished/0_1_0"
  },
  "subject": {
    "id": "callback-9f5f85e4",
    "source": "/staging/langchain-app",
    "content": {
      "chainType": "AgentExecutor",
      "runId": "5328c37f-bb7e-4bb7-84ea-9f5f85e4a7ce",
      "tags": ["research", "web-search"]
    }
  }
}
```

Once "chain finished" style events are proposed and merged into the core
vocabulary, producers can migrate to emitting standard `agentRun.finished`
or `toolCall.finished` events instead, carrying framework-specific detail
(like `chainType`) in [`customData`](../spec.md#agentevents-custom-data)
during the transition.
