import { uuidv7 } from "uuidv7";

/**
 * Time-ordered UUID (v7) for high-write tables (events, logs).
 * Not suitable for secrets/tokens (it leaks time).
 */
export function newEventId(): string {
    return uuidv7();
}

/**
 * Use for correlation IDs (optional): keeps ordering helpful in logs.
 */
export function newCorrelationId(): string {
    return uuidv7();
}