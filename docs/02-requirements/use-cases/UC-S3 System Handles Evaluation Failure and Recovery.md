# Use Case: System Handles Evaluation Failure and Recovery

## Use Case ID
UC-S3

---

## Summary
The system handles evaluation failures and recovery so asynchronous AI-driven processes remain reliable, auditable, and safe for users, even when external services fail or return invalid output.

---

## Primary Actor
System

---

## Secondary Actors
- AI Service
- Candidate (indirectly affected)
- Recruiter (indirectly affected)

---

## Preconditions
- An evaluation has been requested for a submitted answer.
- An evaluation job is in progress or has failed.
- System retry and failure-handling policies are defined.

---

## Trigger
An evaluation attempt fails due to timeout, service error, invalid output, or persistence failure.

---

## Main Success Scenario
1. System detects an evaluation failure condition.
2. System records the failure in the event log with an appropriate failure event and correlation identifier.
3. System applies retry logic according to policy (e.g., retry count, backoff).
4. On a successful retry:
   - system validates the evaluation output
   - system persists the evaluation as `COMPLETE`
   - system appends an `EVAL_COMPLETED` event
5. System updates the session projection to reflect completion.
6. Clients are notified via streaming or polling to refresh state.

---

## Postconditions
- Evaluation results are either successfully completed or deterministically marked as failed.
- The system state remains consistent and resumable.
- No partial or invalid evaluation output is exposed to users.

---

## Alternate / Error Scenarios

### A1 — Retry Exhausted
**Scenario:** All permitted retries fail.  
**System behavior:**
- System marks the evaluation as `FAILED`.
- System records sufficient internal detail for diagnostics.
- Client-facing projections present a safe, non-alarming state with guidance (e.g., retry later).

---

### A2 — Invalid AI Output
**Scenario:** AI service returns output that fails schema validation.  
**System behavior:**
- System rejects the output.
- System retries using repair strategies if permitted.
- Invalid output is never persisted as complete or shown to users.

---

### A3 — Downstream Persistence Failure
**Scenario:** Evaluation output is valid but database write fails.  
**System behavior:**
- System does not claim completion.
- Evaluation job is retried safely due to idempotency guarantees.

---

## System Responsibilities
- Detect and classify evaluation failure modes.
- Enforce retry and backoff policies.
- Maintain strict separation between internal failure detail and user-facing messaging.
- Preserve auditability and traceability via events and correlation identifiers.

---

## Non-Responsibilities
- The system does not silently fabricate evaluation results.
- The system does not expose internal error details to candidates or recruiters.
- The system does not reinterpret failed evaluations without an explicit retry.

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- Failure handling is a core reliability concern and should be tested early via forced-failure scenarios.
- Evaluation recovery must prioritize correctness and trust over speed.