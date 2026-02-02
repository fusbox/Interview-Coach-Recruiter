# Use Case: Candidate Starts Interview Session

## Use Case ID
UC-C1

---

## Summary
A candidate starts an interview session so the system can generate and present the first customized interview question as quickly as possible while maintaining exact resume behavior.

---

## Primary Actor
Candidate

---

## Secondary Actors
- System (Session Orchestrator)
- AI Service (Question Generation)
- Streaming Channel (SSE)

---

## Preconditions
- A valid `session_id` exists.
- Candidate possesses a valid invite token that resolves to the session.
- Session status is `NOT_STARTED` (or an equivalent resumable pre-start state).
- Candidate is authorized to access this session (token scope enforced server-side).

---

## Trigger
Candidate initiates session start (e.g., clicks “Start Interview” or equivalent action).

---

## Main Success Scenario
1. Candidate initiates the start action for the session.
2. System validates candidate access and confirms the session is eligible to start.
3. System writes a `SESSION_STARTED` event (idempotent).
4. System transitions session state to `GENERATING_QUESTIONS` and persists the updated session state.
5. System writes a `QUESTIONS_REQUESTED` event and creates a correlation identifier for the workflow.
6. System begins question generation (async permitted) using the session context (target role, optional job description, optional intake).
7. System publishes streaming status updates indicating progress (e.g., generating questions).
8. System persists generated question(s) and ensures `question_index = 0` exists.
9. System writes `QUESTIONS_GENERATED` and `QUESTION_PRESENTED` events.
10. System transitions session state to `IN_SESSION` and sets `current_question_index = 0`.
11. System makes the updated session projection available via `/now` such that the client can render Question 1 without re-generating.
12. Candidate can view (and optionally hear) Question 1.

---

## Postconditions
- Session status is `IN_SESSION`.
- `current_question_index = 0`.
- At least one question exists for the session (`question_index = 0`).
- The event log contains a consistent record of the start workflow:
  - `SESSION_STARTED`
  - `QUESTIONS_REQUESTED`
  - `QUESTIONS_GENERATED`
  - `QUESTION_PRESENTED`
- The client can refresh and resume into the same state without duplicate generation.

---

## Alternate / Error Scenarios

### A1 — Duplicate Start Request (Idempotent Retry)
**Scenario:** Candidate double-clicks Start or the client retries due to network instability.  
**System behavior:**
- System treats the repeated request as idempotent.
- No duplicate questions are created.
- System returns the current state (`GENERATING_QUESTIONS` or `IN_SESSION`) and a recommended next action (wait or render).

---

### A2 — Session Already Started (Resume Instead of Restart)
**Scenario:** Candidate reopens the link after previously starting.  
**System behavior:**
- System does not create a new session or re-run question generation.
- System returns `/now` projection for the current session state.
- Candidate resumes at the current question index.

---

### A3 — Invalid Token / Unauthorized Access
**Scenario:** Token is invalid, expired, or does not map to the session.  
**System behavior:**
- System denies access without leaking session existence.
- Candidate receives a safe error response/page.

---

### A4 — AI Question Generation Failure
**Scenario:** The AI service times out or returns invalid output.  
**System behavior:**
- System records failure in events (e.g., `EVAL_FAILED`-style equivalent for generation, or a generic failure event).
- Session transitions to `ERROR` or a recoverable failure state.
- System provides a safe user-facing message and a recoverable action (retry generation) if policy allows.

---

### A5 — Slow Generation (Latency Exceeds UX Target)
**Scenario:** Generation takes longer than the desired perceived wait threshold.  
**System behavior:**
- System streams status updates (SSE) to maintain engagement.
- System ensures the client can remain responsive and continue polling `/now` until Question 1 is ready.
- System avoids duplicate generation even if the client reconnects.

---

## System Responsibilities
- Validate candidate session access (token scope).
- Enforce session state eligibility and transitions.
- Append idempotent events for start workflow.
- Orchestrate question generation and persist results.
- Provide a deterministic `/now` projection that supports exact resume.
- Publish status updates via streaming mechanisms (SSE) and support polling fallback.

---

## Non-Responsibilities
- The system does not interpret candidate readiness for hiring decisions.
- The system does not rank or compare candidates.
- The system does not expose raw internal scoring as a hiring recommendation.
- The system does not store secrets in public identifiers (invite tokens are random; IDs are internal).

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- This use case is the keystone for the walking skeleton: it validates idempotency, async orchestration, and resume guarantees early.
- TTS prefetch for Question 1 may be performed as part of generation or as a follow-on background workflow; either is acceptable if it does not block rendering Question 1.
