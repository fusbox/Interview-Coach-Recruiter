import { useState, useRef, useEffect, useCallback } from 'react';

const TRACKING_INTERVAL_MS = 1000;
const WINDOW_EXTENSION_MS = 30000; // 30 seconds
const AUTO_SAVE_INTERVAL_MS = 10000; // 10 seconds
const MAX_DEBUG_EVENTS = 50;

const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for insecure contexts (mobile dev)
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export type EngagementTier = 'tier1' | 'tier2' | 'tier3';

export interface TrackerEvent {
    id: string;
    timestamp: number;
    type:
    | 'WINDOW_OPEN'
    | 'WINDOW_EXTEND'
    | 'WINDOW_CLOSE'
    | 'TRACK_EVENT'
    | 'PRESENCE_LOST'
    | 'PRESENCE_REGAINED';
    tier?: EngagementTier;
    details?: string;
}

interface UseEngagementTrackerProps {
    isEnabled: boolean;
    onUpdate: (seconds: number) => void;
    isContinuousActive?: boolean; // e.g., isRecording
}

export const useEngagementTracker = ({
    isEnabled,
    onUpdate,
    isContinuousActive = false,
}: UseEngagementTrackerProps) => {
    const [totalEngagedSeconds, setTotalEngagedSeconds] = useState(0);
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [windowTimeRemaining, setWindowTimeRemaining] = useState(0);
    const [debugEvents, setDebugEvents] = useState<TrackerEvent[]>([]);

    // Refs for state that shouldn't trigger re-renders or dependency chains
    const windowExpiryRef = useRef<number>(0);
    const accumulatedSecondsRef = useRef<number>(0);
    const lastSaveRef = useRef<number>(0);
    const onUpdateRef = useRef(onUpdate);
    const isWindowOpenRef = useRef(isWindowOpen);

    // Keep ref synced
    useEffect(() => {
        onUpdateRef.current = onUpdate;
        isWindowOpenRef.current = isWindowOpen;
    }, [onUpdate, isWindowOpen]);

    // Debug Helper
    const logEvent = useCallback(
        (type: TrackerEvent['type'], tier?: EngagementTier, details?: string) => {
            const event: TrackerEvent = {
                id: generateId(),
                timestamp: Date.now(),
                type,
                tier,
                details,
            };
            setDebugEvents((prev) => [event, ...prev].slice(0, MAX_DEBUG_EVENTS));
        },
        []
    );

    // Helper: Open or Extend the Window
    const updateWindow = useCallback(
        (tier: EngagementTier, eventType?: string, durationSeconds?: number) => {
            const now = Date.now();
            const extensionTime = (durationSeconds || 30) * 1000;

            // Tier 1: Presence (Gatekeeper) - handled in the interval check,
            // but we also check it here to prevent opening windows when hidden.
            if (document.hidden) {
                if (isWindowOpen) {
                    setIsWindowOpen(false);
                    logEvent('WINDOW_CLOSE', undefined, 'Presence lost during update');
                }
                return;
            }

            const typeLabel = eventType ? `: ${eventType}` : '';

            if (tier === 'tier3') {
                // Tier 3: Task Event - ALWAYS opens/resets the window
                setIsWindowOpen(true);
                windowExpiryRef.current = now + extensionTime;
                logEvent('WINDOW_OPEN', 'tier3', `Task Event detected${typeLabel}`);
            } else if (tier === 'tier2') {
                // Tier 2: Interaction - ONLY extends if window is already open
                if (isWindowOpen && now < windowExpiryRef.current) {
                    windowExpiryRef.current = now + extensionTime;
                    logEvent('WINDOW_EXTEND', 'tier2', `Interaction extended window${typeLabel}`);
                } else {
                    logEvent('TRACK_EVENT', 'tier2', `Ignored: Window not open${typeLabel}`);
                }
            }
        },
        [isWindowOpen, logEvent]
    );

    // Expose methods for components to report events
    const trackEvent = useCallback(
        (tier: EngagementTier, eventType?: string, durationSeconds?: number) => {
            if (!isEnabled) return;
            updateWindow(tier, eventType, durationSeconds);
        },
        [isEnabled, updateWindow]
    );

    // Main Tracking Loop
    useEffect(() => {
        if (!isEnabled) return;

        const intervalId = setInterval(() => {
            const now = Date.now();

            // 1. Check Presense (Tier 1)
            if (document.hidden) {
                if (isWindowOpenRef.current) {
                    setIsWindowOpen(false);
                    logEvent('PRESENCE_LOST', undefined, 'Tab hidden');
                }
                setWindowTimeRemaining(0);
                return;
            }

            // 2. Handle Continuous Activity (Virtual Tier 3)
            if (isContinuousActive) {
                if (!isWindowOpenRef.current) {
                    logEvent('WINDOW_OPEN', 'tier3', 'Continuous activity started');
                    setIsWindowOpen(true);
                }
                windowExpiryRef.current = now + WINDOW_EXTENSION_MS;
            }

            // 3. Accrue Time if Window is Open
            // Use ref to read current state without breaking dependency chain
            if (isWindowOpenRef.current && now < windowExpiryRef.current) {
                setTotalEngagedSeconds((prev) => {
                    const newVal = prev + 1;
                    accumulatedSecondsRef.current += 1;
                    return newVal;
                });
                setWindowTimeRemaining(Math.ceil((windowExpiryRef.current - now) / 1000));
            } else {
                // Window expired
                if (isWindowOpenRef.current) {
                    setIsWindowOpen(false);
                    logEvent('WINDOW_CLOSE', undefined, 'Time expired');
                }
                setWindowTimeRemaining(0);
            }

            // 4. Auto-save periodically
            if (now - lastSaveRef.current > AUTO_SAVE_INTERVAL_MS) {
                if (accumulatedSecondsRef.current > 0) {
                    onUpdateRef.current(accumulatedSecondsRef.current);
                    accumulatedSecondsRef.current = 0; // Reset delta
                    lastSaveRef.current = now;
                }
            }
        }, TRACKING_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [isEnabled, isContinuousActive, logEvent]);

    // Flush on unmount
    useEffect(() => {
        return () => {
            if (accumulatedSecondsRef.current > 0) {
                onUpdateRef.current(accumulatedSecondsRef.current);
                accumulatedSecondsRef.current = 0;
            }
        };
    }, []);

    return {
        totalEngagedSeconds,
        isWindowOpen,
        trackEvent,
        // Debug exports
        debugEvents,
        windowTimeRemaining,
        clearDebugEvents: () => setDebugEvents([]),
    };
};
