## Stack:

Frontend: Vite + React 18 + React Router v6.
Structure: Client-Side Single Page App (SPA).
Servers: Vercel Serverless Functions (for api/generators and api/analyze-answer).
State Implementation (/now status):

Currently: Client-Assembled.

## Details:
State is managed via useSession context and useInterviewSession hooks.
Logic like "Next Question" or "Coach Analysis" happens by the client calling stateless API endpoints and aggregating the result in local React state (persisted to Supabase/LocalStorage).
There is no dedicated server-side "session orchestrator" or state machine; the client drives the transitions.

---

## Architecture Migration Map: Headless Core
Status: Draft / Documentation Purpose: Mapping current scattered logic to a headless 
core architecture.

1. Directory Structure Target
The goal is to extract logic from React Components/Contexts into a pure TypeScript domain layer.

/src
  /core
    /domain         <-- Pure business logic (Entities, Logic)
    /state          <-- Application State (Stores, Selectors)
    /api            <-- External communications
    /types          <-- Shared schemas
2. Migration Map
A. Domain Layer (/core/domain)
Pure functions and class entities. No React hooks here.

Target File	Source (Current Location)	Logic to Extract
session.ts
src/context/SessionContext.tsx
startSession, nextQuestion, finishSession logic. State transitions (IDLE -> ACTIVE -> COMPLETED).
evaluation.ts	
services/coachService.ts
Logic for calculating signals, competencyConstellations, and baseline metrics from raw question analysis.
question.ts	
api/analyze-answer.ts
 (Logic)	Logic for determining if an answer is "strong" or "weak" (currently prompts, should be formalized types).
B. State Layer (/core/state)
Where the data lives. The "Single Source of Truth".

Target File	Source (Current Location)	Logic to Extract
nowProjection.ts	
src/context/SessionContext.tsx
The session object state. Logic for "Current Question", "Next Question", "Is Loading".
selectors.ts	src/hooks/useInterviewSession.ts	(If exists) Logic that computes specific view data (e.g. "progress percentage") from the raw session object.
C. API Layer (/core/api)
Gateway to the backend/external world.

Target File	Source (Current Location)	Logic to Extract
client.ts	services/geminiService.ts	generateQuestions, generateSpeech, analyzeAnswer.
persistence.ts	
services/storageService.ts
saveSession
, 
getAllSessions
, 
deleteSession
. (Supabase + LocalStorage abstraction).
D. Types (/core/types)
Zod schemas and Interfaces.

Target File	Source (Current Location)	Logic to Extract
schemas.ts
api/schemas.ts
IntakeDataSchema, AnalyzeAnswerSchema.
models.ts	
src/types/index.ts
InterviewSession
, 
Question
, 
AnalysisResult
.
3. The "Shell" Strategy
Once the core is built, the existing React components become "dumb" shells.

Example: 
SessionContext.tsx
 Transformation Before:

// SessionContext.tsx
const startSession = async () => {
   const data = await externalApi.call(); // Logic mixed with state
   setSession(data);
}
After:

// SessionContext.tsx (The Shell)
import { startSession } from '@/core/domain/session';
const handleStart = async () => {
   // Delegate purely to Core
   const newSession = await sessionCore.start(inputs);
   dispatch(actions.sessionStarted(newSession));
}
4. Prioritized Action Plan
Extract Types: Move checking/zod schemas to /core/types.
Extract API: Move geminiService and storageService calls to standardized /core/api clients.
Extract Domain: Pull the "Next Question" calculation and "Finish Session" validation out of Context and into pure functions.