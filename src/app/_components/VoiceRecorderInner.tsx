"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { api } from "~/trpc/react";
export function VoiceRecorderInner() {
  const [cardText, setCardText] = useState("");
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();
  useEffect(() => {
    if (transcript) setCardText(transcript);
  }, [transcript]);
  const createCard = api.trello.createCard.useMutation({
    onSuccess: () => {
      toast.success("Trello card created!");
      setCardText("");
      resetTranscript();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const toggleListening = useCallback(() => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setCardText("");
      void SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  }, [listening, resetTranscript]);
  const handleSend = () => {
    if (!cardText.trim()) {
      toast.warning("Please speak or type a card idea first.");
      return;
    }
    createCard.mutate({ text: cardText.trim() });
  };
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
        <p className="font-semibold text-yellow-400">Voice not supported</p>
        <p className="mt-1 text-sm text-white/60">
          Try Chrome on Android or Safari on iOS 14.5+.
          You can still type your card idea below.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="h-6 flex items-center">
        {listening ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            Listening
          </span>
        ) : (
          <span className="text-xs text-white/40">Tap mic to start</span>
        )}
      </div>
      <div className="relative">
        <button
          onClick={toggleListening}
          disabled={!isMicrophoneAvailable}
          aria-label={listening ? "Stop recording" : "Start recording"}
          className={[
            "relative flex h-32 w-32 items-center justify-center rounded-full",
            "text-5xl shadow-lg transition-all duration-200 active:scale-95 select-none",
            listening ? "bg-red-500 shadow-red-500/40" : "bg-[#4f6ef7] shadow-[#4f6ef7]/30",
            !isMicrophoneAvailable ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-90",
          ].join(" ")}
        >
          {listening ? "stop" : "mic"}
        </button>
        {listening && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-red-500 opacity-20" />
        )}
      </div>
      {!isMicrophoneAvailable && (
        <p className="text-sm text-red-400">Microphone access denied — please allow mic permissions.</p>
      )}
      <div className="w-full">
        <textarea
          value={cardText}
          onChange={(e) => setCardText(e.target.value)}
          disabled={listening}
          rows={4}
          placeholder="Your spoken text will appear here, or type manually..."
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30 disabled:opacity-50 transition-colors"
          maxLength={500}
        />
        <p className="mt-1 text-right text-xs text-white/30">{cardText.length}/500</p>
      </div>
      <div className="flex w-full gap-3">
        <button
          onClick={() => { setCardText(""); resetTranscript(); }}
          disabled={!cardText || listening}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:bg-white/5 disabled:opacity-40 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSend}
          disabled={!cardText.trim() || listening || createCard.isPending}
          className="flex-1 rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white hover:bg-[#3d5ce0] disabled:opacity-40 transition-colors"
        >
          {createCard.isPending ? "Sending..." : "Create Card"}
        </button>
      </div>
    </div>
  );
}
