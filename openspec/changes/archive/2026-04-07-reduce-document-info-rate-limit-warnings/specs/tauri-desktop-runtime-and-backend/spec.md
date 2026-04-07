## ADDED Requirements

### Requirement: Restrained console output for Feishu throttle retries

The native backend MUST NOT emit a console line tagged as a warning for each intermediate retry when a Feishu OpenAPI call returns a recognized frequency-limit (throttle) response and the shared retry helper will attempt another request within the configured retry budget.

#### Scenario: No per-attempt warning during in-budget throttle retries

- **WHEN** a Feishu OpenAPI call wrapped by the shared throttle retry helper receives a throttling response and at least one retry attempt remains
- **THEN** the runtime MUST NOT print a `[warn]`-prefixed line for that intermediate throttling event

#### Scenario: Warning remains when throttle retries are exhausted

- **WHEN** the shared throttle retry helper consumes the full retry budget and the final attempt still returns a throttling response
- **THEN** the runtime MUST emit a clear warning indicating that throttling retries were exhausted
