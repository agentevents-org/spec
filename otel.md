# OpenTelemetry interoperability

AgentEvents defines an application event contract: a live interface can
consume `queued`, `started` and `finished` messages, while a policy or
evaluation subscriber can process the same vocabulary across runtimes.
OpenTelemetry supplies instrumentation and telemetry conventions. Runtimes
can emit both and correlate them. CloudEvents supplies AgentEvents' envelope;
CDEvents supplies its context/subject lineage.

## Conceptual mappings

These correspondences guide adapters; they are not a lossless conversion.
OTel's [agent conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md)
are in Development. Implementations should pin the OTel convention version
that they support.

| AgentEvents subject | Corresponding OTel operation |
| --- | --- |
| `agentRun` | Agent invocation span |
| `toolCall` | Tool execution span |
| `modelInvocation` | Model operation span |
| `agentHandoff` | Application-specific relationship between invocations |
| `guardrail` | Application-specific evaluation instrumentation |

A `queued` message conveys a scheduling transition separately from execution.
A start/finish pair can contribute a span's timing, but missing predicates,
clock skew and separate source clocks prevent automatic reconstruction in
all cases. Parentage, causal links, chain membership and trace identity are
separate concepts; an adapter must preserve their different meanings.

## Field mappings

Consult the versioned [GenAI attribute registry](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/registry/attributes/gen-ai.md)
used by your adapter. These mappings are conceptual; provider values may need
normalization and overlapping usage counters must not be added twice.

| AgentEvents field | OTel attribute / handling |
| --- | --- |
| `agentName` | `gen_ai.agent.name` |
| `toolName` | `gen_ai.tool.name` |
| `modelProvider` | `gen_ai.provider.name`, normalized to the supported convention |
| `modelName` | `gen_ai.request.model` |
| `responseModelName` | `gen_ai.response.model`, only when supplied |
| `promptTokens` | `gen_ai.usage.input_tokens`, including cached input |
| `completionTokens` | `gen_ai.usage.output_tokens`, including reasoning output |
| `totalTokens` | Sum of the two component counts; no additional usage counter |
| `outcome` | Preserve AgentEvents semantics; span status alone does not encode all four outcomes |
| `chainId` | Application grouping; no automatic conversation or trace mapping |

Conversation identity and cache/reasoning breakdown fields are optional
future vocabulary work. They must not be inferred from a chain or total count.

## Optional trace correlation profile

Producers MAY use CloudEvents' [distributed-tracing extension](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/extensions/distributed-tracing.md)
on the outer envelope. When used, `traceparent` is REQUIRED and `tracestate`
is OPTIONAL, following W3C Trace Context syntax. For a direct transmission,
the extension and transport trace context match. Across multiple hops, the
extension preserves the starting transmission's trace context; transport
headers can describe individual hops. Intermediaries MUST NOT replace the
extension with each hop's trace context.

A producer MAY reuse a W3C trace ID as `chainId` when the scopes and lifetimes
coincide. This does not make `chainId` a trace context or provide a span ID.
When a chain spans several traces, retain its independent identity and
correlate each event using the tracing extension.

## Guarantees

Explicit lifecycle messages and typed extension schemas define a common
consumption contract. They do not make structured data, live activity or
custom extensions exclusive to AgentEvents. Neither an event format nor
sampling configuration alone establishes an audit-complete history; that
requires deployment-specific emission, delivery and retention guarantees.
