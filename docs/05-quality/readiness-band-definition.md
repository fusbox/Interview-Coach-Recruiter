# Readiness Band Definition

## Purpose

This document defines how the system assigns a **readiness band** to a completed interview practice session.

Readiness bands exist to:
- Give recruiters a fast, interpretable signal of candidate preparation
- Encourage candidate improvement without judgment
- Support consistent QA and AI evaluation
- Remain stable across model, prompt, and UI changes

Readiness bands are **not** assessments, rankings, or hiring recommendations.

---

## Design Principles

- Preparation-focused, not evaluative
- Human-readable, not numeric
- Explainable without exposing model internals
- Stable under minor variation in responses
- Conservative in ambiguity (default down, not up)

---

## Readiness Levels (Canonical Identifiers)

Each readiness band is represented internally by a stable, opaque
Readiness Level (RL) identifier.

- RL1 — Ready
- RL2 — Strong Potential
- RL3 — More Practice Recommended
- RL4 — Incomplete

Readiness Levels are used for:
- AI evaluation and testing
- QA assertions
- System logic and persistence

Display labels may evolve over time, but RL identifiers must remain
stable to preserve semantic meaning and historical consistency.

---

## Allowed Inputs

The following may influence readiness determination:
- Session completion status
- Whether all required questions were answered
- Clarity and coherence of responses
- Relevance of examples to the role
- Evidence of structured thinking (e.g., situation → action → outcome)
- Observable communication patterns (e.g., hesitancy, repetition, clarity)

---

## Explicitly Excluded Inputs

The following must NOT influence readiness:
- Resume content or employment history
- Education level
- Demographic or personal characteristics
- Comparison to other candidates
- Absolute response length
- Vocabulary sophistication
- Accent, speech rate, or filler words alone
- Any numeric or percentage-based scoring system

---

## Readiness Bands

### Ready
The candidate demonstrates clear, relevant examples and communicates them coherently.
Minor refinements may improve performance, but the candidate appears prepared for a live screening.

Typical indicators:
- Answers are complete and role-relevant
- Examples align with common screening expectations
- Communication is generally clear and confident

---

### Strong Potential
The candidate shows strong potential but would benefit from additional practice or clarification.
Preparation is evident, but some responses lack clarity, structure, or specificity.

Typical indicators:
- Inconsistent depth across answers
- Examples present but underdeveloped
- Minor confusion or hesitancy in delivery

---

### More Practice Recommended
The candidate has attempted the session but shows gaps that may hinder a live screening.
Additional preparation is recommended before proceeding.

Typical indicators:
- Vague or incomplete answers
- Difficulty articulating experience
- Limited alignment between examples and role expectations

---

### Incomplete
The session was not completed or lacks sufficient data to determine readiness.

Typical indicators:
- Session abandoned before completion
- Required questions unanswered
- Technical failure preventing response capture

---

## Edge Case Handling

- Partial completion defaults to **Incomplete**
- Text-only sessions are evaluated equivalently to voice sessions
- Retried answers may replace prior attempts for readiness determination
- Technical issues must not penalize readiness beyond completion status

---

## Stability Guarantees

The following changes must NOT alter readiness outcomes:
- Prompt wording refinements
- Model version upgrades
- UI copy or layout changes
- Minor transcription differences

Any change that materially affects readiness classification requires:
- Documentation in the Decision Log
- QA validation against historical sessions
- Stakeholder review if recruiter-facing behavior changes

---

## Review & Ownership

Owner: Product / Quality  
Review cadence: As part of major model or logic changes  
Change control: Decision Log entry required
