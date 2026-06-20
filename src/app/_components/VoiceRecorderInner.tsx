"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";
import { CardPreview } from "./CardPreview";
import { normalizeVoiceInput } from "./parseCardText";
import { useAudioRecorder } from "./useAudioRecorder";

type ActiveField = "title" | "description" | null;
type Language = "nb-NO" | "nn-NO" | "en-US";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "nb-NO", label: "Norsk", flag: "🇳🇴" },
  { code: "nn-NO", label: "Nynorsk", flag: "🇳🇴" },
  { code: "en-US", label: "English", flag: "🇬🇧" },
];

const LANGUAGE_STORAGE_KEY = "book-away:language";
const BOARD_STORAGE_KEY = "book-away:boardId";

export function VoiceRecorderInner() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(BOARD_STORAGE_KEY) ?? "";
  });

  const { data: boards = [] } = api.settings.getBoardEmails.useQuery();
  const { data: userLabels = [] } = api.settings.getLabels.useQuery();
  const { data: savedMembers = [] } = api.settings.getMembers.useQuery();

  // Auto-select first board if stored selection no longer exists or nothing is stored
  useEffect(() => {
    if (boards.length === 0) return;
    const stored = localStorage.getItem(BOARD_STORAGE_KEY) ?? "";
    const stillValid = boards.some((b) => b.id === stored);
    if (!stillValid) {
      const first = boards[0]!.id;
      setSelectedBoardId(first);
      localStorage.setItem(BOARD_STORAGE_KEY, first);
    }
  }, [boards]);

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
      toast.success("VoiceDraft sent! 🎉");
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
    if (!title.trim()) { toast.warning("Please add a title first."); return; }
    if (!selectedBoardId) { toast.warning("Please select a destination first."); return; }
    createCard.mutate({ boardEmailId: selectedBoardId, title: title.trim(), description: description.trim() || undefined });
  };

  const isRecording = recorderState === "recording";
  const isTranscribing = recorderState === "transcribing";
  const isBusy = isRecording || isTranscribing;

  return (
    <div className="flex flex-col gap-5">

      {/* Board selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-white/60">Send to</label>
        {boards.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/30">
            No destinations configured — <a href="/settings" className="text-[#7b96fa] underline underline-offset-2">go to Settings</a> to add one.
          </p>
        ) : (
          <>
            <select
              value={selectedBoardId}
              onChange={(e) => {
                setSelectedBoardId(e.target.value);
                localStorage.setItem(BOARD_STORAGE_KEY, e.target.value);
              }}
              disabled={isBusy}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30 transition-colors disabled:opacity-50"
            >
              <option value="" disabled className="bg-[#1a1f36]">— pick a destination —</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#1a1f36]">{b.nickname}</option>
              ))}
            </select>
          </>
        )}
      </div>

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
            <label className="text-xs font-medium text-white/60">Title</label>
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">
            Add label <span className="text-white/30">(tap to append to title)</span>
          </p>
        </div>
        {userLabels.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/35">
            No custom labels yet. Add labels in Settings to use quick label buttons.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {userLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => addLabel(label.name)}
                style={{ backgroundColor: label.color }}
                className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                {label.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Member input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">
            Add member <span className="text-white/30">(tap to append, or type below)</span>
          </p>
          {savedMembers.length === 0 && (
            <a href="/settings" className="text-xs text-[#7b96fa] hover:underline">
              Save members →
            </a>
          )}
        </div>

        {/* Saved member quick-tap buttons */}
        {savedMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  const token = `@${m.username}`;
                  setTitle((prev) => (prev.trim() ? `${prev.trim()} ${token}` : token));
                }}
                className="rounded-full border border-[#7b96fa]/30 bg-[#7b96fa]/10 px-3 py-1 text-xs font-semibold text-[#7b96fa] hover:bg-[#7b96fa]/20 active:scale-95 transition-all"
              >
                @{m.displayName ?? m.username}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description field */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-white/60">
              Description <span className="text-white/30">(optional)</span>
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
          {createCard.isPending ? "Sending…" : "Send VoiceDraft"}
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

