
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [error, setError] = useState(null);
    const [inputVolume, setInputVolume] = useState(0);

    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const synthesisRef = useRef(null);
    const [voices, setVoices] = useState([]);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);

    // Get Audio Devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const devs = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devs.filter(d => d.kind === 'audioinput');
                setDevices(audioInputs);
                if (audioInputs.length > 0) {
                    setSelectedDeviceId(audioInputs[0].deviceId);
                }
            } catch (e) {
                setError("Microphone permission denied");
            }
        };
        getDevices();
    }, []);

    // Setup Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    console.log("Speech recognition started");
                    setIsListening(true);
                    setError(null);
                };

                recognition.onend = () => {
                    console.log("Speech recognition ended");
                    if (isListeningRef.current) {
                        try { recognition.start(); } catch (e) { }
                    } else {
                        setIsListening(false);
                    }
                };

                recognition.onerror = (event) => {
                    console.error("Speech Error:", event.error);
                    if (event.error === 'not-allowed') {
                        setError("Microphone access denied");
                        isListeningRef.current = false;
                        setIsListening(false);
                    } else if (event.error === 'network') {
                        setError("Network error - check your internet connection");
                    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        setError(`Error: ${event.error}`);
                    }
                };

                recognition.onresult = (event) => {
                    let text = '';
                    for (let i = 0; i < event.results.length; i++) {
                        text += event.results[i][0].transcript;
                    }
                    setTranscript(text);
                };

                recognitionRef.current = recognition;
            } else {
                setError("Browser does not support Speech Recognition");
            }
        }
    }, []);

    const startVisualization = async () => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
            });
            streamRef.current = stream;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const update = () => {
                if (!isListeningRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setInputVolume(Math.min(100, Math.round((avg / 255) * 200)));
                animationRef.current = requestAnimationFrame(update);
            };
            update();
        } catch (e) { }
    };

    const stopVisualization = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        setInputVolume(0);
    };

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript('');
            setError(null);
            isListeningRef.current = true;
            try {
                recognitionRef.current.start();
                startVisualization();
            } catch (e) {
                console.error("Start error:", e);
            }
        }
    }, [selectedDeviceId]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        if (recognitionRef.current) recognitionRef.current.stop();
        stopVisualization();
        setIsListening(false);
    }, []);

    // Reliable voice loading
    useEffect(() => {
        const loadVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            if (vs.length > 0) {
                setVoices(vs);
            }
        };

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = useCallback((text, onEnd) => {
        if (!window.speechSynthesis) return;

        // Cancel previous speech to prevent queue buildup
        window.speechSynthesis.cancel();

        if (isListeningRef.current) stopListening();

        const utterance = new SpeechSynthesisUtterance(text);
        setIsSpeaking(true);

        // Robust Voice Selection
        let voice = null;
        if (voices.length > 0) {
            // Priority 1: Google US English
            voice = voices.find(v => v.name.includes('Google US English'));
            // Priority 2: Any US English
            if (!voice) voice = voices.find(v => v.lang === 'en-US');
            // Priority 3: Any English
            if (!voice) voice = voices.find(v => v.lang.startsWith('en'));
            // Fallback: First available
            if (!voice) voice = voices[0];

            if (voice) utterance.voice = voice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [voices, stopListening]);

    return {
        isListening,
        isSpeaking,
        transcript,
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        startListening,
        stopListening,
        speak,
        error,
        inputVolume,
        isModelLoading: false,
        hasSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
};
