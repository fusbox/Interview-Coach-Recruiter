import React, { useEffect, useMemo, useReducer, useRef } from "react";

// -----------------------------
// Types / Enums
// -----------------------------
type Modality = "text" | "voice";
type EscalationTier = 0 | 1 | 2;
type SignalQuality = "insufficient" | "emerging" | "reliable" | "strong";
type ConfidenceLevel = "low" | "medium" | "high";

type CommDimension =
  | "structural_clarity"
  | "outcome_explicitness"
  | "specificity_concreteness"
  | "decision_rationale"
  | "focus_relevance"
  | "delivery_control";

type ReviewPhase =
  | "idle"
  | "submitting"
  | "thinking_loader"
  | "ack_only"
  | "focus_revealed"
  | "full_feedback_ready";

type RawFacts = {
  sessionId: string;
  userId: string;
  roleId?: string;
  sessionType: "practice" | "assessment" | "recruiter_guided";
  questionId: string;
  competencyTags: string[];
  modality: Modality;

  responseDurationMs: number;
  retryCount: number;

  starDetected: { s: boolean; t: boolean; a: boolean; r: boolean };
  outcomeStatementDetected: boolean;
  concreteExampleMarkersCount: number;
  reflectionMarkersDetected: boolean;

  voice?: {
    paceCategory?: "slow" | "ok" | "fast" | "unknown";
    pausingAdequacy?: "low" | "ok" | "high" | "unknown";
    clarityIssuesDetected?: boolean | "unknown";
  };

  selfReportedConfidence?: ConfidenceLevel;
};

type DerivedMetrics = {
  sampleSizeAnswersRolling: number;
  recencyDays: number;
  varianceByDimensionRolling?: Partial<Record<CommDimension, number>>;
};

type FeedbackPayload = {
  ack: string;
  primaryFocus: {
    dimension: CommDimension;
    headline: string;
    body: string;
  };
  whyThisMatters?: string;
  observations?: string[];
  nextAction: {
    label: string;
    actionType: "redo_answer" | "next_question" | "practice_example" | "stop_for_now";
  };
  meta: {
    tier: EscalationTier;
    modality: Modality;
    signalQuality: SignalQuality;
    confidence: ConfidenceLevel;
  };
};

type ReviewContext = {
  surface: "rangamworks" | "recruiter_prep";
  optedIntoDeeperCoaching: boolean;
  isMobile: boolean;
};

// -----------------------------
// Timing constants (tweakable)
// -----------------------------
const TIMING = {
  loaderMinMs: 450,
  loaderMaxMs: 900,
  ackSoloHoldMs: 700,
};

// -----------------------------
// Pure decision helpers
// -----------------------------
function computeSignalQuality(derived: DerivedMetrics): SignalQuality {
  const n = derived.sampleSizeAnswersRolling;
  if (n < 2) return "insufficient";
  if (n < 4) return "emerging";

  const recency = derived.recencyDays;
  const varianceValues = Object.values(derived.varianceByDimensionRolling ?? {});
  const highVariance = varianceValues.some((v) => v != null && v > 0.35);

  if (recency > 30) return "emerging";
  if (highVariance) return "reliable";
  return "strong";
}

function computeEscalationTier(ctx: ReviewContext, signal: SignalQuality, userConf: ConfidenceLevel): EscalationTier {
  if (signal === "insufficient" || signal === "emerging") return 0;

  if (ctx.surface === "rangamworks") {
    if (!ctx.optedIntoDeeperCoaching) return 1;
    if (signal === "strong" && userConf !== "low") return 2;
    return 1;
  }

  // recruiter prep
  if (signal === "strong") return 2;
  return 1;
}

function choosePrimaryFocusDimension(raw: RawFacts, tier: EscalationTier): CommDimension {
  if (!raw.outcomeStatementDetected) return "outcome_explicitness";

  const star = raw.starDetected;
  const starMissing = !(star.s && star.t && star.a && star.r);
  if (starMissing) return "structural_clarity";

  if (raw.concreteExampleMarkersCount < 1) return "specificity_concreteness";

  if (raw.modality === "voice") {
    if (raw.voice?.pausingAdequacy === "low") return "delivery_control";
  }

  if (tier >= 1) return "decision_rationale";
  return "structural_clarity";
}

function buildDeterministicFallbackFeedback(
  modality: Modality,
  focusDim: CommDimension,
  tier: EscalationTier,
  signal: SignalQuality,
  confidence: ConfidenceLevel
): FeedbackPayload {
  const ack =
    modality === "voice"
      ? "You shared a clear example and stayed with the situation."
      : "You gave a clear example and stayed focused on the question.";

  const headline: Record<CommDimension, string> = {
    structural_clarity: "Focus on clear story structure.",
    outcome_explicitness: "Focus on stating the outcome clearly.",
    specificity_concreteness: "Focus on adding one concrete detail.",
    decision_rationale: "Focus on explaining one key choice.",
    focus_relevance: "Focus on staying centered on the main example.",
    delivery_control: "Focus on a short pause at transitions.",
  };

  const body: Record<CommDimension, string> = {
    structural_clarity: "A clear beginning and ending can make your answer easier to follow.",
    outcome_explicitness: "You explained what you did; adding what changed afterward can complete the story.",
    specificity_concreteness: "One small detail can help the listener picture the moment.",
    decision_rationale: "Adding why you chose that approach can clarify your thinking.",
    focus_relevance: "Keeping the answer tight helps the listener follow your main point.",
    delivery_control: "A brief pause before the outcome can help the listener catch the key point.",
  };

  return {
    ack,
    primaryFocus: { dimension: focusDim, headline: headline[focusDim], body: body[focusDim] },
    observations: ["Your example stayed grounded in a real situation."],
    nextAction: { label: "Try answering again", actionType: "redo_answer" },
    meta: { tier, modality, signalQuality: signal, confidence },
  };
}

// -----------------------------
// Machine State + Events
// -----------------------------
type MachineState = {
  phase: ReviewPhase;
  // derived context for this submission
  computed?: {
    signalQuality: SignalQuality;
    tier: EscalationTier;
    confidence: ConfidenceLevel;
    focusDim: CommDimension;
    whyAllowed: boolean;
  };

  feedback?: FeedbackPayload;

  // UI expansion state
  whyExpanded: boolean;
  obsExpanded: boolean;

  // error state (kept internal)
  error?: { kind: "timeout" | "invalid_json" | "unknown"; message: string };
};

type Event =
  | { type: "SUBMIT" }
  | { type: "MODEL_RESOLVED"; payload: FeedbackPayload }
  | { type: "MODEL_FAILED"; error: MachineState["error"] }
  | { type: "ENTER_LOADER" }
  | { type: "ENTER_ACK_ONLY" }
  | { type: "ACK_SOLO_ELAPSED" }
  | { type: "REVEAL_FULL" }
  | { type: "TOGGLE_WHY" }
  | { type: "TOGGLE_OBS" };

function reducer(state: MachineState, event: Event): MachineState {
  switch (event.type) {
    case "SUBMIT":
      return { ...state, phase: "submitting", error: undefined, feedback: undefined, whyExpanded: false, obsExpanded: false };

    case "ENTER_LOADER":
      return { ...state, phase: "thinking_loader" };

    case "MODEL_RESOLVED":
      // do not jump straight to full; we stage it
      return { ...state, feedback: event.payload, error: undefined };

    case "MODEL_FAILED":
      return { ...state, error: event.error };

    case "ENTER_ACK_ONLY":
      return { ...state, phase: "ack_only" };

    case "ACK_SOLO_ELAPSED":
      return { ...state, phase: "focus_revealed" };

    case "REVEAL_FULL":
      return { ...state, phase: "full_feedback_ready" };

    case "TOGGLE_WHY":
      return { ...state, whyExpanded: !state.whyExpanded };

    case "TOGGLE_OBS":
      return { ...state, obsExpanded: !state.obsExpanded };

    default:
      return state;
  }
}

// -----------------------------
// API abstraction you will implement
// -----------------------------
async function fetchModelFeedback(_input: any): Promise<FeedbackPayload> {
  // TODO: call your backend. Must return strict JSON matching FeedbackPayload.
  // This is intentionally left blank.
  throw new Error("Not implemented");
}

// -----------------------------
// The main screen component
// -----------------------------
type ReviewScreenProps = {
  ctx: ReviewContext;
  raw: RawFacts;
  derived: DerivedMetrics;
  questionText: string;
  userAnswerText: string; // transcript for voice, text for text
  onPrimaryAction: (actionType: FeedbackPayload["nextAction"]["actionType"]) => void;
};

export function ReviewScreen(props: ReviewScreenProps) {
  const { ctx, raw, derived, questionText, userAnswerText } = props;

  const initial: MachineState = useMemo(
    () => ({ phase: "idle", whyExpanded: false, obsExpanded: false }),
    []
  );

  const [state, dispatch] = useReducer(reducer, initial);

  // Keep refs to avoid stale closures for timers
  const timersRef = useRef<number[]>([]);
  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  // Compute submission-level derived controls at submit time
  const computeSubmissionParams = () => {
    const signalQuality = computeSignalQuality(derived);
    const confidence = raw.selfReportedConfidence ?? "medium";
    const tier = computeEscalationTier(ctx, signalQuality, confidence);
    const focusDim = choosePrimaryFocusDimension(raw, tier);

    // "Why allowed" is UI/runtime gating, not model whim
    const whyAllowed =
      (ctx.surface === "recruiter_prep" && tier >= 1) ||
      (ctx.surface === "rangamworks" && tier >= 1); // still collapsed by default; Tier 0 false

    return { signalQuality, confidence, tier, focusDim, whyAllowed };
  };

  // Orchestrate the staged reveal on SUBMIT
  const submit = async () => {
    clearTimers();
    dispatch({ type: "SUBMIT" });

    // Enter loader immediately
    dispatch({ type: "ENTER_LOADER" });

    const computed = computeSubmissionParams();
    // stash in state via a direct mutation-like set pattern:
    // since reducer is pure, we can just merge it by dispatching a resolved feedback later
    // but we also need it for the model call; keep local here.
    const { signalQuality, confidence, tier, focusDim, whyAllowed } = computed;

    const loaderStart = Date.now();

    // Fire model request in parallel
    const modelPromise = (async () => {
      try {
        const payload = await fetchModelFeedback({
          surface: ctx.surface,
          modality: raw.modality,
          tier,
          signalQuality,
          userConfidence: confidence,
          whyAllowed,
          focusDimension: focusDim,
          questionText,
          userAnswerText,
          observableMarkers: {
            outcomeStatementDetected: raw.outcomeStatementDetected,
            starDetected: raw.starDetected,
            concreteExampleMarkersCount: raw.concreteExampleMarkersCount,
            reflectionMarkersDetected: raw.reflectionMarkersDetected,
          },
          voiceMarkers: raw.modality === "voice" ? raw.voice : undefined,
        });
        dispatch({ type: "MODEL_RESOLVED", payload });
        return payload;
      } catch (e: any) {
        dispatch({
          type: "MODEL_FAILED",
          error: { kind: "unknown", message: e?.message ?? "Unknown error" },
        });
        return null;
      }
    })();

    // Ensure loader min time (trust ritual)
    const minWait = new Promise<void>((res) => {
      const t = window.setTimeout(res, TIMING.loaderMinMs);
      timersRef.current.push(t);
    });

    // Enforce loader max time; if exceeded, fallback
    const maxWait = new Promise<null>((res) => {
      const t = window.setTimeout(() => res(null), TIMING.loaderMaxMs);
      timersRef.current.push(t);
    });

    const result = await Promise.race([
      (async () => {
        await minWait;
        return await modelPromise;
      })(),
      maxWait,
    ]);

    // Determine final feedback payload (model or fallback)
    let feedback: FeedbackPayload;
    if (result) {
      feedback = result;
    } else {
      feedback = buildDeterministicFallbackFeedback(raw.modality, focusDim, tier, signalQuality, confidence);
      dispatch({ type: "MODEL_RESOLVED", payload: feedback });
    }

    // Transition: loader -> ack only
    dispatch({ type: "ENTER_ACK_ONLY" });

    // Hold acknowledgement alone briefly (coach nod)
    const tAck = window.setTimeout(() => dispatch({ type: "ACK_SOLO_ELAPSED" }), TIMING.ackSoloHoldMs);
    timersRef.current.push(tAck);

    // Reveal full right after focus (no extra delay needed; could add 100ms if you want)
    const tFull = window.setTimeout(() => dispatch({ type: "REVEAL_FULL" }), TIMING.ackSoloHoldMs + 50);
    timersRef.current.push(tFull);

    // Optional: auto-expand "Why" only in specific conditions
    // NOTE: do NOT auto-expand on mobile in RangamWorks
    // If you want that behavior, implement it in render logic using feedback.meta + ctx.
  };

  // Cleanup timers on unmount
  useEffect(() => clearTimers, []);

  const f = state.feedback;
  const showLoader = state.phase === "thinking_loader";
  const showAck = Boolean(f) && ["ack_only", "focus_revealed", "full_feedback_ready"].includes(state.phase);
  const showFocus = Boolean(f) && ["focus_revealed", "full_feedback_ready"].includes(state.phase);
  const showFull = Boolean(f) && state.phase === "full_feedback_ready";

  // Default expansion rules (derive from ctx + tier)
  const autoExpandWhy =
    showFull &&
    Boolean(f?.whyThisMatters) &&
    ctx.surface === "recruiter_prep" &&
    !ctx.isMobile &&
    (f?.meta.tier ?? 0) >= 2;

  const whyExpanded = autoExpandWhy ? true : state.whyExpanded;

  return (
    <div className="review-screen">
      <AnswerReadonlyPanel
        questionText={questionText}
        answerText={userAnswerText}
        modality={raw.modality}
      />

      <div className="feedback-region">
        <ThinkingLoader visible={showLoader} />

        {showAck && f && <AckText text={f.ack} />}

        {showFocus && f && (
          <PrimaryFocusBlock headline={f.primaryFocus.headline} body={f.primaryFocus.body} />
        )}

        {showFull && f?.whyThisMatters && (
          <Collapsible
            title="Why this helps"
            expanded={whyExpanded}
            onToggle={() => dispatch({ type: "TOGGLE_WHY" })}
          >
            <WhyThisMattersText text={f.whyThisMatters} />
          </Collapsible>
        )}

        {showFull && (f?.observations?.length ?? 0) > 0 && (
          <Collapsible
            title="What I noticed"
            expanded={state.obsExpanded}
            onToggle={() => dispatch({ type: "TOGGLE_OBS" })}
          >
            <ObservationsList items={f.observations ?? []} />
          </Collapsible>
        )}

        {showFull && f && (
          <>
            <PrimaryActionButton
              label={f.nextAction.label}
              onClick={() => props.onPrimaryAction(f.nextAction.actionType)}
            />
            <SecondaryTextLink
              label="Stop for now"
              onClick={() => props.onPrimaryAction("stop_for_now")}
            />
          </>
        )}

        {/* Dev-only debug (never ship) */}
        {/* <pre>{JSON.stringify(state, null, 2)}</pre> */}
      </div>

      {/* Demo trigger */}
      {state.phase === "idle" && (
        <div style={{ marginTop: 12 }}>
          <PrimaryActionButton label="Submit answer" onClick={submit} />
        </div>
      )}
    </div>
  );
}

// -----------------------------
// UI components (minimal stubs)
// Replace with your design system components
// -----------------------------
function AnswerReadonlyPanel(props: { questionText: string; answerText: string; modality: Modality }) {
  return (
    <div className="answer-readonly">
      <div className="question">{props.questionText}</div>
      <div className="answer">
        {props.modality === "voice" ? (
          <>
            <div className="label">Your answer (transcript)</div>
            <div className="transcript">{props.answerText}</div>
            {/* Optional: replay audio button lives elsewhere; do not auto-play */}
          </>
        ) : (
          <>
            <div className="label">Your answer</div>
            <div className="text">{props.answerText}</div>
          </>
        )}
      </div>
    </div>
  );
}

function ThinkingLoader(props: { visible: boolean }) {
  if (!props.visible) return null;
  // “Thinking” loader: 2 subtle skeleton lines near feedback insertion point
  return (
    <div className="thinking-loader" role="status" aria-label="Preparing feedback">
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  );
}

function AckText(props: { text: string }) {
  return <div className="ack-text">{props.text}</div>;
}

function PrimaryFocusBlock(props: { headline: string; body: string }) {
  return (
    <div className="primary-focus">
      <div className="headline">{props.headline}</div>
      <div className="body">{props.body}</div>
    </div>
  );
}

function WhyThisMattersText(props: { text: string }) {
  return <div className="why-text">{props.text}</div>;
}

function ObservationsList(props: { items: string[] }) {
  return (
    <ul className="observations">
      {props.items.map((it, idx) => (
        <li key={idx}>{it}</li>
      ))}
    </ul>
  );
}

function Collapsible(props: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="collapsible">
      <button type="button" className="collapsible-trigger" onClick={props.onToggle}>
        {props.title} <span aria-hidden="true">{props.expanded ? "▾" : "▸"}</span>
      </button>
      {props.expanded ? <div className="collapsible-body">{props.children}</div> : null}
    </div>
  );
}

function PrimaryActionButton(props: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="primary-btn" onClick={props.onClick}>
      {props.label}
    </button>
  );
}

function SecondaryTextLink(props: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="secondary-link" onClick={props.onClick}>
      {props.label}
    </button>
  );
}