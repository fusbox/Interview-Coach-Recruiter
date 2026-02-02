# Use Case: System Streams Session State Updates

## Use Case ID
UC-S2

---

## Summary
The system streams session state updates so clients can remain responsive and informed during asynchronous operations (e.g., question generation, evaluation) without treating streamed data as authoritative.

---

## Primary Actor
System

---

## Secondary Actors
- Candidate (consumer of updates)
- Recruiter (consumer of updates, where applicable)
- Streaming Channel (SSE)
- Client Application

---

## Preconditions
- A valid session exists.
- One or more asynchronous operations are in progress (e.g., question generation, evaluation).
- A client is connected via an approved streaming mechanism (SSE), or is eligible for polling fallback.

---

## Trigger
A system-side state change or significant progress event occurs during an asynchronous workflow.

---

## Main Success Scenario
1. System detects a state transition or progress milestone (e.g., generation started, evaluation completed).
2. System publishes a streaming message describing the update, including:
   - session identifier
   - event type or status indicator
   - correlation identifier
3. Client receives the streaming message.
4. Client updates transient UI state (e.g., loading indicators, progress messaging).
5. When a terminal or meaningful state change occurs, system sends an `invalidate` signal.
6. Client refetches the authoritative `/now` projection to render the updated state.

---

## Postconditions
- Clients are informed of progress or completion without relying on streamed payloads as the source of truth.
- The authoritative session state remains accessible and correct via `/now`.

---

## Alternate / Error Scenarios

### A1 — Streaming Channel Unavailable
**Scenario:** SSE connection fails or is unsupported by the client.  
**System behavior:**
- System does not depend on streaming for correctness.
- Client uses polling based on server-provided hints (e.g., `pollAfterMs`).
- No loss of state or functionality occurs.

---

### A2 — Duplicate or Out-of-Order Messages
**Scenario:** Streaming messages arrive multiple times or out of sequence.  
**System behavior:**
- Client treats messages as advisory.
- Client relies on `/now` for authoritative state reconciliation.

---

### A3 — Client Disconnects Mid-Stream
**Scenario:** Client disconnects during an asynchronous operation.  
**System behavior:**
- System continues processing without regard to client connectivity.
- Client can reconnect and resume via `/now`.

---

## System Responsibilities
- Publish streaming messages for meaningful progress and state changes.
- Include correlation identifiers to support traceability.
- Ensure streaming is advisory and never authoritative.
- Support polling fallback as a first-class alternative.

---

## Non-Responsibilities
- The system does not guarantee delivery of all streaming messages.
- The system does not require clients to maintain persistent connections.
- The system does not encode full session state in streaming payloads.

---

## Relevant Architecture Contracts
- `04-architecture/state-and-streaming-contract.md`
- `04-architecture/api-surface.md`
- `04-architecture/stability-and-change-policy.md`

---

## Notes
- Streaming exists to improve perceived responsiveness, not to replace deterministic state retrieval.
- Any changes to streaming semantics require gate review due to UX and reliability implications.
