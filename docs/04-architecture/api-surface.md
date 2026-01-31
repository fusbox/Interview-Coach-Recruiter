> **Stability:** Locked for V1. Changes that alter system meaning, authority boundaries,
> privacy posture, or resume guarantees require a Gate Decision update.

# API Surface (Architectural)

## Purpose

This document defines the **public API surface** between the client applications
(candidate and recruiter) and the server.

It exists to:
- Make responsibility boundaries explicit
- Support security and privacy reviews
- Stabilize client/server contracts as the system evolves

This document intentionally avoids implementation details, schemas, and transport
optimizations. Those belong in code and contracts.

---

## Design Principles

- APIs reflect **system actions**, not UI mechanics
- All state-changing APIs are **idempotent**
- Server endpoints enforce access and authority
- Clients consume **projections**, not raw tables
- Streaming channels notify; they do not decide

---

## Candidate-Facing API Surface

### Session Entry & Hydration

| Method | Route                          | Purpose                                                  |
|--------|--------------------------------|----------------------------------------------------------|
| GET    | `/s/[token]`                   | Entry point via candidate invite token                   |
| GET    | `/api/session/{sessionId}/now` | Retrieve current session projection for hydration/resume |

---

### Session Lifecycle

| Method | Route                            | Purpose       |
|--------|----------------------------------|---------------|
| POST   | `/api/session/{sessionId}/start` | Start session |

---

### Question & Answer Interaction

| Method | Route                                                   | Purpose                            |
|--------|---------------------------------------------------------|------------------------------------|
| POST   | `/api/session/{sessionId}/question/{questionId}/draft`  | Persist draft answer snapshot      |
| POST   | `/api/session/{sessionId}/question/{questionId}/submit` | Submit final answer for evaluation |
| POST   | `/api/session/{sessionId}/question/{questionId}/retry`  | Initiate retry flow for a question |

Draft routes support progressive save and offline reconciliation.

---

### Streaming

| Method | Route                             | Purpose                                                     |
|--------|-----------------------------------|-------------------------------------------------------------|
| GET    | `/api/session/{sessionId}/stream` | Server-Sent Events channel for status and streaming updates |

Streaming messages may include:
- Workflow status
- Partial AI outputs
- Completion signals

Streaming does not mutate state.

---

## Recruiter-Facing API Surface

### Session Discovery & Review

| Method | Route                    | Purpose                       |
|--------|--------------------------|-------------------------------|
| GET    | `/r/sessions`            | Recruiter session list        |
| GET    | `/r/session/{sessionId}` | Recruiter session detail view |

---

### Recruiter Projections

| Method | Route                                          | Purpose                                          |
|--------|------------------------------------------------|--------------------------------------------------|
| GET    | `/api/recruiter/session/{sessionId}/summary`   | Derived session summary (readiness, descriptors) |
| GET    | `/api/recruiter/session/{sessionId}/responses` | Raw candidate responses for follow-up guidance   |

Recruiter APIs enforce interpretation boundaries defined in the Dashboard Constitution.

---

## Access & Authorization Rules

- Candidate routes are scoped by **invite token → session**
- Recruiter routes require authenticated recruiter context
- No API permits cross-session or cross-candidate access
- All access checks are enforced server-side

---

## Non-Goals

This document does not:
- Define request/response schemas
- Specify authentication mechanisms
- Describe pagination, filtering, or sorting mechanics
- Guarantee backward compatibility for undocumented routes

Those concerns are handled in implementation and versioning policies.
