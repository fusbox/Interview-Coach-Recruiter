# QA Checklist

This document defines **ship‑blocking quality gates** for the Interview Coach App. It is designed to be used by Product, Design, Engineering, and QA to ensure that changes preserve psychological safety, tier integrity, modality safety, and coaching intent.

The checklist is organized by **global rules**, then **screen‑specific checks**, followed by **edge cases and regression tests**.

---

## GLOBAL QA PRINCIPLES (Apply Everywhere)

### Language & Tone (Hard Rules)

* ⛔ No scores, percentages, ranks, or numeric ratings

* ⛔ No readiness claims (e.g., “ready”, “not ready”, “qualified”)

* ⛔ No screening language (e.g., “pass”, “fail”, “red flag”, “concern”)

* ⛔ No interviewer simulation (e.g., “hiring managers expect…”)

* ⛔ No comparisons to other users

* ⛔ No habitual claims (e.g., “you usually…”, “you often…”, “you tend to…”)

* ✅ Language is observational or permission‑based

* ✅ Coaching is forward‑looking, not corrective

* ✅ Silence is preferred over speculative feedback

**Fail if any forbidden language appears.**

---

### Tier Integrity

* Tier is never named or displayed in the UI
* Tier 0 never surfaces:

  * role expectations
  * competency names
  * “why this matters” explanations
* Tier escalation requires:

  * explicit intake choice **or**
  * explicit in‑session opt‑in
* Tier never escalates silently

**Fail if tier rules are violated.**

---

### Modality Safety

* Voice feedback never references:

  * accent
  * voice quality
  * speed as “too fast/slow”
  * filler‑word counts
* Text feedback never references typing speed
* Voice transcripts are read‑only after submission
* Audio never auto‑plays

**Fail if modality‑unsafe feedback appears.**

---

## SCREEN 1: INTAKE QA

### Structure

* ✅ Exactly **one** intake question
* ✅ Exactly **three** options
* ❌ No progress indicator
* ❌ No multi‑step wizard

### Copy Verification

* Prompt reads:

  > **How would you like coaching to show up today?**
* Option 1 is preselected by default
* No references to:

  * skill level
  * confidence scoring
  * difficulty
  * assessment

### Behavior

* Skipping intake defaults to Tier 0
* Selection affects **session only**, not user profile
* User can proceed immediately

**Fail if intake exceeds one question or implies evaluation.**

---

## SCREEN 2: SESSION QA

### Layout Integrity

* ✅ Only **two primary blocks**:

  * Transcript block
  * Input block
* ❌ No persistent chat log
* ❌ No feedback content visible during answering

---

### Transcript Block

#### New Question State

* Question replaces prior content (fade/replace, not scroll)
* Prior questions are not visible by default
* Helper text (if present) is neutral and optional

#### After Submission

* Transcript shows:

  * Question
  * User answer (read‑only)
* Playback button present for voice answers
* No edit affordance

#### Navigation

* Question navigator hidden unless explicitly opened
* Navigator shows only:

  * question identifier
  * answered / unanswered status
* Selecting a prior question:

  * replaces transcript content
  * replaces input with “Retry this question” CTA

#### Retry Behavior

* Retry discards previous answer immediately
* No confirmation modal
* Input block returns cleanly
* No ghost transcript content

**Fail if prior answers remain visible during active answering.**

---

### Input Block — Voice Mode

#### Idle

* Copy:

  * “Tap to start”
  * “You can stop anytime”
* Mic is the primary affordance

#### Recording

* Copy:

  * “Listening”
  * supportive subtext only (e.g., “Take your time”)
* ❌ No timers
* ❌ No energetic waveform
* ❌ No coaching text visible

#### Silence Handling

* Gentle prompt only:

  * “Whenever you’re ready”
* No alerts or warnings

#### Stop / End

* “Got it.” appears briefly
* Transition to feedback flow

#### Errors

* Mic permission error uses human language
* Immediate text fallback shown
* No dead ends

**Fail if recording feels evaluative or rushed.**

---

### Input Block — Text Mode

* Text mode accessible without navigation
* Placeholder is neutral
* Submit button appears only when text exists
* ❌ No character counts
* ❌ No minimum‑length warnings

**Fail if text mode is hidden or discouraged.**

---

### Hint System (Session Screen)

#### Entry Point

* Exactly one CTA:

  * “Need a hint?”
* Text‑only, no icon
* Positioned between question and input

#### Behavior

* Hints appear **only** on user tap
* Hints disappear when answering begins
* No hint content during recording or typing

#### Tier Mapping

* Tier 0:

  * single generic tip
  * no categories
* Tier 1+:

  * category selection allowed
  * exactly one tip shown
* Tier 2:

  * may reference role context
  * still generic and preparatory

#### Content Rules

* Hints never reference:

  * user behavior
  * past answers
  * mistakes
* Hints never sound corrective

**Fail if hints appear automatically or feel judgmental.**

---

## SCREEN 3: FEEDBACK (REVIEW) QA

### Loader & Transitions

* Loader is subtle (skeleton or shimmer)
* ❌ No spinners
* ❌ No “analyzing…” text
* Loader visible for minimum duration
* Acknowledgement appears alone briefly

**Fail if feedback appears instantly without pause.**

---

### Feedback Structure (Must Be Preserved)

Order is fixed:

1. Acknowledgement
2. Primary coaching focus
3. Why this helps (Tier 1+ only)
4. Optional observations (collapsed)
5. Next action

**Fail if order changes or zones are merged.**

---

### Acknowledgement

* Exactly one sentence
* Observational only
* ❌ No praise inflation (“great”, “excellent”)
* ❌ No critique

---

### Primary Coaching Focus

* Exactly one focus
* Communication‑level framing
* Actionable for the next attempt
* ❌ No stacked advice

**Fail if multiple focuses appear.**

---

### Why This Helps

* Visible only Tier 1+
* Explains listener benefit, not expectations
* ❌ No interviewer simulation

---

### Observations

* Collapsed by default
* 0–3 bullets only
* Observational language only
* ❌ No advice verbs

---

### Next Actions

* Exactly one primary CTA
* Secondary “Stop for now” always allowed
* ❌ No urgency language
* Stopping never framed as failure

**Fail if user is pressured to continue.**

---

## EDGE & FAILURE CASE QA

### Model Failure / Timeout

* Deterministic Tier 0 fallback used
* User is not informed of model failure
* Feedback remains calm and valid

### Empty Answer

* User returned to session screen
* Copy: “Whenever you’re ready”
* ❌ No scolding or warnings

### Rapid Abandon / Restart

* ❌ No warning dialogs
* ❌ No negative copy
* System remains neutral

### Accessibility

* Keyboard access for mic controls
* Reduced‑motion preferences respected
* Screen‑reader labels present for:

  * loader
  * mic states
  * playback controls

---

## REGRESSION / ABUSE TESTS (Must Pass)

* High‑confidence user selects Tier 0 → feedback remains gentle
* Low‑confidence user selects Tier 2 → language remains supportive
* User retries repeatedly → no escalation in tone
* User never opens hints → no hint pressure appears
* User opens hints repeatedly → hints remain preparatory
* Voice answer with long pauses → no speed commentary
* Short text answer → no “too short” feedback

**Fail if the system becomes more judgmental under stress.**

---

## FINAL SHIP GATE

Before shipping any change, ask:

> *“Would this feel okay if I were nervous, under pressure, and trying my best?”*

If the answer is not an unqualified **yes**, the change does not ship.
