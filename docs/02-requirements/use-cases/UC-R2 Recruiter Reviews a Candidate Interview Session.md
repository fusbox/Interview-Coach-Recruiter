# Use Case: Recruiter Reviews a Candidate Interview Session

## Use Case ID
UC-R2

---

## Summary
A recruiter reviews a candidate’s interview session so they can understand the candidate’s responses and use system-generated feedback/signals to guide follow-up coaching—while keeping interpretation and judgment explicitly with the recruiter.

---

## Primary Actor
Recruiter

---

## Secondary Actors
- System (Projection / Read Model)
- Candidate (subject of the session data)
- AI Service (already completed work; not required in this use case)

---

## Preconditions
- Recruiter is authenticated.
- Recruiter is authorized to access the session (ownership or assigned access).
- The session exists and has at least one answered question OR is otherwise eligible for review.
- Session data required for review is persisted:
  - questions
  - candidate final answers (and optionally attempts)
  - evaluation results (complete or pending)
- Recruiter-facing boundaries and framing rules are defined (Dashboard Constitution).

---

## Trigger
Recruiter selects a session to review (from a list, search, or direct link).

---

## Main Success Scenario
1. Recruiter requests to view a specific candidate session.
2. System validates recruiter authorization for that session.
3. System returns a recruiter-facing session projection including:
   - session summary (readiness level or equivalent banding, if applicable)
   - question list and completion status
   - candidate final responses for each answered question
   - evaluation feedback for each answered question (if complete)
4. Recruiter reviews candidate responses and system-provided coaching feedback/signals.
5. Recruiter uses the information to plan follow-up guidance for the candidate (outside the system).
6. System allows recruiter to refresh and see the latest persisted state (e.g., newly completed evals) without duplicating or regenerating content.

---

## Postconditions
- No system state must change for review to occur (read-only use case).
- Recruiter has access to the session’s persisted outputs and can use them for follow-up.
- Any changes in displayed content reflect previously persisted facts and projections.

---

## Alternate / Error Scenarios

### A1 — Unauthorized Access
**Scenario:** Recruiter attempts to access a session they do not own / are not assigned.  
**System behavior:**
- System denies access with a safe response.
- System does not leak session existence or details beyond authorization policy.

---

### A2 — Evaluation Still Pending
**Scenario:** Recruiter opens the session while one or more eval results are still `PENDING`.  
**System behavior:**
- System displays available content and clearly indicates which items are pending.
- System does not fabricate or guess outcomes.
- System allows refresh to show newly completed eval results once persisted.

---

### A3 — Multiple Attempts Exist (Retry History)
**Scenario:** Candidate retried one or more questions, resulting in multiple attempts.  
**System behavior:**
- System presents the active/final attempt as the default view.
- System may allow recruiter to expand and view prior attempts as historical context if policy permits.
- System avoids comparative ranking or “attempt scoring” narratives that imply hiring judgment.

---

### A4 — Candidate Data Minimization / Redaction Policy
**Scenario:** Policy restricts certain data fields from recruiter view (e.g., raw transcripts, voice artifacts).  
**System behavior:**
- System enforces field-level visibility rules in recruiter projections.
- Recruiter sees only permitted data.

---

### A5 — Projection/Consistency Mismatch
**Scenario:** Underlying tables are updated but recruiter projection is stale or inconsistent.  
**System behavior:**
- System refreshes or recomputes projections deterministically.
- System favors correctness over speed where the two conflict.
- System logs discrepancy for investigation.

---

## System Responsibilities
- Enforce recruiter authorization and session access scope.
- Provide recruiter-facing projections that:
  - reflect persisted facts and validated model outputs
  - apply the Dashboard Constitution framing rules
  - avoid implying automated hiring decisions
- Support deterministic refresh (no regeneration on read).
- Ensure recruiter-visible content is consistent and auditable (session, question, attempt, evaluation linkage).

---

## Non-Responsibilities
- The system does not make hiring decisions or recommend hiring outcomes.
- The system does not rank candidates against one another.
- The system does not present readiness levels as definitive judgments; they are coaching-oriented signals.
- The system does not interpret candidate intent beyond their submitted responses.

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`
- (If present) `dashboard_constitution.md`

---

## Notes
- Recruiter review should emphasize that the recruiter retains responsibility for interpretation and follow-up guidance.
- Any recruiter-facing “summary” is derived from persisted facts and validated outputs and should be designed to reduce misinterpretation risk.
- Future enhancement: recruiter notes or coaching plan fields may be introduced, but must remain explicitly separate from candidate-visible data unless intentionally shared.
