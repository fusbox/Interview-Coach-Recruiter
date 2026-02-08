import { useState, useRef, useCallback, useEffect } from 'react';

export const useTextToSpeech = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
            console.error("Audio playback error");
            setIsPlaying(false);
            setIsLoading(false);
        };

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    const speak = useCallback(async (text: string) => {
        if (!text) return;

        // If already playing this text (checking via a simple latch would be better, but simplified for MVP)
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('TTS Failed');

            const data = await response.json();

            if (data.audioBase64) {
                const binaryString = atob(data.audioBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: data.mimeType });
                const url = URL.createObjectURL(blob);

                setAudioUrl(url);

                if (audioRef.current) {
                    audioRef.current.src = url;
                    await audioRef.current.play();
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error("TTS Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isPlaying]);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    }, []);

    return {
        speak,
        stop,
        isPlaying,
        isLoading
    };
};
