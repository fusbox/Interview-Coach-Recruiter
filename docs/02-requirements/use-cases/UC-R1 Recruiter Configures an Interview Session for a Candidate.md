# Use Case: Recruiter Configures an Interview Session for a Candidate

## Use Case ID
UC-R1

---

## Summary
A recruiter configures an interview session for a candidate so the system can generate a candidate-specific session link and prepare the session context (role, job description, intake defaults) while preserving privacy, determinism, and future resume behavior.

---

## Primary Actor
Recruiter

---

## Secondary Actors
- System (Session Orchestrator)
- Candidate (future consumer of invite link)
- AI Service (optional: role/JD parsing or validation)
- Storage (Postgres/Supabase)

---

## Preconditions
- Recruiter is authenticated and authorized to create sessions.
- Recruiter has (at minimum) a target role selection or entry.
- Candidate identity requirements are defined for this surface (e.g., named candidate vs anonymous invite).  
  *(For V1, candidate identity may be optional if invite is link-based.)*

---

## Trigger
Recruiter chooses to create/configure a new interview session for a candidate.

---

## Main Success Scenario
1. Recruiter initiates creation of a new interview session.
2. System validates recruiter authorization to create sessions.
3. Recruiter provides session configuration inputs, which may include:
   - Target role (required)
   - Job description (optional; text or file)
   - Optional intake defaults (e.g., stage, confidence baseline, session goal)
   - Any recruiter notes intended for internal use (optional; must not leak to candidate unless explicitly designed)
4. System validates the configuration (required fields, size limits, content type constraints).
5. System creates a new session record owned by the recruiter with status `NOT_STARTED`.
6. System appends an event recording creation/configuration (e.g., `SESSION_CREATED` and `SESSION_CONFIGURED`) with idempotency safeguards.
7. System generates a candidate invite token (unguessable) and stores only its hash, linked to the session.
8. System returns a candidate-facing session URL containing the raw invite token.
9. Recruiter can copy/share the session link with the candidate.

---

## Postconditions
- A new session exists with status `NOT_STARTED` and recruiter ownership assigned.
- Session configuration context is persisted (role + optional JD + optional intake defaults).
- Candidate invite token is created and safely stored as a hash.
- Recruiter can retrieve and share the candidate session link.

---

## Alternate / Error Scenarios

### A1 — Missing Required Configuration
**Scenario:** Recruiter attempts to create a session without a required target role.  
**System behavior:**
- System rejects the request with a validation error.
- No session is created.

---

### A2 — Large or Invalid Job Description Payload
**Scenario:** Job description exceeds limits or has unsupported format.  
**System behavior:**
- System rejects or requests a smaller/compatible input.
- System may allow session creation without JD if policy permits.

---

### A3 — Duplicate Create Request (Idempotent Retry)
**Scenario:** Recruiter submits twice or client retries due to network failure.  
**System behavior:**
- System treats the create request as idempotent using an idempotency key.
- Only one session and one invite token mapping are created.
- System returns the existing created session link.

---

### A4 — Recruiter Cancels Configuration Midway
**Scenario:** Recruiter abandons configuration before finalizing.  
**System behavior:**
- System either:
  - does not create a session until final submit (preferred), or
  - creates a draft session marked as incomplete and eligible for cleanup
- No candidate link is shared unless configuration is finalized.

---

### A5 — Privacy Boundary Misconfiguration
**Scenario:** Recruiter enters internal notes that should not be visible to candidate.  
**System behavior:**
- System stores internal-only fields separately from candidate-visible context.
- Candidate `/now` projection excludes recruiter-only notes by default.

---

## System Responsibilities
- Enforce recruiter authorization and ownership.
- Validate session configuration inputs and apply size/type constraints.
- Persist session context and set initial session status deterministically.
- Generate an unguessable invite token and store only a hashed representation.
- Append creation/configuration events with idempotency support.
- Ensure candidate-visible projections exclude recruiter-only inputs unless explicitly designed.

---

## Non-Responsibilities
- The system does not infer sensitive candidate attributes from recruiter inputs.
- The system does not generate hiring recommendations or rank candidates.
- The system does not expose internal recruiter notes to candidates by default.
- The system does not require that question generation occurs during configuration (may be deferred to candidate start).

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- Question generation may occur at one of two times:
  - **On candidate start** (preferred for freshness and minimizing wasted compute), or
  - **On recruiter configuration** (optional if you want near-instant candidate entry)
  If pre-generation is used, it must not compromise idempotency or create stale context.
- Token generation must not use UUIDv7 or any time-ordered identifier. Use a cryptographically secure random token and store only its hash.
