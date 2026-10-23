# Semantic negative fixtures

Each event here is valid against its JSON Schema but violates a rule that
JSON Schema cannot express. SDKs must reject these in code, after schema
validation.

| Fixture | Rule |
| --- | --- |
| [wrong-token-total.json](wrong-token-total.json) | On `modelInvocation.finished`, when `promptTokens`, `completionTokens` and `totalTokens` are all present, `totalTokens` MUST equal the sum of the other two ([model and usage semantics](../../core.md#model-and-usage-semantics)). |

Fixtures in [`../invalid/`](../invalid/) fail schema validation alone, so a
schema-only test harness can use them directly.
