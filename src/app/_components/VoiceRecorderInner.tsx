"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";
import { CardPreview } from "./CardPreview";
import { normalizeVoiceInput, LABEL_COLOR_OPTIONS } from "./parseCardText";
import { useAudioRecorder } from "./useAudioRecorder";

type ActiveField = "title" | "description" | null;
type Language = "nb-NO" | "nn-NO" | "en-US";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "nb-NO", label: "Norsk", flag: "🇳🇴" },
  { code: "nn-NO", label: "Nynorsk", flag: "🇳🇴" },
  { code: "en-US", label: "English", flag: "🇬🇧" },
];

const LANGUAGE_STORAGE_KEY = "book-away:language";

export function VoiceRecorderInner() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "nb-NO";
    return (localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language) ?? "nb-NO";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const { data: workerConfig, isLoading: configLoading } =
    api.speech.getWorkerConfig.useQuery();

  const handleTranscript = useCallback(
    (text: string) => {
      const normalized = normalizeVoiceInput(text);
      if (activeField === "title")
        setTitle((prev) => (prev.trim() ? `${prev.trim()} ${normalized}` : normalized));
      if (activeField === "description")
        setDescription((prev) => (prev.trim() ? `${prev.trim()} ${normalized}` : normalized));
    },
    [activeField],
  );

  const handleError = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  const { state: recorderState, start, stop, reset } = useAudioRecorder({
    workerUrl: workerConfig?.workerUrl ?? "",
    apiKey: workerConfig?.apiKey ?? "",
    language,
    onTranscript: handleTranscript,
    onError: handleError,
  });

  const createCard = api.trello.createCard.useMutation({
    onSuccess: () => {
      toast.success("Trello card created! 🎉");
      setTitle(""); setDescription(""); setMemberInput("");
      setActiveField(null); reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const startRecording = useCallback((field: ActiveField) => {
    if (!workerConfig) { toast.error("Speech service not ready yet, please wait."); return; }
    setActiveField(field);
    void start();
  }, [workerConfig, start]);

  const addLabel = (name: string) => {
    const token = `#${name}`;
    setTitle((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
  };

  const addMember = () => {
    const name = memberInput.trim().replace(/^@/, "");
    if (!name) return;
    setTitle((prev) => {
      const token = `@${name}`;
      return prev.trim() ? `${prev.trim()} ${token}` : token;
    });
    setMemberInput("");
  };

  const handleSend = () => {
    if (!title.trim()) { toast.warning("Please add a card title first."); return; }
    createCard.mutate({ title: title.trim(), description: description.trim() || undefined });
  };

  const isRecording = recorderState === "recording";
  const isTranscribing = recorderState === "transcribing";
  const isBusy = isRecording || isTranscribing;

  return (
    <div className="flex flex-col gap-5">

      {/* Language selector */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs text-white/50">Language:</span>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              disabled={isBusy}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:cursor-not-allowed",
                language === code ? "bg-[#4f6ef7] text-white shadow-sm" : "text-white/50 hover:text-white/80",
              ].join(" ")}
            >
              {flag} {label}
            </button>
          ))}
        </div>
        {configLoading && <span className="animate-pulse text-xs text-white/30">Loading…</span>}
      </div>

      {/* Title field */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-white/60">Card Title</label>
            {title && (
              <button type="button" onClick={() => setTitle("")} className="text-xs text-white/30 hover:text-white/60 transition-colors">✕ clear</button>
            )}
          </div>
          <MicButton
            isRecording={isRecording && activeField === "title"}
            isTranscribing={isTranscribing && activeField === "title"}
            disabled={(isBusy && activeField !== "title") || !workerConfig}
            onStart={() => startRecording("title")}
            onStop={stop}
          />
        </div>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isRecording && activeField === "title"}
          rows={2}
          placeholder='e.g. "Kjøp melk" — use mic or type, add labels & members below'
          className={[
            "w-full resize-none rounded-xl border bg-white/5 p-3 text-sm text-white placeholder-white/25 outline-none transition-colors",
            isRecording && activeField === "title"
              ? "border-red-500/50 ring-1 ring-red-500/30"
              : isTranscribing && activeField === "title"
                ? "border-[#4f6ef7]/50 ring-1 ring-[#4f6ef7]/20"
                : "border-white/10 focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30",
          ].join(" ")}
          maxLength={500}
        />
        {isTranscribing && activeField === "title" && <TranscribingIndicator />}
      </div>

      {/* Label picker */}
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

      {/* Member input */}
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
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-white/60">
              Description <span className="text-white/30">(card body — optional)</span>
            </label>
            {description && (
              <button type="button" onClick={() => setDescription("")} className="text-xs text-white/30 hover:text-white/60 transition-colors">✕ clear</button>
            )}
          </div>
          <MicButton
            isRecording={isRecording && activeField === "description"}
            isTranscribing={isTranscribing && activeField === "description"}
            disabled={(isBusy && activeField !== "description") || !workerConfig}
            onStart={() => startRecording("description")}
            onStop={stop}
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isRecording && activeField === "description"}
          rows={3}
          placeholder="Beskriv kortet nærmere…"
          className={[
            "w-full resize-none rounded-xl border bg-white/5 p-3 text-sm text-white placeholder-white/25 outline-none transition-colors",
            isRecording && activeField === "description"
              ? "border-red-500/50 ring-1 ring-red-500/30"
              : isTranscribing && activeField === "description"
                ? "border-[#4f6ef7]/50 ring-1 ring-[#4f6ef7]/20"
                : "border-white/10 focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30",
          ].join(" ")}
          maxLength={2000}
        />
        {isTranscribing && activeField === "description" && <TranscribingIndicator />}
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
        <p className="mt-1 text-white/25">Powered by Google Speech-to-Text — Norwegian &amp; English.</p>
      </div>

      {/* Live preview */}
      <CardPreview title={title} description={description} />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => { setTitle(""); setDescription(""); setMemberInput(""); setActiveField(null); reset(); }}
          disabled={(!title && !description) || isBusy}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:bg-white/5 disabled:opacity-40 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSend}
          disabled={!title.trim() || isBusy || createCard.isPending}
          className="flex-1 rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white hover:bg-[#3d5ce0] disabled:opacity-40 transition-colors"
        >
          {createCard.isPending ? "Sending…" : "Create Card"}
        </button>
      </div>
    </div>
  );
}

function MicButton({
  isRecording, isTranscribing, disabled, onStart, onStop,
}: {
  isRecording: boolean;
  isTranscribing: boolean;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <button
      type="button"
      onClick={isRecording ? onStop : onStart}
      disabled={disabled || isTranscribing}
      aria-label={isTranscribing ? "Transcribing…" : isRecording ? "Stop recording" : "Start recording"}
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition-all active:scale-95",
        isRecording
          ? "animate-pulse bg-red-500 text-white shadow-md shadow-red-500/40"
          : isTranscribing
            ? "bg-[#4f6ef7]/60 text-white"
            : "bg-white/10 text-white/60 hover:bg-white/20",
        disabled || isTranscribing ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      {isTranscribing ? "⏳" : isRecording ? "⏹" : "🎙️"}
    </button>
  );
}

function TranscribingIndicator() {
  return (
    <p className="flex animate-pulse items-center gap-1.5 text-xs text-[#7b96fa]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7b96fa]" />
      Transcribing with Google Speech-to-Text…
    </p>
  );
}

