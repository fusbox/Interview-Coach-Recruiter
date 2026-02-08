import { useState, useRef, useCallback } from 'react';

export const useAudioRecording = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [permissionError, setPermissionError] = useState<boolean>(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        setIsInitializing(true);
        setPermissionError(false);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);

                // Cleanup stream tracks
                stream.getTracks().forEach((track) => track.stop());
                setMediaStream(null);
            };

            mediaRecorder.start();
            setIsRecording(true);
            return stream; // Return stream for visualizer
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setPermissionError(true);
            setIsRecording(false);
            return null;
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(blob);

                    if (mediaStream) {
                        mediaStream.getTracks().forEach((track) => track.stop());
                        setMediaStream(null);
                    }

                    setIsRecording(false);
                    resolve(blob);
                };
                mediaRecorderRef.current.stop();
            } else {
                // Safe fallback
                setIsRecording(false);
                resolve(null);
            }
        });
    }, [mediaStream]);

    return {
        isRecording,
        isInitializing,
        audioBlob,
        startRecording,
        stopRecording,
        mediaStream,
        permissionError,
    };
};
