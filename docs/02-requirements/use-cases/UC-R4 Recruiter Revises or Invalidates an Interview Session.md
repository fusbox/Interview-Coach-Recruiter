# Use Case: Recruiter Revises or Invalidates an Interview Session

## Use Case ID
UC-R4

---

## Summary
A recruiter revises or invalidates an interview session so they can correct configuration issues, respond to changing requirements, or initiate a follow-up—without corrupting historical data or misrepresenting prior outcomes.

---

## Primary Actor
Recruiter

---

## Secondary Actors
- System (Session Orchestrator)
- Candidate (indirectly affected)

---

## Preconditions
- Recruiter is authenticated.
- Recruiter is authorized to modify or invalidate the session.
- The session exists and is not permanently archived or deleted.

---

## Trigger
Recruiter initiates an action to revise, invalidate, or supersede an existing session.

---

## Main Success Scenario
1. Recruiter selects a session and chooses a revision or invalidation action.
2. System validates recruiter authorization and session eligibility for modification.
3. System applies the requested action, which may include:
   - marking the session as invalidated or obsolete
   - preventing further candidate interaction with the session
   - creating a new follow-up session with revised configuration
4. System appends an event recording the recruiter’s action (idempotent).
5. System updates session state and projections to reflect the change.
6. System ensures historical data from the original session remains preserved and auditable.

---

## Postconditions
- The original session is clearly marked as invalidated, obsolete, or superseded (per policy).
- Candidate access to the invalidated session is restricted appropriately.
- Any new or follow-up session is distinct and traceable to the original.

---

## Alternate / Error Scenarios

### A1 — Session Already Completed
**Scenario:** Recruiter attempts to revise a completed session.  
**System behavior:**
- System blocks destructive changes.
- System may allow creation of a new follow-up session instead.

---

### A2 — Candidate Already Engaged
**Scenario:** Candidate is actively using the session at the time of invalidation.  
**System behavior:**
- System prevents further submissions on the invalidated session.
- Candidate receives a clear, non-alarming message directing next steps.

---

### A3 — Unauthorized Revision Attempt
**Scenario:** Recruiter without proper scope attempts to revise a session.  
**System behavior:**
- System denies the action safely.
- No session data is altered.

---

## System Responsibilities
- Enforce recruiter authorization and modification policies.
- Preserve historical integrity of sessions and evaluations.
- Clearly distinguish active, invalidated, and superseded sessions in projections.
- Prevent accidental data loss or misrepresentation.

---

## Non-Responsibilities
- The system does not retroactively alter candidate answers or evaluations.
- The system does not reinterpret past results after invalidation.
- The system does not automatically notify candidates unless explicitly designed.

---

## Relevant Architecture Contracts
- `04-architecture/api-surface.md`
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- Revision and invalidation actions should be treated as governance events with audit implications.
- Clear labeling and framing are critical to prevent recruiter misinterpretation of obsolete or superseded sessions.