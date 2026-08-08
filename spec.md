<!--
---
linkTitle: "Common Metadata"
weight: 30
icon: "fas fa-info-circle"
hide_summary: true
description: >
    Introduction to AgentEvents and specification of common metadata
---
-->
# AgentEvents

## Abstract

AgentEvents is a common specification for describing the runtime activity of
AI agents as [CloudEvents][cloudevents-spec].

## Table of Contents

<!-- toc -->
- [Overview](#overview)
- [Notations and Terminology](#notations-and-terminology)
  - [Notational Conventions](#notational-conventions)
  - [Terminology](#terminology)
    - [Event](#event)
    - [Subject](#subject)
    - [Predicate](#predicate)
  - [Types](#types)
- [AgentEvent context](#agentevent-context)
  - [REQUIRED Context Attributes](#required-context-attributes)
    - [id (context)](#id-context)
    - [type (context)](#type-context)
    - [source (context)](#source-context)
    - [timestamp](#timestamp)
    - [specversion](#specversion)
  - [OPTIONAL Context Attributes](#optional-context-attributes)
    - [schemaUri](#schemauri)
    - [chainId](#chainid)
    - [links](#links)
  - [Context example](#context-example)
- [AgentEvent subject](#agentevent-subject)
  - [REQUIRED Subject Attributes](#required-subject-attributes)
    - [id (subject)](#id-subject)
    - [content](#content)
  - [OPTIONAL Subject Attributes](#optional-subject-attributes)
    - [source (subject)](#source-subject)
  - [Subject example](#subject-example)
- [AgentEvents custom data](#agentevents-custom-data)
  - [OPTIONAL Custom Data attributes](#optional-custom-data-attributes)
    - [customData](#customdata)
    - [customDataContentType](#customdatacontenttype)
  - [Examples](#examples)
    - [JSON Data](#json-data)
    - [Generic Data](#generic-data)
- [Vocabulary](#vocabulary)
<!-- /toc -->

## Overview

Each AgentEvent is structured into two mandatory parts:

- The [*context*](#agentevent-context): its structure is common to all
  AgentEvents
- The [*subject*](#agentevent-subject): part of its root structure is common
  to all AgentEvents, some of its content varies from event to event, as
  described in the *vocabulary*

plus two optional attributes `customData` and `customDataContentType`, that
host [*AgentEvents custom data*](#agentevents-custom-data).

The specification is structured in two main parts:

- [This](#agentevents) document describes the parts of the spec that are
  common to __all__ events:
  - The [*context*](#agentevent-context), made of mandatory and optional
    *attributes*
  - The common part of the [*subject*](#agentevent-subject)
  - How to include custom / additional [*data*](#agentevents-custom-data) in
    an AgentEvent

- The [*vocabulary*](#vocabulary) describes *event types*, with their event
  specific mandatory and optional attributes. These attributes are all
  located in the [*subject*](#agentevent-subject) object within the event.

For the mapping of AgentEvents onto CloudEvents, see the
[CloudEvents binding](cloudevents-binding.md).

## Notations and Terminology

### Notational Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

For clarity, when a feature is marked as "OPTIONAL" this means that it is
OPTIONAL for both the [Producer][producer] and [Consumer][consumer] of a
message to support that feature. In other words, a producer can choose to
include that feature in a message if it wants, and a consumer can choose to
support that feature if it wants. A consumer that does not support that
feature will then silently ignore that part of the message. The producer
needs to be prepared for the situation where a consumer ignores that feature.
An [Intermediary][intermediary] SHOULD forward OPTIONAL attributes.

### Terminology

__Note__: AgentEvents adopts, wherever applicable, the terminology used by
[CloudEvents][cloudevents-spec]. Specifically, the following terms are
borrowed from the CloudEvents spec:

- [*Occurrence*][occurrence]
- [*Producer*][producer]
- [*Source*][source]
- [*Consumer*][consumer]
- [*Intermediary*][intermediary]

The AgentEvents specification additionally defines the following terms:

#### Event

An "event" is a data record expressing an occurrence and its context. Events
are routed from an event producer (the source) to interested event
consumers. The routing can be performed based on information contained in
the event, but an event will not identify a specific routing destination.

#### Subject

The "subject" is the entity with which the occurrence in an AI agent system
is concerned. For instance when an agent starts executing, the agent run is
the subject of the occurrence, or when a tool is invoked, the tool call is
the subject. Subjects have a list of *attributes* associated, defined in the
[vocabulary](#vocabulary). Subjects belong to two main categories:

- long running, which stay in a running state until they're purposely
  stopped or encounter a failure or a condition that prevents them from
  running
- run to completion, which independently stop after they accomplished (or
  failed to) a specific task, or encounter a failure or a condition that
  prevents them from continuing — for example an agent run, a tool call, or
  a model invocation

#### Predicate

A "predicate" is what happened to a subject in an occurrence. For instance
in the case of an agent run, started is a valid predicate, or in the case of
a tool call, finished is a valid predicate. Valid predicates are defined in
the [vocabulary](#vocabulary).

### Types

Attributes in AgentEvents are typed. AgentEvents uses the
[type system][typesystem] defined by the CloudEvents project, plus some
AgentEvents specific types:

- `Enum`: an attribute of type `String`, constrained to a fixed set of
  options
- `List`: a list of values of the same type
- `Object`: a map of (key, value) tuples
  - Keys are of type `String`. Valid keys can be defined by this spec
  - Values can be any of the other kinds
  - An object key is referred to as an "attribute"

Object key names are by convention defined in
[camelCase](https://en.wikipedia.org/wiki/Camel_case).

## AgentEvent context

### REQUIRED Context Attributes

The following context attributes are REQUIRED to be present in all the
events defined in the [vocabulary](#vocabulary):

#### id (context)

- Type: [`String`][typesystem]
- Description: Identifier for an event. Subsequent delivery attempts of the
  same event MAY share the same [`id`](#id-context). This attribute matches
  the syntax and semantics of the [`id`][ce-id] attribute of CloudEvents.

- Constraints:
  - REQUIRED
  - MUST be a non-empty string
  - MUST be unique within the given [`source`](#source-context) (in the
    scope of the producer)
- Examples:
  - A [UUID version 4](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random))

#### type (context)

- Type: [`String`][typesystem]
- Description: defines the type of event, as a combination of a *subject*,
  *predicate* and *version*. Valid event types are defined in the
  [vocabulary](#vocabulary).

  All event types should be prefixed with `dev.agentevents.`. One occurrence
  may have multiple events associated, as long as they have different event
  types. *Versions* are semantic in the *major.minor.patch* format (`M.m.p`).

  In addition to `dev.agentevents.`, event types prefixed with
  `dev.agenteventsx.` can be defined in specifications outside of
  AgentEvents. Events that use these event types are known as
  ["custom events"](custom/README.md).

- Constraints:
  - REQUIRED
  - `dev.agentevents.` types MUST be defined in the [vocabulary](#vocabulary)
  - `dev.agenteventsx.` types SHOULD be defined in a third party
    specification

- Examples:
  - `dev.agentevents.agentrun.started.0.1.0-draft`
  - `dev.agentevents.toolcall.finished.0.1.0-draft`
  - `dev.agentevents.<subject>.<predicate>.M.m.p`
  - `dev.agenteventsx.langchain-callback.finished.0.1.0`
  - `dev.agenteventsx.<framework>-<subject>.<predicate>.M.m.p`

#### source (context)

- Type: [`URI-Reference`][typesystem]
- Description: defines the context in which an event happened. The main
  purpose of the source is to provide global uniqueness for
  [`source`](#source-context) + [`id`](#id-context).

  The source MAY identify a single producer or a group of producers that
  belong to the same application.

- Constraints:
  - REQUIRED
  - MUST be a non-empty URI-reference
  - An absolute URI is RECOMMENDED

- Examples:
  - If there is a single "context" (application, cluster, or platform of
    some kind)
    - `/staging/my-agent-runtime`
    - `https://agents.example.com/`
  - If there are multiple "contexts":
    - `/team-a/langgraph-1`
    - `/tenant1/crewai-prod`

#### timestamp

- Type: [`Timestamp`][typesystem]
- Description: defines the time of the occurrence. When the time of the
  occurrence is not available, the time when the event was produced MAY be
  used.

  In case the transport layer requires a re-transmission of the event, the
  timestamp SHOULD NOT be updated, i.e. it should be the same for the same
  [`source`](#source-context) + [`id`](#id-context) combination.

- Constraints:
  - REQUIRED
  - MUST adhere to the format specified in
    [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339)

#### specversion

- Type: `String`
- Description: The version of the AgentEvents specification which the event
  uses. This enables the interpretation of the context. Compliant event
  producers MUST use a value of `0.1.0-draft` when referring to this version
  of the specification.

- Constraints:
  - REQUIRED
  - MUST be a non-empty string

### OPTIONAL Context Attributes

#### schemaUri

- Type: [`URI`][typesystem]
- Description: link to a `jsonschema` schema that further refines the event
  schema as defined by AgentEvents.

  The schema provided by `schemaUri` MUST be stricter than the AgentEvents
  one, and thus MUST NOT allow elements that would not be allowed by the
  AgentEvents schema. For example, the schema at `schemaUri` could restrict
  a `string` field to a specific `Enum`.

  Consumers of events that specify a `schemaUri` SHOULD validate the event
  against the AgentEvents schema as well as the additional schema provided.
  If the consumer does not have access to the URI specified, it SHOULD fail
  to validate the event.

- Constraints:
  - OPTIONAL
  - When specified, it MUST be a non-empty URI
  - An absolute URI is REQUIRED

- Examples:
  - `https://myorg.com/agentevents/schema/toolcall-finished-0-1-0`

#### chainId

- Type: [`String`][typesystem]
- Description: Identifier for a chain of related AgentEvents, as defined in
  the [links spec](links.md). Typically used to group all events belonging
  to the same end-to-end trace, for example one user request that spans
  multiple `agentRun`s connected by `agentHandoff`s.

- Constraints:
  - OPTIONAL
- Examples:
  - A [UUID version 4](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random))

#### links

- Type: [`List`][typesystem]
- Description: A list of link objects, as defined in the
  [links spec](links.md), connecting this event to other AgentEvents with
  `PATH`, `RELATION`, or `END` relationships.

- Constraints:
  - OPTIONAL

- Examples:
  - A relation link indicating that this `toolCall` was triggered by a
    specific `modelInvocation`:

    ```json
    [
      {
        "linkType": "RELATION",
        "linkKind": "TRIGGER",
        "target": {
          "contextId": "5328c37f-bb7e-4bb7-84ea-9f5f85e4a7ce"
        }
      }
    ]
    ```
  - A path link connecting this event to the one that directly preceded it
    in the same chain:

    ```json
    [
      {
        "linkType": "PATH",
        "from": {
          "contextId": "271069a8-fc18-44f1-b38f-9d70a1695819"
        }
      }
    ]
    ```
  - An end link signaling that this event ends its chain:

    ```json
    [
      {
        "linkType": "END",
        "from": {
          "contextId": "fb455028-a876-430e-a5ff-4b2ece77e827"
        }
      }
    ]
    ```

### Context example

This is an example of a full AgentEvent context, rendered in JSON format:

```json
{
  "context": {
    "specversion": "0.1.0-draft",
    "id": "A234-1234-1234",
    "source": "/staging/my-agent-runtime",
    "type": "dev.agentevents.agentrun.started.0.1.0-draft",
    "timestamp": "2026-08-05T17:31:00Z"
  }
}
```

## AgentEvent subject

### REQUIRED Subject Attributes

The following subject attributes are REQUIRED to be present in all the
events defined in the [vocabulary](#vocabulary):

#### id (subject)

- Type: [`String`][typesystem]
- Description: Identifier for a subject. Subsequent events associated to the
  same subject MUST use the same subject [`id`](#id-subject).

- Constraints:
  - REQUIRED
  - MUST be a non-empty string
  - MUST be unique within the given [`source`](#source-subject) (in the
    scope of the producer)
- Examples:
  - A [UUID version 4](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random))

#### content

- Type: [`Object`](#types)
- Description: This provides all the relevant details of the
  [`content`](#content). The format of the [`content`](#content) depends on
  the event [`type`](#type-context). All attributes in the subject
  [`content`](#content), REQUIRED and OPTIONAL ones, MUST comply with the
  specification from the [vocabulary](#vocabulary). The
  [`content`](#content) may be empty.

- Constraints:
  - REQUIRED

- Example:
  - Considering the event type
    `dev.agentevents.toolcall.started.0.1.0-draft`, an example of subject,
    serialized as JSON, is:

    ```json
    "content": {
      "toolName": "search_web",
      "agentRun": { "id": "run-123" }
    }
    ```

### OPTIONAL Subject Attributes

#### source (subject)

- Type: [`URI-Reference`][typesystem]
- Description: defines the context in which the subject originated. In most
  cases the [`source`](#source-subject) of the subject matches the
  [`source`](#source-context) of the event. This field should be used only
  in cases where the [`source`](#source-subject) of the *subject* is
  different from the [`source`](#source-context) of the event.

  The format and semantics of the *subject* [`source`](#source-subject) are
  the same as those of the *context* [`source`](#source-context).

### Subject example

The following example shows `context` and `subject` together, rendered as
JSON.

```json
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
      "agentRun": { "id": "run-123", "source": "/staging/my-agent-runtime" }
    }
  }
}
```

## AgentEvents custom data

The `customData` and `customDataContentType` fields can be used to carry
additional data in AgentEvents.

### OPTIONAL Custom Data attributes

#### customData

- Type: This specification does not place any restriction on the type of
  this information.
- Description: custom data. The content of the `customData` field is not
  specified by AgentEvents and typically requires producer-specific
  knowledge to be parsed.

- Constraints:
  - OPTIONAL

- Examples:
  - `{"promptTemplateVersion": "v3"}`

#### customDataContentType

The `customDataContentType` is modelled after the
[CloudEvents `datacontenttype`][ce-contenttype].

- Type: [`String`][typesystem]
- Description: Content type of the `customData` value. This attribute
  enables data to carry any type of content, whereby format and encoding
  might differ from that of the chosen event format.

- Default value: `application/json`

- Constraints:
  - OPTIONAL
  - If present, MUST adhere to the format specified in
    [RFC 2046](https://tools.ietf.org/html/rfc2046)

### Examples

#### JSON Data

Data with the default `application/json` content type can be included
directly in the `customData` field, as in the following example:

```json
{
  "context": { "...": "..." },
  "subject": { "...": "..." },
  "customData": {
    "promptTemplateVersion": "v3",
    "retryCount": 1
  }
}
```

#### Generic Data

Generic (non-JSON) data must be base64 encoded:

```json
{
  "context": { "...": "..." },
  "subject": { "...": "..." },
  "customData": "PHRyYWNlPjwvdHJhY2U+",
  "customDataContentType": "application/xml"
}
```

## Vocabulary

The vocabulary defines *event types*, which are made of *subjects* and
*predicates*. An example of a *subject* is an `agentRun`. The `agentRun` can
be `started` or `finished`, which are the predicates. The `agentRun` is of
type `Object` and has several *attributes* associated; the *event type*
schema defines which ones are mandatory and which ones are optional.

The current vocabulary is defined in [`core.md`](core.md). It covers the
subjects needed to describe an agent's execution: an
[`agentRun`](core.md#agentrun), the [`toolCall`](core.md#toolcall)s it
makes, the [`modelInvocation`](core.md#modelinvocation)s it performs,
[`agentHandoff`](core.md#agenthandoff)s to other agents, and
[`guardrail`](core.md#guardrail) policy/safety checks against its actions.
Future revisions are expected to grow the vocabulary further to cover
memory operations and human-in-the-loop approvals — similar to how
[CDEvents grew its vocabulary][cdevents-spec] in stages after its initial
core release.

[cloudevents-spec]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
[source]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#source
[producer]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#producer
[consumer]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#consumer
[intermediary]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#intermediary
[occurrence]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#occurrence
[typesystem]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#type-system
[ce-id]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#id
[ce-contenttype]: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md#datacontenttype
