# Checked integration scenario

[handoff.json](handoff.json) is a closed scenario with a shared `example-chain`
and controlled timestamps. A coordinator at `/runtime/a` queues and starts,
then invokes a model. The model finishes before triggering two parallel tools.
The search tool invokes a nested agent at `/runtime/b`, whose
`parentAgentRun` explicitly references the coordinator's source. Both tools
finish before the coordinator hands responsibility to `/runtime/c`.

The recipient starts and accepts the handoff. A guardrail blocks its proposed
`proposed-delete` tool action before execution. `triggered` and `blocked`
share evaluation subject identity; no tool-start event is emitted for the
blocked action. The recipient finishes with `failure`; the coordinator then
finishes with `failure` and declares `END` after all joined work completes.

All three sources reuse event ID `1`. Event links include explicit sources
when crossing runtime boundaries. Embedded subject references use the event's
source by default, and supply the referenced source for cross-runtime parent
and target run identities. The handoff recipient is independent of parentage;
the search agent is explicitly a nested child.

Run `npm --prefix tools run validate` from the repository root. The scenario
checker verifies link resolution, chain membership, causal timestamps,
lifecycle consistency, containment and guardrail pairing. Its closed-history
checks are fixture assertions, not requirements that a live consumer has a
complete history. The regression suite also checks reversed delivery and
retransmissions. Cross-source timestamp checks assume the scenario's common
clock; production timestamps may have clock skew.

[../envelopes/toolcall.json](../envelopes/toolcall.json) wraps the search-start
event as a complete structured CloudEvent. In HTTP structured mode, use
`Content-Type: application/cloudevents+json`. Consumers validate matching
outer and inner identity fields; the outer and inner specification versions
identify different specifications.
