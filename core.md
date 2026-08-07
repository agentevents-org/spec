<!--
---
linkTitle: "Core Events"
weight: 40
hide_summary: true
icon: "fa-solid fa-bars-staggered"
description: >
   AgentEvents Core Events
---
-->
# Core Events

Core Events include the subjects and predicates needed to describe the
minimum lifecycle of an AI agent's execution: the agent run itself, the
tools it calls, and the model invocations it makes. These are the events
that any agent runtime can emit regardless of framework, and everything
else in a future, broader vocabulary (handoffs, guardrails, memory,
human-in-the-loop approval) is expected to build on top of them.

## Subjects

An *agent run* is a single end-to-end execution of an agent, from the
moment it starts processing an input to the moment it produces a final
result (or fails). During a run, an agent typically performs one or more
*model invocations* (calls to an underlying LLM to decide what to do next
or to produce a response) and one or more *tool calls* (invocations of
functions/tools available to the agent). AgentEvents identifies three
[*subjects*](spec.md#subject): [`agentRun`](#agentrun),
[`toolCall`](#toolcall), and [`modelInvocation`](#modelinvocation).

| Subject | Description | Predicates |
|---------|-------------|------------|
| [`agentRun`](#agentrun) | An instance of an agent's execution | [`queued`](#agentrun-queued), [`started`](#agentrun-started), [`finished`](#agentrun-finished) |
| [`toolCall`](#toolcall) | An instance of a tool/function invocation by an agent | [`started`](#toolcall-started), [`finished`](#toolcall-finished) |
| [`modelInvocation`](#modelinvocation) | An instance of a call to an underlying model | [`started`](#modelinvocation-started), [`finished`](#modelinvocation-finished) |

### `agentRun`

An agent can be invoked multiple times, for example once per incoming user
request. We refer to each invocation as an [`agentRun`](#agentrun). It has a
unique id and helps track the agent's progress and outcome for a particular
invocation.

| Field | Type | Description | Examples |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | `run-1234`, `tenant1/run-abcde` |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| agentName | `String` | The name of the agent | `research-assistant`, `customer-support-bot` |
| agentVersion | `String` | The version of the agent definition (prompt, graph, or code revision) | `1.4.2`, `git:a1b2c3d` |
| url | `URI` | url to view the `agentRun`, e.g. a trace or dashboard link | `https://dashboard.example.com/runs/run-1234` |
| outcome | `String (enum)` | outcome of a finished `agentRun` | `success`, `failure`, `cancel`, or `error` |
| errors | `String` | In case of error, canceled, or failed run, details about the failure | `Tool "search_web" raised an exception`, `Run canceled by user` |

### `toolCall`

Within an `agentRun`, an agent typically invokes one or more tools (also
called functions) to gather information or take action. A `toolCall` is a
single instance of such an invocation.

| Field | Type | Description | Examples |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | `call-456`, `run-1234/call-2` |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| toolName | `String` | The name of the tool/function invoked | `search_web`, `execute_python` |
| agentRun | `Object` ([`agentRun`](#agentrun)) | The `agentRun` this `toolCall` belongs to | `{"id": "run-1234"}` |
| url | `URI` | url to view the `toolCall` | `https://dashboard.example.com/runs/run-1234/calls/call-456` |
| outcome | `String (enum)` | outcome of a finished `toolCall` | `success`, `failure`, `cancel`, or `error` |
| errors | `String` | In case of error, canceled, or failed call, details about the failure | `Timeout calling external API`, `Invalid arguments` |

### `modelInvocation`

Within an `agentRun`, an agent makes one or more calls to an underlying
model (for example, to decide its next action or to generate a final
response). A `modelInvocation` is a single instance of such a call.

| Field | Type | Description | Examples |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | `inv-789`, `run-1234/inv-1` |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| modelName | `String` | The name of the model invoked | `claude-sonnet-5`, `gpt-4o` |
| modelProvider | `String` | The provider of the model | `anthropic`, `openai`, `azure-openai` |
| agentRun | `Object` ([`agentRun`](#agentrun)) | The `agentRun` this `modelInvocation` belongs to | `{"id": "run-1234"}` |
| url | `URI` | url to view the `modelInvocation` | `https://dashboard.example.com/runs/run-1234/invocations/inv-789` |
| outcome | `String (enum)` | outcome of a finished `modelInvocation` | `success`, `failure`, `cancel`, or `error` |
| errors | `String` | In case of error, canceled, or failed invocation, details about the failure | `Rate limited by provider`, `Context length exceeded` |
| promptTokens | `Integer` | number of tokens in the prompt, OPTIONAL and only meaningful on `finished` | `512` |
| completionTokens | `Integer` | number of tokens generated, OPTIONAL and only meaningful on `finished` | `128` |
| totalTokens | `Integer` | total tokens used, OPTIONAL and only meaningful on `finished` | `640` |

## Events

### [`agentRun queued`](conformance/agentrun_queued.json)

An `agentRun` has been queued for execution and is waiting for applicable
preconditions (available capacity, rate limits, upstream dependencies, etc.)
to be fulfilled before actually starting. Adopters whose agent runtime
starts runs synchronously can choose to skip this event entirely.

- Event Type: __`dev.agentevents.agentrun.queued.0.1.0-draft`__
- Predicate: queued
- Subject: [`agentRun`](#agentrun)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| agentName | `String` | The name of the agent | |
| agentVersion | `String` | The version of the agent definition | |
| url | `URI` | url to the `agentRun` | |

### [`agentRun started`](conformance/agentrun_started.json)

An `agentRun` has started and is running.

- Event Type: __`dev.agentevents.agentrun.started.0.1.0-draft`__
- Predicate: started
- Subject: [`agentRun`](#agentrun)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| agentName | `String` | The name of the agent | |
| agentVersion | `String` | The version of the agent definition | |
| url | `URI` | url to the `agentRun` | |

### [`agentRun finished`](conformance/agentrun_finished.json)

An `agentRun` has finished, successfully or not.

- Event Type: __`dev.agentevents.agentrun.finished.0.1.0-draft`__
- Predicate: finished
- Subject: [`agentRun`](#agentrun)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| agentName | `String` | The name of the agent | |
| agentVersion | `String` | The version of the agent definition | |
| url | `URI` | url to the `agentRun` | |
| outcome | `String (enum)` | outcome of the `agentRun` | `success`, `failure`, `cancel`, `error` |
| errors | `String` | details about the failure, when applicable | |

### [`toolCall started`](conformance/toolcall_started.json)

A `toolCall` has started and is running.

- Event Type: __`dev.agentevents.toolcall.started.0.1.0-draft`__
- Predicate: started
- Subject: [`toolCall`](#toolcall)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| toolName | `String` | The name of the tool/function invoked | ✅ |
| agentRun | `Object` ([`agentRun`](#agentrun)) | The `agentRun` this `toolCall` belongs to | ✅ |
| url | `URI` | url to the `toolCall` | |

### [`toolCall finished`](conformance/toolcall_finished.json)

A `toolCall` has finished, successfully or not.

- Event Type: __`dev.agentevents.toolcall.finished.0.1.0-draft`__
- Predicate: finished
- Subject: [`toolCall`](#toolcall)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| toolName | `String` | The name of the tool/function invoked | ✅ |
| agentRun | `Object` ([`agentRun`](#agentrun)) | The `agentRun` this `toolCall` belongs to | ✅ |
| url | `URI` | url to the `toolCall` | |
| outcome | `String (enum)` | outcome of the `toolCall` | `success`, `failure`, `cancel`, `error` |
| errors | `String` | details about the failure, when applicable | |

### [`modelInvocation started`](conformance/modelinvocation_started.json)

A `modelInvocation` has started and is running.

- Event Type: __`dev.agentevents.modelinvocation.started.0.1.0-draft`__
- Predicate: started
- Subject: [`modelInvocation`](#modelinvocation)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| modelName | `String` | The name of the model invoked | ✅ |
| modelProvider | `String` | The provider of the model | |
| agentRun | `Object` ([`agentRun`](#agentrun)) | The `agentRun` this `modelInvocation` belongs to | ✅ |
| url | `URI` | url to the `modelInvocation` | |

### [`modelInvocation finished`](conformance/modelinvocation_finished.json)

A `modelInvocation` has finished, successfully or not.

- Event Type: __`dev.agentevents.modelinvocation.finished.0.1.0-draft`__
- Predicate: finished
- Subject: [`modelInvocation`](#modelinvocation)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | `String` | See [id](spec.md#id-subject) | ✅ |
| source | `URI-Reference` | See [source](spec.md#source-subject) | |
| modelName | `String` | The name of the model invoked | ✅ |
| modelProvider | `String` | The provider of the model | |
| agentRun | `Object` ([`agentRun`](#agentrun)) | The `agentRun` this `modelInvocation` belongs to | ✅ |
| url | `URI` | url to the `modelInvocation` | |
| outcome | `String (enum)` | outcome of the `modelInvocation` | `success`, `failure`, `cancel`, `error` |
| errors | `String` | details about the failure, when applicable | |
| promptTokens | `Integer` | number of tokens in the prompt | |
| completionTokens | `Integer` | number of tokens generated | |
| totalTokens | `Integer` | total tokens used | |
