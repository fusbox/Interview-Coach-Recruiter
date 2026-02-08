import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioVisualizer = () => {
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Initialize AudioContext lazily
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
        return audioContextRef.current;
    }, []);

    const startVisualizer = useCallback(async (stream: MediaStream) => {
        const ctx = initAudioContext();

        // Resume if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        // Create analyser
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Create source
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        setMediaStream(stream);
    }, [initAudioContext]);

    const stopVisualizer = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        setMediaStream(null);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        mediaStream,
        analyser: analyserRef.current,
        startVisualizer,
        stopVisualizer
    };
};
