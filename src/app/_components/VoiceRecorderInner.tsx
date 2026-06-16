"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { api } from "~/trpc/react";
import { CardPreview } from "./CardPreview";
import { normalizeVoiceInput, LABEL_COLOR_OPTIONS, getLabelColor } from "./parseCardText";

type ActiveField = "title" | "description" | null;

export function VoiceRecorderInner() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition, isMicrophoneAvailable } =
    useSpeechRecognition();

  // Route + normalize transcript into the active field
  useEffect(() => {
    if (!transcript) return;
    const normalized = normalizeVoiceInput(transcript);
    if (activeField === "title") setTitle(normalized);
    if (activeField === "description") setDescription(normalized);
  }, [transcript, activeField]);

  const createCard = api.trello.createCard.useMutation({
    onSuccess: () => {
      toast.success("Trello card created!");
      setTitle(""); setDescription(""); setMemberInput("");
      resetTranscript(); setActiveField(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const startRecording = useCallback((field: ActiveField) => {
    if (listening) SpeechRecognition.stopListening();
    resetTranscript();
    setActiveField(field);
    if (field === "title") setTitle("");
    if (field === "description") setDescription("");
    void SpeechRecognition.startListening({ continuous: true, language: "en-US" });
  }, [listening, resetTranscript]);

  const stopRecording = useCallback(() => {
    SpeechRecognition.stopListening();
    setActiveField(null);
  }, []);

  // Append a #label token to the title
  const addLabel = (name: string) => {
    const token = `#${name}`;
    setTitle((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
  };

  // Append an @member token to the title
  const addMember = () => {
    const name = memberInput.trim().replace(/^@/, "");
    if (!name) return;
    const token = `@${name}`;
    setTitle((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
    setMemberInput("");
  };

  const handleSend = () => {
    if (!title.trim()) { toast.warning("Please add a card title first."); return; }
    createCard.mutate({ title: title.trim(), description: description.trim() || undefined });
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
        <p className="font-semibold text-yellow-400">Voice not supported</p>
        <p className="mt-1 text-sm text-white/60">Try Chrome on Android or Safari on iOS 14.5+. You can still type below.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!isMicrophoneAvailable && (
        <p className="text-center text-sm text-red-400">Microphone access denied — please allow mic permissions.</p>
      )}

      {/* Title field */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/60">Card Title</label>
          <MicButton isRecording={listening && activeField === "title"} disabled={!isMicrophoneAvailable} onStart={() => startRecording("title")} onStop={stopRecording} />
        </div>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={listening && activeField === "title"}
          rows={2}
          placeholder='e.g. "Buy milk" — use buttons below to add labels & members'
          className={["w-full resize-none rounded-xl border bg-white/5 p-3 text-sm text-white placeholder-white/25 outline-none transition-colors",
            listening && activeField === "title" ? "border-red-500/50 ring-1 ring-red-500/30" : "border-white/10 focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30"].join(" ")}
          maxLength={500}
        />
      </div>

      {/* ── Label picker ── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/50">Add label <span className="text-white/30">(tap to append to title)</span></p>
        <div className="flex flex-wrap gap-2">
          {LABEL_COLOR_OPTIONS.map(({ name, hex }) => (
            <button
              key={name}
              type="button"
              onClick={() => addLabel(name)}
              style={{ backgroundColor: hex }}
              className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all capitalize"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Member input ── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/50">Add member <span className="text-white/30">(type username then tap +)</span></p>
        <div className="flex gap-2">
          <input
            type="text"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            placeholder="username"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[#4f6ef7]/60 transition-colors"
          />
          <button
            type="button"
            onClick={addMember}
            disabled={!memberInput.trim()}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-40 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Description field */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/60">
            Description <span className="text-white/30">(card body — optional)</span>
          </label>
          <MicButton isRecording={listening && activeField === "description"} disabled={!isMicrophoneAvailable} onStart={() => startRecording("description")} onStop={stopRecording} />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={listening && activeField === "description"}
          rows={3}
          placeholder="Describe the card in more detail..."
          className={["w-full resize-none rounded-xl border bg-white/5 p-3 text-sm text-white placeholder-white/25 outline-none transition-colors",
            listening && activeField === "description" ? "border-red-500/50 ring-1 ring-red-500/30" : "border-white/10 focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30"].join(" ")}
          maxLength={2000}
        />
      </div>

      {/* Voice tips */}
      <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-xs text-white/40">
        <p className="mb-1 font-medium text-white/50">Voice tips — you can say:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <p><span className="text-[#7b96fa]">&ldquo;hashtag green&rdquo;</span> → #green</p>
          <p><span className="text-[#7b96fa]">&ldquo;label red&rdquo;</span> → #red</p>
          <p><span className="text-[#7b96fa]">&ldquo;assign john&rdquo;</span> → @john</p>
          <p><span className="text-[#7b96fa]">&ldquo;mention sarah&rdquo;</span> → @sarah</p>
        </div>
        <p className="mt-1 text-white/25">Or just tap a label colour / type a member above.</p>
      </div>

      {/* Live preview */}
      <CardPreview title={title} description={description} />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => { setTitle(""); setDescription(""); setMemberInput(""); resetTranscript(); setActiveField(null); }}
          disabled={(!title && !description) || listening}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:bg-white/5 disabled:opacity-40 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSend}
          disabled={!title.trim() || listening || createCard.isPending}
          className="flex-1 rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white hover:bg-[#3d5ce0] disabled:opacity-40 transition-colors"
        >
          {createCard.isPending ? "Sending..." : "Create Card"}
        </button>
      </div>
    </div>
  );
}

function MicButton({ isRecording, disabled, onStart, onStop }: { isRecording: boolean; disabled: boolean; onStart: () => void; onStop: () => void }) {
  return (
    <button
      type="button"
      onClick={isRecording ? onStop : onStart}
      disabled={disabled}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition-all active:scale-95",
        isRecording ? "bg-red-500 text-white shadow-md shadow-red-500/40" : "bg-white/10 text-white/60 hover:bg-white/20",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"].join(" ")}
    >
      {isRecording ? "⏹" : "🎙️"}
    </button>
  );
}
