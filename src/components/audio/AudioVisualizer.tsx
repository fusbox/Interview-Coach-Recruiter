import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isRecording: boolean;
    className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const contextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!stream || !isRecording || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!contextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            contextRef.current = new AudioContextClass();
        }

        const audioContext = contextRef.current;

        // Ensure context is running (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // Reuse analyser if possible to avoid recreating nodes improperly
        if (!analyserRef.current) {
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
        }

        const analyser = analyserRef.current;

        // Connect source
        try {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            // Verify if we need to disconnect later? 
            // Usually fine for this component lifecycle as we close context on unmount
        } catch (e) {
            // Stream might be already connected or invalid
            console.warn("AudioVisualizer: Error connecting stream", e);
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording) return;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                // Color: Rangam Blue-ish
                const r = 55;
                const g = 100;
                const b = 151;

                // Dynamic opacity based on volume
                ctx.fillStyle = `rgba(${r},${g},${b}, ${0.5 + barHeight / 200})`;

                ctx.beginPath();
                // Rounded tops
                ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 5);
                ctx.fill();

                x += barWidth + 2;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            // We do NOT close the context here if we want to reuse it, 
            // but for this component which might be mounted/unmounted, closing is safer for cleanup
            if (contextRef.current && contextRef.current.state !== 'closed') {
                contextRef.current.close().then(() => {
                    contextRef.current = null;
                    analyserRef.current = null;
                });
            }
        };
    }, [stream, isRecording]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={100}
            className={className || 'w-full h-32 rounded-xl bg-transparent'}
        />
    );
};

export default AudioVisualizer;
