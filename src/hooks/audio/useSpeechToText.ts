import { useState, useEffect, useCallback, useRef } from 'react';

// Basic type definitions for Web Speech API
interface SpeechRecognitionEvent {
    results: {
        length: number;
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
        };
    };
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

// Minimal window extension
interface WindowWithSpeech extends Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
}

export const useSpeechToText = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check for browser support
        const SpeechRecognition =
            (window as unknown as WindowWithSpeech).SpeechRecognition ||
            (window as unknown as WindowWithSpeech).webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                if (event.error === 'no-speech') {
                    // Ignore no-speech errors usually
                    return;
                }
                console.error('Speech recognition error:', event.error);
                // Don't show "aborted" as an error to the user
                if (event.error !== 'aborted') {
                    setError(`Speech recognition error: ${event.error}`);
                }

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsListening(false);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn('Browser does not support speech recognition');
            setError('Browser does not support speech recognition');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Speech recognition not supported');
            return;
        }

        setError(null);
        setTranscript('');

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            // It might throw if already started
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        isSupported: !!recognitionRef.current
    };
};
