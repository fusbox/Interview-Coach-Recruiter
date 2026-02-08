SCREEN 1: INTAKE

(Sets session intent / tier without feeling like a form)

Purpose (Why this screen exists)

Establish how much guidance the user wants right now

Set session-level tier without implying skill level

Avoid overwhelming first-time users (especially RangamWorks)

Tier here means verbosity and explicitness, not competence.

Components

Screen title

Single intake question

Three selectable options (radio or cards)

Primary CTA

Copy (final, shippable)
Title

Let’s set up your practice

Prompt

How would you like coaching to show up today?

Subtext (optional, small)

You can change this later.

Options (exact copy → internal mapping)

Just help me practice and feel comfortable
Best if you’re warming up or trying this for the first time.
→ Tier 0

Help me improve how I answer interview questions
Focused on clarity and structure.
→ Tier 1

Give me targeted coaching for this role
More specific guidance, when you want it.
→ Tier 2

Primary CTA

Start practicing

Placement & Layout (mobile-first)

Single vertical column

Prompt at top

Options stacked, tappable

CTA pinned or at bottom

No progress indicators. No “step 1 of X.”

Implementation Notes

Default selection: Option 1

Store as session.coachingPreference

This sets initial tier, not a user profile

Never display the word “tier” in UI

Rules & Guardrails

❌ No confidence scoring

❌ No “difficulty level”

❌ No multi-question wizard

✅ One question only

✅ User intent > inferred ability

Flow Guidance

Intake → Session screen immediately

Skipping intake defaults to Tier 0

Tier may adapt later only via explicit opt-in

---

SCREEN 2: SESSION

(Where the user answers questions — calm, focused, non-judgmental)

Purpose

Create a safe space to answer

Minimize cognitive load

Avoid premature coaching or evaluation

Support voice-first, text-optional interaction

This screen should feel like:
“I’m here with you. Just answer.”

Core Structural Model

Two primary blocks only:

Transcript Block (context)

Input Block (action)

Everything else is behavior, not layout.

COMPONENT A: TRANSCRIPT BLOCK
Purpose

Provide context for the current turn

Enable reflection after submission

Avoid “chat log” anxiety

This is contextual memory, not history.

States & Behavior
A. New Question (default)

Content

Question text (primary)

Optional helper line

Copy

Helper line (optional):
Take your time.

Behavior

On new question, transcript content replaces prior content

Use a fade / crossfade, not scroll

No history visible by default

B. After Submission (Review handled on Feedback screen)

Transcript later shows:

Question

User’s answer (read-only)

Voice playback button

Copy

Answer label: Your answer

Playback: Play response

C. Navigating Back via Question Navigator

Navigator

Entry point: “Questions”

Opens bottom sheet (mobile)

Shows list with answered / unanswered status only

On selection

Transcript block replaces content with:

That question

That answer

Input block is replaced with CTAs:

Retry this question (primary)

Continue (secondary)

D. Retry Flow

When user taps Retry:

Discard submitted answer immediately

Keep question visible

Restore input block

No confirmation modal

Feels decisive, not apologetic.

Rules

❌ No live chat history during answering

❌ No coaching language in transcript

❌ No automatic scrolling history

✅ History only when user asks for it

COMPONENT B: INPUT BLOCK
Purpose

The only interactive surface during answering

Absorb all state changes (idle → recording → submitted)

Voice Mode (default)
Idle

Copy

Primary: Tap to start

Subtext: You can stop anytime.

Recording

Copy

Primary: Listening

Subtext (static or slow rotation):

Take your time

It’s okay to pause

Behavior

No timers

No energetic waveform

Question block may visually collapse

Silence Detected (optional)

Copy

Whenever you’re ready.

No alerts. No error styling.

Stop / End

Copy

Got it.

Shown briefly (~300ms) before transition.

Mic Permission Error

Copy

We couldn’t access your microphone.
You can type your answer instead.

Action

Type your answer

Text Mode (escape hatch)

Entry CTA

Type instead

Placeholder

Type your answer here…

Submit

Submit answer

No character counts. No minimum warnings.

Mode Rules

No hard toggle

Text is always available as escape

Do not mix voice + text mid-answer

Switching modes resets the attempt

COMPONENT C: HINT SYSTEM (Session Screen)
Purpose

Reduce blank-page anxiety

Provide preparatory scaffolding, not feedback

Entry Point (all tiers)

CTA

Need a hint?

Placement:

Below question

Above input block

Text-only. No icon.

Hint Taxonomy (3 categories only)

Structuring your answer

Explaining the outcome

Staying focused

Tier Mapping
Tier 0

Tap → one generic tip

No categories shown

Example:

You can focus on one example—what happened, what you did, and what changed.

Tier 1

Tap → category selector

User selects one → sees one tip

Example:

You don’t need a big result—just explain what was different at the end.

Tier 2

Same UI

Copy may reference role context

Example:

For customer-facing roles, explaining what changed helps show impact.

Hint Rules

❌ Never reference past answers

❌ Never imply mistakes

❌ Never sound corrective

✅ Always optional

✅ Disappear once answering begins

Flow Guidance (Session)

Question loads → transcript shows question

Optional hint

User answers (voice/text)

Submit / stop

Transition to Feedback screen

---

SCREEN 3: FEEDBACK (REVIEW)

(Where reflection and coaching happen)

Purpose

Provide acknowledgement

Offer one actionable coaching lever

Encourage iteration without pressure

Structure (fixed)

Zones appear in this order only:

Acknowledgement

Primary coaching focus

Why this helps (Tier 1+)

Optional observations (collapsed)

Next action

Copy
Acknowledgement (1 sentence)

Examples:

You shared a clear example and stayed focused on the situation.

You explained the steps you took in a clear order.

Observational only.

Primary Coaching Focus

Headline

Focus on stating the outcome clearly.

Body

You explained what you did; adding what changed afterward can help complete the story.

Exactly one focus.

Why This Helps (Tier 1+ only)

Example:

When outcomes are stated clearly, it helps others understand the impact of your actions.

Never simulate interviewer judgment.

Observations (collapsed)

Examples:

The situation was described clearly.

The steps you took were easy to follow.

No advice verbs.

Next Actions

Primary (one only):

Try answering again

Practice another example

Continue to the next question

Secondary:

Stop for now

No urgency language.

Loader / Transition Behavior

Subtle “thinking” loader (skeleton shimmer)

Loader → acknowledgement (pause)

Focus fades in after acknowledgement

Total time ≈ 2 seconds

No spinners. No “analyzing…” text.

Edge / Empty States
Model timeout

Fall back to safe Tier 0 feedback

Do not notify user of error

No answer captured

Return to session screen

Copy: Whenever you’re ready.

User abandons

Save progress silently

No guilt copy on return

Rules & Guardrails (Feedback)

❌ No scores

❌ No rankings

❌ No readiness claims

❌ No “interviewers expect”

✅ One lever only

✅ Stopping always acceptable

Flow Guidance (End-to-End)

Intake sets session intent

Session screen supports answering

Feedback screen supports reflection

Retry loops back cleanly

Navigator enables review without pressure