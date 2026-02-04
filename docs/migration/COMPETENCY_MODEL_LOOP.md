# The Competency-Driven Model: Loop & Migration Guide

This document outlines how the **Competency-Driven Model** generates content/evaluation and provides a **Migration Guide** for adapting this core loop to the "Invite-by-Recruiter" use case.

**Core Concept**: The "Brain" of the system is the **Blueprint**. In the current app, it is generated at *runtime* by the candidate. In the new "Invite" architecture, it must be generated *upstream* by the Recruiter and locked to the session.

---

## Step 1: Defining the Standard (The Blueprint)
### Current Implementation (Self-Service)
- **Time**: Runtime (Session Start)
- **Actor**: Candidate
- **Input**: User enters Role/JD directly.
- **Code**: [`api/_controllers/generate-blueprint.ts`](file:///c:/dev/AI_Interview_Prep_Coach_Standalone/api/_controllers/generate-blueprint.ts)

### 🚀 Migration Adaptation: "Recruiter Config" (US-1.1)
The Blueprint generation must move to the **Recruiter Dashboard**.
- **Constraint**: The Candidate must NOT define the role. They must consume the Blueprint defined by the Recruiter.
- **Architecture Change**:
  1. Recruiter creates `InviteConfig` (Role + JD).
  2. System calls `generate-blueprint` immediately and saves the resulting JSON to `invites` table.
  3. `InviteLink` is generated containing the `inviteId`.
- **Why**: Ensures every candidate for the same role is graded against the *exact same* standard.

---

## Step 2: Designing the Syllabus (The Question Plan)
### Current Implementation
- **Time**: Runtime (Session Start)
- **Actor**: Candidate (Implicit)
- **Logic**: AI generates a balanced 5-question plan from the Blueprint.
- **Code**: [`api/_controllers/generate-question-plan.ts`](file:///c:/dev/AI_Interview_Prep_Coach_Standalone/api/_controllers/generate-question-plan.ts)

### 🚀 Migration Adaptation: "Pre-Flight Check"
The Question Plan should ideally be generated **at Invite Creation** (Optional) or **Locked on First Access**.
- **Constraint**: If Recruiter sets "Standardize Questions" (US-2.2), this Step must happen during Invite Creation so all candidates get the same questions.
- **Dev Note**: `generate-question-plan.ts` currently takes a Blueprint. It can be reused as-is but called by the Recruiter Service.

---

## Step 3: Conducting the Interview (Question Content & Tone)
### Current Implementation
- **Time**: Runtime (Per Question)
- **Actor**: Candidate
- **Context**: Adjusts Tone/Difficulty based on *Candidate Intake* (Confidence, Goals).
- **Code**: [`api/_controllers/generate-questions.ts`](file:///c:/dev/AI_Interview_Prep_Coach_Standalone/api/_controllers/generate-questions.ts)

### 🚀 Migration Adaptation: "Invite Context Injection" (US-3.1)
The Candidate still accesses this via a link, but the **Context** changes source.
- **Challenge Level**: Now set by Recruiter (e.g., "Hard Mode" for everyone).
- **Confidence**: Still comes from Candidate Intake (US-3.2, "Understand what this is").
- **Integration Point**: The `generate-questions` controller needs to merge `InviteConfig` (Recruiter Constraints) with `IntakeData` (Candidate State).
  - *Conflict Rule*: Recruiter "Challenge Level" overrides Candidate preference? (Decision required).

---

## Step 4: Grading the Performance (Evaluation)
### Current Implementation
- **Time**: Runtime (After Answer)
- **Actor**: Candidate (Viewer)
- **Output**: Detailed coaching feedback, "Try Saying This", Numeric Scores.
- **Code**: [`api/analyze-answer.ts`](file:///c:/dev/AI_Interview_Prep_Coach_Standalone/api/analyze-answer.ts)

### 🚀 Migration Adaptation: "Dual-View Reporting" (US-2.1)
The Evaluation logic remains valid (scoring against Blueprint), but the **Persistence** and **Viewing** requirements change drastically.
- **Persistence**: Results must be saved to the database linked to `inviteId` (US-1.3). Currently local only.
- **Recruiter View**: The Recruiter is FORBIDDEN from seeing "Numeric Scores" (US-2.1 Explicit Exclusion).
  - **Action**: We need a "Summary Transformation" layer.
  - `analyze-answer` returns `score: 85`.
  - Recruiter View Map: `85` -> "Ready" (Band).
  - Candidate View Map: `85` -> "Strong! (85/100)".
- **Privacy**: `analyze-answer` feedback ("Try saying...") is for Candidate only. Recruiter sees "Readiness Signals".

---

## Step 5: The Report Card (Session Evaluation)
### Current Implementation
- **Time**: Session End
- **Output**: Aggregate of Step 4 results.

### 🚀 Migration Adaptation: "The Hiring Signal" (US-2.1)
The Recruiter needs a **Readiness Indicator**, not a coaching report.
- **Algo**: `SessionSummary` must aggregate `dimensionScores` from all questions to produce one "Primary Readiness Indicator" (Ready / Potential / Practice).
- **Constraint**: This aggregation logic must be consistent.
- **Action**: Create a new Domain Service `ReadinessEvaluator` that takes `SessionData` and outputs `ReadinessPayload` (Band + 2-3 Descriptors).

---

## Summary of Architectural Deviations

| Feature | Current App (Self-Service) | Invite-by-Recruiter (Target) |
| :--- | :--- | :--- |
| **Blueprint** | Created by Candidate at Runtime | Created by Recruiter, Stored in DB |
| **Questions** | Dynamic per user | Standardized per Invite (Configurable) |
| **Persistence** | Browser / Local Storage | Server-side Database (Supabase) |
| **Auth** | Guest / Anonymous | Invite Token Validation |
| **Results** | "Here is how to improve" | "Is this person ready?" (Readiness Bands) |
