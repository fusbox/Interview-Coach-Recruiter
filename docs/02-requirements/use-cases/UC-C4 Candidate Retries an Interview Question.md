# Use Case: Candidate Retries an Interview Question

## Use Case ID
UC-C4

---

## Summary
A candidate retries an interview question so they can improve their response while preserving attempt history and ensuring evaluations remain correctly associated with each attempt.

---

## Primary Actor
Candidate

---

## Secondary Actors
- System (Session Orchestrator)
- AI Service (Evaluation, if prior attempt exists)

---

## Preconditions
- A valid session exists and is accessible by the candidate.
- Session status is `IN_SESSION` or `AWAITING_EVAL`.
- A prior attempt exists for the current question.

---

## Trigger
Candidate chooses to retry the current question.

---

## Main Success Scenario
1. Candidate initiates a retry action for the current question.
2. System validates candidate access and confirms retry eligibility per policy.
3. System creates a new attempt for the question with an incremented attempt number.
4. System resets draft state for the new attempt.
5. System appends an attempt-related event (idempotent).
6. System updates `/now` to reflect the new active attempt.
7. Candidate begins answering the question anew.

---

## Postconditions
- A new attempt exists for the question.
- The previous attempt and any associated evaluation remain preserved as historical data.
- The new attempt is the active attempt for subsequent draft updates and submission.

---

## Alternate / Error Scenarios

### A1 — Retry While Evaluation Is Pending
**Scenario:** Candidate retries before evaluation of the prior attempt completes.  
**System behavior:**
- System applies policy:
  - allow retry and mark prior eval as historical, or
  - block retry until evaluation completes
- System avoids overwriting or deleting prior attempt data.

---

### A2 — Retry Not Permitted
**Scenario:** Retry is disallowed by configuration or policy.  
**System behavior:**
- System rejects the retry request.
- Candidate is informed of the restriction without losing progress.

---

## System Responsibilities
- Manage attempt lifecycles deterministically.
- Preserve historical attempts and evaluations.
- Ensure evaluations remain bound to the correct attempt.
- Prevent state corruption during retries.

---

## Non-Responsibilities
- The system does not choose which attempt is “better.”
- The system does not compare attempts for ranking purposes.

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`

---

## Notes
- Retry semantics directly affect recruiter interpretation and must remain explicit and consistent.
