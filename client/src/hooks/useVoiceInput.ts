import { useState, useEffect, useRef, useCallback } from "react";

interface UseVoiceInputReturn {
  transcript: string;
  listening: boolean;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(onResult?: (text: string) => void): UseVoiceInputReturn {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Supports English (India) and Hindi phrases

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (onResult) {
          onResult(currentTranscript);
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSupported(false);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listening) {
      try {
        setTranscript("");
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
      }
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      try {
        recognitionRef.current.stop();
        setListening(false);
      } catch (e) {
        console.warn("Could not stop speech recognition:", e);
      }
    }
  }, [listening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    listening,
    supported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
