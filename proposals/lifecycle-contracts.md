# Lifecycle contract plan

Status: proposed direction; this document does not change the normative
vocabulary, schemas, or conformance requirements in `0.1.0-draft`.

## Purpose and scope

Define a common event contract for activity observed across agent harnesses,
action executors, model services, policy services, and management platforms.
Each component can produce and consume events about the lifecycle boundaries
it observes. SDK instrumentation is one source of events, not a prerequisite.

Use AAIF project interfaces as evidence for the connection points. Organize
the vocabulary around portable concepts rather than project-specific callbacks.
This is an AgentEvents proposal, not an AAIF standard or a claim of endorsement,
native integration, or implemented compatibility.

Deliver vocabulary, schemas, semantic rules, and conformance examples in the
sequence below. Adapter implementations, transport selection, platform
architecture, pricing, billing, and budget accounting are outside this work.
Token counts are optional execution metadata.

## Reference ecosystem

The [AAIF project directory](https://aaif.io/projects) identifies the reference
projects below. Sources were reviewed on 2026-10-23. Implementation work should
pin each relevant specification release or source revision; moving `latest`
documentation is discovery evidence, not a versioned compatibility promise.

| Connection point | Evidence from AAIF projects | AgentEvents boundary |
| --- | --- | --- |
| Instructions | [AGENTS.md](https://agents.md/) provides project instructions. | Identify instruction artifacts actually loaded into an execution context; availability alone does not prove loading or compliance. |
| Capabilities | [Agent Skills integration guidance](https://agentskills.io/client-implementation/adding-skills-support) distinguishes discovery, disclosure, and activation. | Distinguish a capability made available from instructions activated for a run. A skill is not necessarily an executable operation. |
| Harness | [Goose](https://github.com/aaif-goose/goose) is an extensible agent runtime. | Describe run attempts and containment independently of any harness's callback names or session model. |
| Tools and context | [MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) defines tools, resources, prompts, elicitation, progress, cancellation, and optional extensions. | Describe action execution and context access; preserve native request references without treating every protocol request as a tool call. |
| Governance | [agentgateway](https://agentgateway.dev/docs/standalone/latest/) exposes authorization, traffic policies, and [external authorization](https://agentgateway.dev/docs/standalone/latest/documentation/configuration/security/external-authz/). | Describe a policy evaluation separately from the enforcement effect observed at the action boundary. |
| Human interaction | [Goose permissions](https://goose-docs.ai/docs/guides/goose-permissions/) gate actions; MCP supports requests for user information. | Distinguish approval from information gathering, and a decision from resumption of work. |
| Remote work | [A2A task lifecycle](https://a2a-protocol.org/latest/topics/life-of-a-task/) includes progress, interruptions, and terminal states. | Distinguish delegated work identity, acceptance, and execution attempts; retain artifacts and native state references. |
| Model interaction | [Open Responses](https://www.openresponses.org/specification) defines response and item lifecycles; [Agent Router](https://github.com/theagentrouter/agent-router) manages model and tool access and routing. | Describe model invocation attempts and preserve native terminal details; generated tool arguments do not establish tool execution. |
| Environment | [OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) exposes sandbox lifecycle and execution APIs. | Identify an execution environment independently of the runs using it. |
| Evaluation | [OpenEnv](https://github.com/openenv/OpenEnv) exposes reset, step, and state operations with rewards and evaluation integrations. | Keep episode, step, and evaluation semantics in a later optional profile. |

## Contract model

A connection point identifies a subject, an observable transition, the component
authoritative for that observation, and references to related activity. An event
records an occurrence; issuing an instruction and confirming its effect are
different occurrences. A subscriber may react to an event, but the event format
does not define the control API, response deadline, or enforcement mechanism.

The following are semantic candidates, not new event type strings. Each candidate
needs a schema and checked examples before becoming part of the vocabulary.

| Area | Existing contract | Candidate additions and limits |
| --- | --- | --- |
| Run lifecycle | `agentRun.queued`, `started`, `finished`; `parentAgentRun` | Suspension and resumption within an attempt. A session can contain many attempts; neither session nor remote task identity is inferred from `chainId`. |
| Action lifecycle | `toolCall.started`, `finished` | A proposed action identifiable before execution. A proposal may be denied or withdrawn without ever starting. Dispatch by a gateway does not by itself confirm executor start. |
| Policy evaluation | `guardrail.triggered`, `blocked`, with target and stage | Evaluate whether authorization fits this subject or needs a broader policy subject. Capture policy reference/revision, decision, and separately observed enforcement. Do not interpret the existing `blocked` predicate as stronger evidence than its current semantics define. |
| Approval | No dedicated subject | Requested and resolved approval, including approved, denied, expired, and withdrawn resolutions. Approval authorizes only its identified target and scope; it does not prove execution. |
| Model invocation | `modelInvocation.started`, `finished` | Preserve provider/protocol identifiers and terminal details as optional data. Define an optional usage extension. Do not map an upstream incomplete response to success without an explicit semantic rule. |
| Delegation | `agentHandoff.started`, `finished` | Preserve offer/acceptance semantics. Model remote task updates separately where tasks span attempts, await input, or return artifacts. Handoff success remains acceptance, not remote completion. |
| Context and capability | No dedicated subject | Loaded instruction references, capability availability, and skill activation. References identify the artifact and revision when known; they do not certify that instructions were followed. |
| Environment | No dedicated subject | Environment availability and termination, plus associations to execution. Environment deletion and run cancellation have independent outcomes. |

### Shared identity and observation rules

Carry forward existing event deduplication by `(context.source, context.id)`,
subject identity by effective source plus subject ID, explicit cross-source
references, and new subject IDs for new execution attempts. Chain membership,
containment, causality, protocol identity, and trace correlation remain distinct.

The next contract revision should define these additional rules:

- A component reports only the transitions it observes. A gateway forwarding a
  request cannot assert that a tool executed or a remote run completed.
- A harness and gateway observing the same operation need a documented shared
  identity or explicit association. Similar names, timestamps, or chain IDs are
  insufficient to merge subjects. Separate attempts remain separate subjects.
- Observation ownership needs to be explicit per transition. Independent
  observations are not retransmissions; event-ID deduplication alone cannot
  reconcile them. Conflicting lifecycle claims need an explicit conflict result,
  rather than last-arrival-wins behavior.
- Run association can be unknown at a gateway. Prefer optional containment for
  tool and model operations in a revised contract, with omission meaning unknown
  association rather than proof of no run. Compare a standalone operation profile
  before finalizing schemas. Preserve required run references in the current
  draft; never invent a run to satisfy validation. Later association must not
  mutate an already emitted event.
- Native request, task, response, session, and environment IDs need a namespace
  and documented scope. They supplement AgentEvents identity.
- Cancellation requested, cancellation accepted, and execution confirmed stopped
  are distinct. Completion can race with a request; a request is not a terminal
  outcome.
- Waiting for approval or input does not finish a run. Resolution does not imply
  resumption; a denied proposal does not by itself determine its parent outcome.
- Duplicate and out-of-order delivery must remain tolerable. A missing event
  means unknown history, not an inferred success, denial, or enforced stop.

### Minimum information for new contracts

Exact JSON field names and predicate names are resolved with each vocabulary
change. The following information is required to make those contracts useful:

| Contract | Information to establish |
| --- | --- |
| Proposed action | Stable action-attempt identity, operation name, optional run association, and a reference used by subsequent evaluation and execution events. |
| Policy evaluation | Unique evaluation identity, evaluated subject, evaluation phase, policy identity/revision when known, decision, and optional explanation. Re-evaluation has a new identity. |
| Enforcement observation | Decision reference, affected action, enforcing component, and observed effect. Evaluation-service failure must remain distinguishable from a deny decision. |
| Approval | Request identity, exact target/scope, optional expiry, and resolution. Resolver identity may be an access-controlled reference. Changed scope requires renewed authorization. |
| Waiting transition | Run-attempt identity and reason/reference for waiting. Resumption retains that attempt; a restarted execution uses a new attempt. |
| Remote task update | Native task namespace/ID, native state, related delegation/attempt references, and artifact references when supplied. Task state must not be flattened into run outcome without a documented mapping. |
| Context/capability observation | Artifact or capability identity, revision when known, observation kind, and affected execution context. Avoid instruction bodies by default. |
| Environment observation | Environment identity, observed transition, and independent associations to run attempts. One environment may serve multiple runs and outlive them. |

Existing metadata-only defaults apply. Prompts, arguments, results, instruction
bodies, credentials, and personal approver details are not required for these
contracts. Artifact references need their own access controls. Claimed producer
identity in an event is not authentication or proof of policy enforcement.

## Optional data extensions

Use `customData` as the starting point for additional event data. Keep custom
event types for new occurrences with their own subjects and lifecycles.
Neither mechanism bypasses the current strict schemas.

Design an opt-in JSON profile with the following properties:

- Several extensions coexist without key collisions. Each declares an
  owner-controlled namespace, its own version, and a schema identifier.
- The profile has an explicit discriminator and structure, specified with its
  schema. Existing arbitrary `customData` is not silently reinterpreted.
- A consumer can validate the core event without understanding every extension.
  It reports extension validation separately as valid, invalid, unsupported, or
  unresolved. Applications can require particular extensions before processing.
- Unknown optional extensions cannot change the meaning of required core fields.
  Semantic changes to a core event require a versioned vocabulary change.
- Schema resolution follows the existing local-first, explicitly enabled remote
  resolution policy. `context.schemaUri` remains a refinement of the whole event;
  it is not repurposed as a list of extension schemas.
- The JSON extension profile is opt-in; existing non-JSON custom payloads retain
  their encoding rules and are not implicitly wrapped or replaced.

### Token usage migration

Move `promptTokens`, `completionTokens`, and `totalTokens` from core model
completion content into an optional shared usage extension in a future contract
revision. Preserve existing semantics: non-negative invocation-attempt counts,
input includes cached input, output includes reasoning output, total equals the
components when all are supplied, and missing means unknown rather than zero.
Known usage may accompany unsuccessful attempts. No pricing or currency fields
are part of this work.

Before changing schemas, identify tagged releases and adoption constraints.
Released versions retain their fields and schemas. For a new version, document
an explicit old-to-new conversion and emit one authoritative usage representation
per event. Update the OTel mapping, semantic checks, fixtures, and glossary
together. Extension validity includes arithmetic consistency, not only types.

## Delivery sequence

Each step produces a reviewable contract change. This plan does not require
adapters, deployments, a message broker, or project-specific SDK work.

1. **Scope and baseline.** Broaden the project introduction and publish this
   connection-point map. Identify current support versus candidates and pin
   upstream versions when writing detailed mappings.
2. **Identity and lifecycle boundaries.** Resolve unknown run association,
   observation authority, operation association, waiting, and cancellation
   semantics. Update shared definitions only alongside vocabulary changes and
   fixtures that exercise those rules.
3. **Extension contract and usage.** Publish the opt-in extension schema,
   namespace/version rules, validation results, and usage schema. Complete the
   versioned token-field migration and OTel mapping.
4. **Governance and harness contracts.** Specify proposed actions, policy
   decisions versus enforcement, approvals, and waiting/resumption. Prefer
   extending existing subjects when their meanings remain correct; introduce a
   new subject when it has independent identity or lifecycle.
5. **Remaining profiles.** Specify remote task mapping, context/capability
   provenance, and environments. Keep evaluation/training as a later optional
   profile. Publish supported upstream versions and any information lost by each
   mapping; do not claim project compatibility from a conceptual table alone.

For each normative change, update prose, JSON Schema, positive and negative
fixtures, and semantic scenario checks together. Review strict-version consumer
compatibility under the existing governance rules. New lifecycle predicates do
not become valid merely because they appear in this proposal.

## Contract scenario acceptance criteria

These are planned scenario requirements, not currently checked fixtures. Use
abstract sources such as `/harness`, `/policy`, `/gateway`, and `/executor`.
Tests should assert the contract independently of a particular producer.

| Scenario | Required assertion |
| --- | --- |
| Allowed action | Proposal, decision, and actual execution correlate explicitly across sources; an allow decision alone is not execution. |
| Blocked action | The evaluation target exists before execution; the executor does not claim a start when the action never ran. Decision and enforcement observations remain distinguishable. |
| Human approval | Request and resolution share approval identity; waiting and resumption remain separate transitions. Include denial, expiry, and withdrawal. |
| Evaluation unavailable | Policy service failure is not reported as a deny decision; any resulting allow/block effect is attributed to the enforcing component. |
| Retry and re-evaluation | A new execution attempt and a new evaluation have new identities; retransmissions retain their original identities. |
| Multiple observers | Harness and gateway observations associate explicitly without double-counting execution or conflating event retransmission with a second observation. |
| Unknown run | A standalone component reports truthful operation identity without a fabricated run; a later association leaves prior event payloads immutable. |
| Cancellation race | A cancellation request can coexist with normal completion; only a confirmed terminal observation establishes the outcome. |
| Delegation | Acceptance can precede or outlive the initiating run; remote task completion does not rewrite handoff success. |
| Incomplete model response | Native terminal state is retained; the mapping explicitly determines the AgentEvents outcome instead of assuming success. |
| Optional usage | Events with no usage remain useful; missing counts differ from zero, invalid totals fail semantic validation, and retries do not inherit prior usage. |
| Extension compatibility | Unknown optional extensions preserve core interpretation; invalid or unresolved required extensions prevent an application from claiming full validation. |
| Context and environment | Discovery does not imply loading; loading does not imply compliance; environment termination does not imply a run outcome. |
| Partial history | Reverse delivery and duplicate events preserve interpretation; missing events remain unknown and cross-source timestamps are not treated as causal proof. |

The first end-to-end acceptance milestone is a checked contract scenario connecting
harness, policy, and action-execution observations into one coherent history,
without knowledge of a particular SDK's callback format. Optional usage and the
remaining profiles build on the same identity and validation rules.
