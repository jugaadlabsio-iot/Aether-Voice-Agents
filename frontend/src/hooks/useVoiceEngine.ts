import { useState, useRef, useCallback } from 'react';

export function useVoiceEngine() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startCall = useCallback(async (systemPrompt = "") => {
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ws = new WebSocket('ws://localhost:3001/stream');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsActive(true);
        ws.send(JSON.stringify({ event: 'start', systemPrompt }));

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // Capture audio every 250ms for low latency
        mediaRecorder.start(250);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'media' && data.media?.payload) {
            // Server sends base64 mulaw audio or PCM audio. 
            // In a real app, you would decode the base64 and play it through Web Audio API.
            // For MVP, we will play the base64 payload as a data URI if the server returns mp3/wav,
            // or decode the raw PCM. Sarvam returns WAV base64 data.
            
            const audioSrc = `data:audio/wav;base64,${data.media.payload}`;
            const audio = new Audio(audioSrc);
            await audio.play();
          } else if (data.event === 'mock-text' && data.text) {
            const utterance = new SpeechSynthesisUtterance(data.text);
            window.speechSynthesis.speak(utterance);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        endCall();
      };

      ws.onclose = () => {
        console.log('WebSocket closed cleanly');
        endCall();
      };

    } catch (err) {
      console.error('Microphone access denied or error:', err);
      setIsConnecting(false);
    }
  }, []);

  const endCall = useCallback(() => {
    setIsActive(false);
    setIsConnecting(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return { isConnecting, isActive, startCall, endCall };
}
