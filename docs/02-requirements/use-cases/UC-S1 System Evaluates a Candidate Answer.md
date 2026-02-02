# Use Case: System Evaluates a Candidate Answer

## Use Case ID
UC-S1s

---

## Summary
The system evaluates a candidate’s submitted answer so it can produce structured coaching feedback and competency-based signals, persist the results deterministically, and make them available for candidate experience and recruiter review—without turning the system into a hiring decision-maker.

---

## Primary Actor
System (background / async job)

---

## Secondary Actors
- AI Service (evaluation generation)
- Candidate (consumer of feedback)
- Recruiter (consumer of responses + signals within policy)
- Streaming Channel (SSE)

---

## Preconditions
- A valid session exists.
- A submitted answer exists for a specific `(question_id, attempt_number)`:
  - `answers.final_text` is present and `submitted_at` is set.
- Session status is `AWAITING_EVAL` (or evaluation is otherwise pending for the attempt).
- An evaluation request has been recorded (e.g., `EVAL_REQUESTED` event).
- System has access to the evaluation context required by policy (question text, scoring dimensions, competency framework, and answer).

---

## Trigger
An evaluation job is started as a result of an answer submission (e.g., queued task / serverless invocation).

---

## Main Success Scenario
1. System begins evaluation for `(session_id, question_id, attempt_number)` using a correlation identifier.
2. System validates eligibility:
   - Confirms an answer submission exists for the attempt.
   - Confirms an evaluation result is not already complete (idempotency).
3. System marks the evaluation as `PENDING` if not already present.
4. System invokes the AI service with required context (question + rubric + answer + applicable session context).
5. AI service returns an evaluation output.
6. System validates the evaluation output against the required schema.
7. System persists the evaluation result as `COMPLETE`, including:
   - structured feedback JSON
   - model metadata for auditability (model/version, timestamps, prompt identifiers)
8. System appends an `EVAL_COMPLETED` event (idempotent) with the correlation identifier.
9. System updates session state to `IN_SESSION` (or an equivalent ready state) and makes the updated `/now` projection available.
10. System publishes streaming notifications indicating evaluation completion and instructs clients to refresh projections (invalidate).

---

## Postconditions
- `eval_results` for `(question_id, attempt_number)` exists with status `COMPLETE`.
- The evaluation feedback is persisted in schema-valid form.
- The event log contains `EVAL_COMPLETED`.
- `/now` projection reflects:
  - evaluation status = `COMPLETE`
  - feedback available for rendering
- System remains consistent and resumable across refresh/reconnect.

---

## Alternate / Error Scenarios

### A1 — Duplicate Evaluation Job (Idempotent Re-run)
**Scenario:** The evaluation job runs twice due to retry, queue duplication, or timeout.  
**System behavior:**
- If evaluation is already `COMPLETE`, the system exits without modification.
- No duplicate eval rows are created.
- Optional: append a no-op event only if needed for observability (not required).

---

### A2 — AI Service Timeout / Failure
**Scenario:** AI call fails, times out, or returns an error.  
**System behavior:**
- System records failure in events (e.g., `EVAL_FAILED` or a generic failure event) with correlation id.
- `eval_results.status` is set to `FAILED` (or remains `PENDING` with an internal retry counter).
- System schedules a retry if policy allows.
- Candidate experience remains stable:
  - `/now` indicates evaluation is still pending or failed with a safe message and retry path.

---

### A3 — Invalid AI Output (Schema Validation Failure)
**Scenario:** AI returns output that fails schema validation or contains unsafe/unexpected fields.  
**System behavior:**
- System does not persist invalid feedback as `COMPLETE`.
- System retries evaluation using a controlled repair strategy (e.g., re-prompt, constrained JSON mode, or fallback template) if policy allows.
- If retries exhausted, system marks evaluation as `FAILED` and records details internally (no leaking).

---

### A4 — Session State Conflict
**Scenario:** Candidate retries the answer or moves state forward while evaluation is running.  
**System behavior:**
- System binds evaluation to `(question_id, attempt_number)` and does not overwrite other attempts.
- If a newer attempt exists:
  - evaluation may still complete for the prior attempt but is treated as historical
  - `/now` prioritizes the active attempt per state rules

---

### A5 — Persistence Failure
**Scenario:** Database write fails while persisting evaluation output.  
**System behavior:**
- System does not claim completion.
- Job is retried safely due to idempotency.
- Candidate experience remains stable with evaluation pending until persistence succeeds.

---

## System Responsibilities
- Ensure evaluation is bound to a specific `(question_id, attempt_number)` and is idempotent.
- Invoke the AI service with the correct rubric/context.
- Validate outputs against a strict schema before persistence.
- Persist evaluation results and model metadata for auditability.
- Update session readiness state for continued interaction.
- Publish status updates through SSE and support polling fallback.

---

## Non-Responsibilities
- The system does not make hiring recommendations or rank candidates.
- The system does not compare candidates to other candidates.
- The system does not present evaluation output as a definitive judgment; it is coaching feedback and structured signals for human interpretation.
- The system does not expose internal model prompts or sensitive metadata to candidates or recruiters unless explicitly designed.

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- Evaluation output should be stored as facts (validated model output) and only summarized into human-facing descriptors via projections.
- Streaming should notify completion and instruct clients to refetch `/now` rather than treating streamed content as authoritative.
- This use case is a key compliance boundary: ensure messaging avoids implying the system is selecting or rejecting candidates.
