# Use Case: Candidate Submits an Answer to an Interview Question

## Use Case ID
UC-C2

---

## Summary
A candidate submits an answer to an interview question so the system can persist the response, trigger evaluation, and ensure the candidate can safely retry, resume, or continue without losing work.

---

## Primary Actor
Candidate

---

## Secondary Actors
- System (Session Orchestrator)
- AI Service (Answer Evaluation)
- Streaming Channel (SSE)

---

## Preconditions
- A valid session exists and is accessible by the candidate.
- Session status is `IN_SESSION`.
- A current question is presented (`current_question_index` is set).
- The candidate has either:
  - a saved draft answer, or
  - a newly entered response.
- The question has not already been finalized for the active attempt.

---

## Trigger
Candidate submits an answer for the currently presented interview question.

---

## Main Success Scenario
1. Candidate submits an answer (text or voice) for the current question.
2. System validates candidate access and confirms the session and question state are eligible for submission.
3. System persists the submitted answer as the final response for the active attempt.
4. System appends an `ANSWER_SUBMITTED` event with idempotency safeguards.
5. System transitions the session state to `AWAITING_EVAL`.
6. System appends an `EVAL_REQUESTED` event and assigns a correlation identifier for the evaluation workflow.
7. System enqueues evaluation of the submitted answer (async permitted).
8. System publishes streaming status updates indicating evaluation is in progress.
9. System makes updated session state available via `/now`, reflecting that evaluation is pending.
10. Candidate is informed that evaluation is in progress and can remain on the session screen or refresh without losing state.

---

## Postconditions
- The submitted answer is persisted as final for the active attempt.
- Session status is `AWAITING_EVAL`.
- Evaluation status for the answer is `PENDING`.
- Event log contains a consistent record of submission and evaluation initiation:
  - `ANSWER_SUBMITTED`
  - `EVAL_REQUESTED`
- The system can resume deterministically after refresh or reconnect.

---

## Alternate / Error Scenarios

### A1 — Duplicate Submission (Idempotent Retry)
**Scenario:** Candidate submits the same answer multiple times due to double-clicking or client retry.  
**System behavior:**
- System treats repeated submissions as idempotent.
- No duplicate answers or evaluations are created.
- System returns the current evaluation status for the attempt.

---

### A2 — Network Interruption During Submission
**Scenario:** Network drops after submission but before client receives a response.  
**System behavior:**
- Submission is processed server-side if received.
- On reconnect, `/now` reflects the correct state (`AWAITING_EVAL` or beyond).
- Candidate does not need to re-submit.

---

### A3 — Invalid Session or Question State
**Scenario:** Candidate attempts to submit when the session is not in `IN_SESSION` state or question index is invalid.  
**System behavior:**
- System rejects the submission with a safe error.
- No state mutation occurs.
- Candidate is prompted to refresh or resume.

---

### A4 — Evaluation Queue Failure
**Scenario:** Evaluation job fails to enqueue.  
**System behavior:**
- System records the failure in the event log.
- Session transitions to a recoverable error state or remains in `AWAITING_EVAL` with retry enabled.
- Candidate is not told their answer is lost.

---

### A5 — Candidate Immediately Retries Answer
**Scenario:** Candidate chooses to retry before evaluation completes.  
**System behavior:**
- System allows retry only if policy permits interruption.
- If allowed:
  - Evaluation for the prior attempt is canceled or ignored.
  - A new attempt is created.
- If not allowed:
  - System blocks retry until evaluation completes and communicates status clearly.

---

## System Responsibilities
- Validate candidate permissions and session state.
- Persist final answers atomically and idempotently.
- Enforce one finalized answer per question attempt.
- Trigger evaluation workflows reliably.
- Maintain accurate session state and evaluation status.
- Publish status updates via streaming and polling mechanisms.
- Preserve draft history and attempt history for auditability.

---

## Non-Responsibilities
- The system does not judge candidate suitability for a role.
- The system does not provide hiring recommendations.
- The system does not infer intent beyond the submitted response.
- The system does not delete or overwrite prior attempts without explicit retry semantics.

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- Draft persistence (autosave) is covered by a separate draft-update path and is assumed to have occurred prior to submission.
- Voice submissions may involve asynchronous transcription; the final submission must represent the authoritative answer text used for evaluation.
- Evaluation completion and feedback presentation are covered in a separate use case.
