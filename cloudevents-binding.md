<!--
---
linkTitle: "CloudEvents Binding"
weight: 100
hide_summary: true
icon: "fa-solid fa-arrow-right-arrow-left"
description: >
   CloudEvents Binding for AgentEvents
---
-->
# CloudEvents Binding for AgentEvents <!-- omit in toc -->

## Abstract <!-- omit in toc -->

The CloudEvents Binding for AgentEvents defines how AgentEvents are mapped
to [CloudEvents][ce-spec] headers and body.

## Table Of Contents <!-- omit in toc -->

<!-- toc -->
- [CloudEvents Context](#cloudevents-context)
  - [specversion](#specversion)
  - [id](#id)
  - [source](#source)
  - [type](#type)
  - [subject](#subject)
  - [time](#time)
  - [datacontenttype](#datacontenttype)
  - [dataschema](#dataschema)
- [CloudEvents Data](#cloudevents-data)
  - [Examples](#examples)
<!-- /toc -->

## CloudEvents Context

The CloudEvents context is built by the event producer using data from the
[AgentEvents context](spec.md#agentevent-context).

### specversion

The [CloudEvents `specversion`][ce-version] MUST be set to `1.0`.

### id

The [CloudEvents `id`][ce-id] MUST be set to the AgentEvents
[`id`](spec.md#id-context).

### source

The [CloudEvents `source`][ce-source] MUST be set to the AgentEvents
[`source`](spec.md#source-context).

### type

The [CloudEvents `type`][ce-type] MUST be set to the
[`type`](spec.md#type-context) of the AgentEvent.

### subject

The [CloudEvents `subject`][ce-subject] MUST be set to the
[subject `id`](spec.md#id-subject) of the AgentEvent.

__Note__: since the *subject* is mandatory in AgentEvents, the `subject` in
the CloudEvents format will always be set — even though it's only OPTIONAL
in the CloudEvents specification.

### time

The [CloudEvents `time`][ce-time] MUST be set to the
[`timestamp`](spec.md#timestamp) of the AgentEvent. The CloudEvents
specification allows `time` to be set to either the current time or the
time of the occurrence, but requires all producers to choose the same
option. AgentEvents requires all producers to use the `timestamp` from the
AgentEvent to meet the CloudEvents specification.

### datacontenttype

The [CloudEvents `datacontenttype`][ce-contenttype] is OPTIONAL, its use
depends on the specific CloudEvents binding and mode in use. See the
[event data](#cloudevents-data) section for more details.

### dataschema

The [CloudEvents `dataschema`][ce-dataschema] MAY be set to a URL that
points to the event data [schema](schemas/) included in this specification
for the given event type.

## CloudEvents Data

The content and format of the event data depends on the specific
CloudEvents binding in use. All the examples, unless otherwise stated, refer
to the [HTTP binding][ce-http-binding] in [binary content mode][ce-binary].
In this format, the CloudEvents context is stored in HTTP headers.

The [CloudEvents Event Data][ce-eventdata] MUST include the full
AgentEvent, i.e. [`context`](spec.md#agentevent-context),
[`subject`](spec.md#agentevent-subject), and any
[custom data](spec.md#agentevents-custom-data), rendered as JSON in the
format specified by the [schema](schemas/) for the event type.

[Custom data](spec.md#agentevents-custom-data) of type `application/json`
MUST be embedded as-is in the [`customData`](spec.md#customdata) field.
Data with any other content type MUST be base64 encoded and set as the
value of the [`customData`](spec.md#customdata) field.

In CloudEvents HTTP binary mode, the `Content-Type` HTTP header MUST be set
to `application/json`. In CloudEvents HTTP structured mode, the same
information is carried in the CloudEvents context field `datacontenttype`.

### Examples

Full example of an AgentEvent transported through a CloudEvent in HTTP
*binary* mode:

```text
POST /sink HTTP/1.1
Host: agentevents.example.com
ce-specversion: 1.0
ce-type: dev.agentevents.toolcall.started.0.1.0-draft
ce-time: 2026-08-05T17:31:00Z
ce-id: A234-1234-1234
ce-source: /staging/my-agent-runtime
ce-subject: call-456
Content-Type: application/json; charset=utf-8
Content-Length: nnnn

{
  "context": {
    "specversion": "0.1.0-draft",
    "id": "A234-1234-1234",
    "source": "/staging/my-agent-runtime",
    "type": "dev.agentevents.toolcall.started.0.1.0-draft",
    "timestamp": "2026-08-05T17:31:00Z"
  },
  "subject": {
    "id": "call-456",
    "content": {
      "toolName": "search_web",
      "agentRun": {
        "id": "run-1234",
        "source": "/staging/my-agent-runtime"
      }
    }
  }
}
```

[ce-spec]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
[ce-id]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#id
[ce-version]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#specversion
[ce-source]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#source-1
[ce-type]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#type
[ce-subject]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#subject
[ce-time]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#time
[ce-contenttype]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#datacontenttype
[ce-dataschema]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#dataschema
[ce-http-binding]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/http-protocol-binding.md
[ce-binary]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/http-protocol-binding.md#31-binary-content-mode
[ce-eventdata]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#event-data
