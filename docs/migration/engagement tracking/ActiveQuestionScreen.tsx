import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MessageSquare, Volume2, Loader2, ArrowRight } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { cn } from '../../lib/utils';
import AudioVisualizer from '../../components/AudioVisualizer';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTextAnswer } from '../../hooks/useTextAnswer';
import { useEngagementTracker } from '../../hooks/useEngagementTracker';
import { generateSpeech, analyzeAnswer } from '../../services/geminiService';
import { logAuditEvent } from '../../services/auditLogger';
import { Button } from '../../components/ui/button';
import { RecordingConfirmationModal } from '../../components/modals/RecordingConfirmationModal';

export function ActiveQuestionScreen() {
  const { session, now, saveAnswer, updateSession } = useSession();

  // Safely derive state for hooks (even if invalid)
  const isValidState = now && now.status === 'ACTIVE';
  const questionId = isValidState ? now.questionId : 'dummy-id';
  const questionText = isValidState ? now.question.text : '';
  const questionIndex = isValidState ? now.index : 0;
  const questionTotal = isValidState ? now.total : 0;

  // Local State
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [questionAudioUrl, setQuestionAudioUrl] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // Recording State
  const [showRecordingPopover, setShowRecordingPopover] = useState(false);
  const [pendingRecording, setPendingRecording] = useState<Blob | null>(null);

  // Audio Hooks - Unconditional
  const { isRecording, isInitializing, startRecording, stopRecording, mediaStream } =
    useAudioRecording();

  const {
    transcript: liveTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    textAnswer,
    setTextAnswer,
    isSubmitting: isTextSubmitting,
  } = useTextAnswer(questionId, session.id);

  // Engagement Tracker - Unconditional
  const tracker = useEngagementTracker({
    isEnabled: session.status !== 'COMPLETED',
    isContinuousActive: isRecording,
    onUpdate: (seconds) => {
      if (session.id) {
        updateSession(session.id, {
          engagedTimeSeconds: (session.engagedTimeSeconds || 0) + seconds,
        });
      }
    },
  });
  const { trackEvent } = tracker;

  // Audio Ref & Cache - Unconditional
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, string>>({});
  const activeObjectUrls = useRef<Set<string>>(new Set());

  // Initialize Audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingUrl(null);
      audioRef.current.onerror = () => setPlayingUrl(null);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      activeObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      activeObjectUrls.current.clear();
    };
  }, []);

  const trackUrl = useCallback((url: string) => {
    activeObjectUrls.current.add(url);
    return url;
  }, []);

  const togglePlayback = useCallback(
    async (url: string) => {
      if (!audioRef.current || !url) return;

      if (playingUrl === url && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlayingUrl(null);
      } else {
        if (!audioRef.current.paused) audioRef.current.pause();
        audioRef.current.src = url;
        try {
          await audioRef.current.play();
          setPlayingUrl(url);
        } catch (err) {
          console.error('Playback failed', err);
          setPlayingUrl(null);
        }
      }
    },
    [playingUrl]
  );

  // Auto-fetch Audio
  useEffect(() => {
    // Skip effect if strictly invalid state (or let it run with dummy id -> cache miss)
    if (!isValidState) return;

    let active = true;
    const fetchAudio = async () => {
      if (audioCache.current[questionId]) {
        setQuestionAudioUrl(audioCache.current[questionId]);
        return;
      }

      setIsAudioLoading(true);
      try {
        const url = await generateSpeech(questionText);
        if (active && url) {
          const tracked = trackUrl(url);
          audioCache.current[questionId] = tracked;
          setQuestionAudioUrl(tracked);
          if (audioRef.current) {
            togglePlayback(tracked);
          }
        }
      } catch (err) {
        console.error('TTS Failed', err);
      } finally {
        if (active) setIsAudioLoading(false);
      }
    };

    fetchAudio();
    return () => {
      active = false;
    };
  }, [questionId, questionText, trackUrl, togglePlayback, isValidState]); // Added dependencies

  // Handlers
  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      resetTranscript();
      startRecording();
      startListening();
      trackEvent('tier3', 'Recording Started');
    }
  };

  const handleStopRecording = async () => {
    stopListening();
    const blob = await stopRecording();
    if (blob) {
      setPendingRecording(blob);
      setShowRecordingPopover(true);
    }
  };

  const handleSubmitRecording = async () => {
    if (!pendingRecording || !isValidState) return;
    setShowRecordingPopover(false);

    const transcriptText = liveTranscript || '(Audio Response)';

    saveAnswer(questionId, {
      audioBlob: pendingRecording,
      text: transcriptText,
      analysis: null,
    });

    try {
      const result = await analyzeAnswer(
        questionText,
        pendingRecording,
        session.blueprint,
        questionId,
        session.intakeData
      );

      saveAnswer(questionId, {
        audioBlob: pendingRecording,
        text: result.transcript || transcriptText,
        analysis: result,
      });

      logAuditEvent('ANSWER_RECORDED', { questionId, type: 'audio' });
    } catch (err) {
      console.error('Analysis Error', err);
    }
  };

  const handleTextSubmit = async () => {
    if (!textAnswer.trim() || !isValidState) return;

    saveAnswer(questionId, {
      text: textAnswer,
      analysis: null,
    });

    try {
      const result = await analyzeAnswer(
        questionText,
        textAnswer,
        session.blueprint,
        questionId,
        session.intakeData
      );

      saveAnswer(questionId, {
        text: textAnswer,
        analysis: result,
      });
    } catch (err) {
      console.error('Text Analysis Error', err);
    }
  };

  // Render Logic - NOW we can guard the UI
  if (!isValidState || !now) return null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Question Card */}
      <div className="relative flex flex-col overflow-hidden min-w-0 border border-slate-200 border-t-white/50 border-b-[6px] border-b-slate-400 bg-slate-50/30 rounded-2xl transition-all shadow-sm flex-2">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/50 bg-transparent min-h-[40px]">
          <span className="text-sm font-bold text-rangam-navy uppercase tracking-wider">
            Question {questionIndex + 1} of {questionTotal}
          </span>
          <div className="flex items-center gap-3">
            {isAudioLoading ? (
              <span className="text-xs text-rangam-blue/50 animate-pulse">Generating Audio...</span>
            ) : questionAudioUrl ? (
              <button
                onClick={() => togglePlayback(questionAudioUrl)}
                className="flex items-center gap-2 text-xs text-rangam-blue hover:text-rangam-orange uppercase font-medium"
              >
                {playingUrl === questionAudioUrl ? (
                  'Stop'
                ) : (
                  <>
                    <Volume2 size={14} /> Read Question
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-y-auto p-6 md:p-10 text-center animate-fade-in-up">
          <p className="text-xl md:text-3xl font-medium text-rangam-navy leading-relaxed font-display">
            {questionText}
          </p>
        </div>
      </div>

      {/* Input Card */}
      <div className="relative flex flex-col min-w-0 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 bg-white">
        <div className="flex items-center justify-center px-4 py-3 bg-transparent">
          <div className="flex bg-slate-200/60 p-1 rounded-full border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setMode('voice')}
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
                mode === 'voice' ? 'bg-white text-rangam-blue shadow-sm' : 'text-slate-500'
              )}
            >
              <Mic size={12} /> Voice
            </button>
            <button
              onClick={() => setMode('text')}
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
                mode === 'text' ? 'bg-white text-rangam-blue shadow-sm' : 'text-slate-500'
              )}
            >
              <MessageSquare size={12} /> Text
            </button>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          {mode === 'voice' ? (
            <div className="h-full w-full relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
                {isRecording && (
                  <AudioVisualizer
                    stream={mediaStream}
                    isRecording={isRecording}
                    className="w-full h-full max-w-sm"
                  />
                )}
              </div>

              <div className="relative z-10 flex flex-col items-center gap-3">
                {!showRecordingPopover && (
                  <button
                    onClick={handleToggleRecording}
                    disabled={isInitializing}
                    className={cn(
                      'group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl',
                      isRecording
                        ? 'bg-red-50 text-red-500 border-2 border-red-200 scale-110'
                        : 'bg-rangam-blue/10 text-rangam-blue'
                    )}
                  >
                    {isInitializing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Mic size={32} className={cn(isRecording && 'animate-bounce')} />
                    )}
                  </button>
                )}
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  {isRecording ? 'Listening...' : 'Tap to Answer'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <textarea
                className="flex-1 w-full p-4 bg-slate-50/90 resize-none focus:outline-none"
                placeholder="Type answer..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
              />
              <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{textAnswer.length} chars</span>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim() || isTextSubmitting}
                  size="sm"
                >
                  {isTextSubmitting ? 'Sending...' : 'Submit'}{' '}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <RecordingConfirmationModal
        isOpen={showRecordingPopover}
        onConfirm={handleSubmitRecording}
        onRetry={() => {
          setShowRecordingPopover(false);
          setPendingRecording(null);
          resetTranscript();
        }}
      />
    </div>
  );
}
