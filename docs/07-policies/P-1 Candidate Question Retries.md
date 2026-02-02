# Retry Policy — Candidate Question Retries

---

## Purpose

This policy defines when and how candidates may retry or revise responses to interview practice questions. The goal is to support **intentional practice and learning** while preserving transparency, auditability, and system integrity.

Retries are a **learning affordance**, not a scoring mechanism.

---

## Scope

This policy applies to:

* **Post-submission retries** initiated after coaching feedback is shown (UF-C4)
* Evaluation triggering and attempt tracking for finalized submissions
* Recruiter-facing visibility constraints

This policy does **not** define:

* Pre-submission confirmation behavior
* In-progress edits prior to submission
* Hiring decisions
* Candidate ranking
* Performance evaluation standards

---

## Core Principles

1. **Practice-first**: Post-submission retries exist to support reflection and learning, not optimization for a score.
2. **History-preserving**: Prior submitted attempts are never overwritten or deleted.
3. **Question-bounded**: Post-submission retries apply per question, not globally across the session.
4. **Phase-separated**: Pre-submission confirmation is a UX control; post-submission retry is a policy-controlled action.
5. **Policy-driven**: Retry availability is controlled by explicit rules, not UI affordances alone.

---

## Default Retry Rules (v1)

### Eligibility

A **post-submission retry** is allowed when:

* Feedback has been displayed for the current question
* The question is not marked as retry-disabled by policy
* The candidate has not exceeded the retry limit for that question

---

### Retry Limits

**Per-question retry limit:**

* Default: **1 post-submission retry per question** (total of 2 submitted attempts)

This limit:

* Applies independently to each question
* Does not reset on refresh or re-entry

---

### Retry Availability

* Post-submission retry is offered **only after feedback is shown**
* Retry is optional; candidates may always continue without retrying

---

## Attempt Handling

### Creating a Retry Attempt

When a retry is initiated:

* A new attempt number is created for the question
* The new attempt starts with an empty answer field
* Autosave behavior mirrors initial attempts

---

### Preserving Prior Attempts

* All prior attempts remain stored as read-only
* Prior attempts are not compared or scored against one another
* Only the most recent attempt is queued for evaluation

---

## Evaluation Rules for Retries

* Each attempt is evaluated independently
* Feedback is always tied to a specific attempt
* No aggregate or comparative feedback across attempts is shown

---

## Candidate Experience Constraints

Candidates are never shown:

* Numerical attempt counts framed as limits (e.g., “1 of 2 tries left”)
* Comparative language (“better than your previous answer”)
* Any implication that retrying is required

Candidates **may** be shown pre-submission confirmation choices such as:

* Confirm submission
* Continue editing
* Discard draft and retry before submission

These pre-submission options:

* Do not create new attempts
* Do not invoke evaluation
* Do not fall under this retry policy

Retry framing remains neutral and supportive.

---

## Recruiter Visibility Constraints

Recruiters may see:

* That a question was retried
* The number of attempts per question

Recruiters may not see:

* Candidate coaching feedback
* Differences between attempts
* Any evaluative interpretation of retries

---

## Session State Transitions

* Initiating a retry sets the question state to `IN_SESSION`
* Submitting a retry transitions the session to `AWAITING_EVAL`
* Completion of retry evaluation follows UF-C3

---

## Policy Overrides (Future Extension)

This policy allows for future configuration, including:

* Different retry limits per role or question type
* Retry disabled for specific questions
* Organization-level defaults

Any override must be explicitly declared and versioned.

---

## Invariants

* Pre-submission confirmation actions never create attempts
* Only submitted responses create attempts
* Post-submission retries never mutate question content
* Post-submission retries never erase history
* Post-submission retries never affect recruiter-facing scoring or decisions
* Post-submission retries always require explicit candidate action

---

This retry policy governs **post-submission retries only**, ensuring candidates can practice deliberately while preserving clear boundaries between drafting, submission, evaluation, and learning.
