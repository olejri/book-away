"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

// ── Fasting phases ─────────────────────────────────────────────────────────────

const PHASES = [
  {
    id: 0,
    minHours: 0,
    maxHours: 4,
    name: "Fed State",
    emoji: "🍽️",
    color: "#94a3b8",
    badge: "0 – 4 h",
    summary:
      "Your body is still burning circulating blood glucose from your last meal. Insulin is active and fat burning is minimal.",
    bullets: [
      "Blood sugar is still elevated",
      "Insulin shuttling glucose to cells",
      "Fat oxidation is minimal",
      "Energy levels feel normal",
    ],
    tip: "Start with water, black coffee, or plain tea. No calories.",
  },
  {
    id: 1,
    minHours: 4,
    maxHours: 12,
    name: "Glycogen Depletion",
    emoji: "🔋",
    color: "#f59e0b",
    badge: "4 – 12 h",
    summary:
      "Circulating glucose is exhausted. Your liver is tapping into its stored glycogen. Hunger pangs begin to intensify.",
    bullets: [
      "Liver glycogen being rapidly used",
      "Blood sugar dropping",
      "Strong hunger and cravings",
      "Glucagon begins to rise",
    ],
    tip: "This is the hardest stretch. Electrolytes (sodium, potassium, magnesium) help significantly.",
  },
  {
    id: 2,
    minHours: 12,
    maxHours: 18,
    name: "Early Ketosis",
    emoji: "🔥",
    color: "#f97316",
    badge: "12 – 18 h",
    summary:
      "Glycogen reserves are nearly gone. Your liver begins converting fatty acids to ketones. Fat burning is accelerating.",
    bullets: [
      "Ketone production begins",
      "Fat is now the primary fuel",
      "Hunger often starts to subside",
      "Mental clarity may sharpen",
    ],
    tip: "You're past the hardest part! Many people find hunger surprisingly manageable now.",
  },
  {
    id: 3,
    minHours: 18,
    maxHours: 24,
    name: "Ketosis",
    emoji: "⚡",
    color: "#eab308",
    badge: "18 – 24 h",
    summary:
      "Your brain and body are running on ketones. Insulin is at its lowest. Fat burning is in full swing.",
    bullets: [
      "Measurably elevated ketone levels",
      "Insulin near its lowest point",
      "'Keto flu' possible (headache, fatigue)",
      "Growth hormone starting to rise",
    ],
    tip: "Mild headaches are normal — salt water or electrolyte drinks help significantly.",
  },
  {
    id: 4,
    minHours: 24,
    maxHours: 48,
    name: "Deep Ketosis + Autophagy",
    emoji: "🧬",
    color: "#22c55e",
    badge: "24 – 48 h",
    summary:
      "Autophagy is now active — your cells are breaking down and recycling damaged proteins and organelles. This is where powerful metabolic healing begins.",
    bullets: [
      "Autophagy (cellular cleanup) kicks in strongly",
      "Growth hormone surges significantly",
      "Hunger often disappears completely",
      "Immune system begins regeneration",
    ],
    tip: "Most people feel surprisingly good and clear-headed here. Energy is steady.",
  },
  {
    id: 5,
    minHours: 48,
    maxHours: 72,
    name: "Peak Autophagy",
    emoji: "🛡️",
    color: "#6366f1",
    badge: "48 – 72 h",
    summary:
      "Autophagy and ketosis are both at their peak. Your body is focused on deep cellular repair and immune regeneration.",
    bullets: [
      "Maximum autophagy — damaged proteins cleared",
      "White blood cell production increases",
      "Systemic inflammation decreases",
      "BDNF (brain growth factor) elevated — better focus",
    ],
    tip: "Plan your refeeding carefully. Start with bone broth or light soups before solid meals.",
  },
  {
    id: 6,
    minHours: 72,
    maxHours: Infinity,
    name: "Metabolic Reset",
    emoji: "✨",
    color: "#a855f7",
    badge: "72 h+",
    summary:
      "You have entered extended fasting territory. Profound metabolic, immune, and neurological changes are occurring.",
    bullets: [
      "Deep immune system regeneration",
      "Stem cell activation reported in studies",
      "Profound insulin sensitivity improvements",
      "BDNF and cognitive benefits at maximum",
    ],
    tip: "Break extended fasts very gently — small amounts of easily digestible food first.",
  },
];

// ── Utilities ──────────────────────────────────────────────────────────────────

function getPhase(hoursElapsed: number) {
  return (
    PHASES.find((p) => hoursElapsed >= p.minHours && hoursElapsed < p.maxHours) ??
    PHASES[PHASES.length - 1]!
  );
}

function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatHoursVerbose(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m} minute${m !== 1 ? "s" : ""}`;
  if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h} hour${h !== 1 ? "s" : ""} and ${m} minute${m !== 1 ? "s" : ""}`;
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDatetimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const PRESET_GOALS = [12, 16, 18, 24, 36, 48, 72];

// ── Component ──────────────────────────────────────────────────────────────────

export function FastingTrackerInner() {
  const [elapsed, setElapsed] = useState(0);

  // Start-fast form state
  const [goalHours, setGoalHours] = useState(16);
  const [customGoal, setCustomGoal] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [startDateTime, setStartDateTime] = useState("");

  // UI toggles
  const [showPhaseDetails, setShowPhaseDetails] = useState(false);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    setStartDateTime(toLocalDatetimeInputValue(now));
  }, []);

  // ── tRPC ────────────────────────────────────────────────────────────────
  const utils = api.useUtils();

  const { data: activeFast, isLoading: fastLoading } =
    api.fasting.getActiveFast.useQuery(undefined, {
      refetchInterval: 30_000,
    });

  const { data: history = [], isLoading: historyLoading } =
    api.fasting.getHistory.useQuery({ limit: 30 });

  const startMutation = api.fasting.startFast.useMutation({
    onSuccess: async () => {
      await utils.fasting.getActiveFast.invalidate();
    },
  });

  const endMutation = api.fasting.endFast.useMutation({
    onSuccess: async () => {
      await utils.fasting.getActiveFast.invalidate();
      await utils.fasting.getHistory.invalidate();
    },
  });

  // ── Live clock — ticks every second, driven by DB startedAt ─────────────
  useEffect(() => {
    if (!activeFast?.startedAt) {
      setElapsed(0);
      return;
    }
    const startMs = activeFast.startedAt.getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeFast?.startedAt]);

  // ── Actions ──────────────────────────────────────────────────────────────
  function startFast() {
    const startAt = useCustomTime
      ? new Date(startDateTime).toISOString()
      : new Date().toISOString();
    const effective = customGoal ? parseInt(customGoal, 10) : goalHours;
    if (!effective || isNaN(effective) || effective < 1) return;
    startMutation.mutate({ startedAt: startAt, goalHours: effective });
  }

  function endFast() {
    if (!activeFast?.id) return;
    endMutation.mutate({ id: activeFast.id });
    setConfirmEnd(false);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (fastLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const hoursElapsed = elapsed / 3600;
  const phase = activeFast ? getPhase(hoursElapsed) : null;
  const effectiveGoal = customGoal ? parseInt(customGoal, 10) : goalHours;
  const progress = activeFast
    ? Math.min(100, (hoursElapsed / activeFast.goalHours) * 100)
    : 0;
  const goalReached = activeFast && hoursElapsed >= activeFast.goalHours;
  const goalEndTime = activeFast
    ? new Date(activeFast.startedAt.getTime() + activeFast.goalHours * 3_600_000)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* ── ACTIVE FAST ───────────────────────────────────────────────────── */}
      {activeFast && phase ? (
        <>
          {/* Timer card */}
          <div
            className="rounded-xl border bg-white/5 p-6"
            style={{ borderColor: `${phase.color}40` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-white/40">
                Fasting in progress
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: `${phase.color}25`, color: phase.color }}
              >
                {phase.emoji} {phase.name}
              </span>
            </div>

            {/* Live clock */}
            <div
              className="my-4 text-center font-mono text-6xl font-bold tabular-nums tracking-tight"
              style={{
                color: phase.color,
                textShadow: `0 0 40px ${phase.color}60`,
              }}
            >
              {formatClock(elapsed)}
            </div>

            <p className="mb-4 text-center text-sm text-white/60">
              You have fasted for{" "}
              <span className="font-semibold text-white">
                {formatHoursVerbose(elapsed)}
              </span>
            </p>

            {/* Progress bar */}
            <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${phase.color}80, ${phase.color})`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>0h</span>
              {goalReached ? (
                <span className="font-semibold" style={{ color: phase.color }}>
                  🎉 Goal reached!
                </span>
              ) : (
                <span>
                  Goal: {activeFast.goalHours}h — ends{" "}
                  {goalEndTime?.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  on{" "}
                  {goalEndTime?.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              <span>{activeFast.goalHours}h</span>
            </div>

            <p className="mt-3 text-center text-xs text-white/30">
              Started {formatDateTime(activeFast.startedAt)}
            </p>

            {/* End fast controls */}
            <div className="mt-5 flex justify-center gap-3">
              {confirmEnd ? (
                <>
                  <button
                    onClick={endFast}
                    disabled={endMutation.isPending}
                    className="rounded-lg bg-red-500/80 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {endMutation.isPending ? "Ending…" : "Yes, end fast"}
                  </button>
                  <button
                    onClick={() => setConfirmEnd(false)}
                    className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white/70 transition hover:text-white"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white/70 transition hover:border-red-400/50 hover:text-red-400"
                >
                  End Fast
                </button>
              )}
            </div>
          </div>

          {/* Current phase card */}
          <div
            className="rounded-xl border bg-white/5 p-5"
            style={{ borderColor: `${phase.color}40` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{phase.emoji}</span>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: phase.color }}
                >
                  Phase {phase.id + 1} · {phase.badge}
                </p>
                <h3 className="text-base font-bold">{phase.name}</h3>
              </div>
            </div>
            <p className="mb-3 text-sm text-white/70">{phase.summary}</p>

            <button
              onClick={() => setShowPhaseDetails((v) => !v)}
              className="mb-3 text-xs text-white/40 transition hover:text-white/70"
            >
              {showPhaseDetails ? "▲ Hide details" : "▼ Show details"}
            </button>

            {showPhaseDetails && (
              <ul className="mb-3 space-y-1.5">
                {phase.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span style={{ color: phase.color }}>•</span>
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <div
              className="rounded-lg px-4 py-3 text-sm text-white/80"
              style={{
                background: `${phase.color}15`,
                borderLeft: `3px solid ${phase.color}`,
              }}
            >
              <span className="mr-1 font-semibold" style={{ color: phase.color }}>
                💡 Trainer tip:
              </span>
              {phase.tip}
            </div>
          </div>

          {/* All phases timeline */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <button
              onClick={() => setShowAllPhases((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold text-white/70 hover:text-white"
            >
              <span>Hour-by-hour overview</span>
              <span>{showAllPhases ? "▲" : "▼"}</span>
            </button>

            {showAllPhases && (
              <div className="mt-4 space-y-2">
                {PHASES.map((p) => {
                  const isActive = phase.id === p.id;
                  const isPast = p.maxHours <= hoursElapsed;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all ${
                        isActive ? "bg-white/10" : isPast ? "opacity-40" : "opacity-60"
                      }`}
                      style={isActive ? { borderLeft: `3px solid ${p.color}` } : {}}
                    >
                      <span className="mt-0.5 text-lg">{p.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: p.color }}
                          >
                            {p.badge}
                          </span>
                          <span className="text-sm font-medium">{p.name}</span>
                          {isActive && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                              style={{ background: `${p.color}30`, color: p.color }}
                            >
                              YOU ARE HERE
                            </span>
                          )}
                          {isPast && (
                            <span className="text-xs text-white/30">✓ completed</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/50">{p.summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── START FAST FORM ─────────────────────────────────────────────── */
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-1 text-lg font-semibold">Start a Fast</h2>
          <p className="mb-5 text-sm text-white/50">
            Set your goal and let the trainer track your progress hour by hour.
          </p>

          {/* Goal presets */}
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
            Fasting goal
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESET_GOALS.map((h) => (
              <button
                key={h}
                onClick={() => {
                  setGoalHours(h);
                  setCustomGoal("");
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  goalHours === h && !customGoal
                    ? "border-[#4f6ef7] bg-[#4f6ef7]/20 text-white"
                    : "border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          <div className="mb-5 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={240}
              placeholder="Custom (hours)"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              className="w-36 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:border-[#4f6ef7] focus:outline-none"
            />
            {customGoal && (
              <span className="text-sm text-white/50">
                = {customGoal}h fast
                {parseInt(customGoal) >= 72 ? " (extended!)" : ""}
              </span>
            )}
          </div>

          {/* Custom start time */}
          <label className="mb-3 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={useCustomTime}
              onChange={(e) => setUseCustomTime(e.target.checked)}
              className="accent-[#4f6ef7]"
            />
            <span className="text-sm text-white/70">
              I started fasting at a different time
            </span>
          </label>

          {useCustomTime && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/40">
                When did you start?
              </p>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-[#4f6ef7] focus:outline-none"
              />
            </div>
          )}

          {/* Phase preview */}
          {effectiveGoal >= 1 && !isNaN(effectiveGoal) && (
            <div className="mb-5 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs font-medium text-white/40">
                Phases you&apos;ll go through:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PHASES.filter((p) => p.minHours < effectiveGoal).map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: `${p.color}20`, color: p.color }}
                  >
                    {p.emoji} {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {startMutation.error && (
            <p className="mb-3 text-sm text-red-400">
              Failed to start fast. Please try again.
            </p>
          )}

          <button
            onClick={startFast}
            disabled={
              startMutation.isPending ||
              !effectiveGoal ||
              isNaN(effectiveGoal) ||
              effectiveGoal < 1
            }
            className="w-full rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white transition hover:bg-[#3d5ce0] disabled:opacity-40"
          >
            {startMutation.isPending
              ? "Starting…"
              : `🚀 Start ${effectiveGoal}h Fast`}
          </button>
        </div>
      )}

      {/* ── SCIENCE OVERVIEW (shown when no active fast) ──────────────────── */}
      {!activeFast && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/80">
            📖 What to expect — hour by hour
          </h3>
          <div className="space-y-3">
            {PHASES.filter((p) => p.minHours < 73).map((p) => (
              <div key={p.id} className="flex items-start gap-3">
                <span className="mt-0.5 text-base">{p.emoji}</span>
                <div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: p.color }}
                  >
                    {p.badge} · {p.name}
                  </span>
                  <p className="text-xs text-white/50">{p.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY ───────────────────────────────────────────────────────── */}
      {!historyLoading && history.filter((h) => h.endedAt !== null).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-white/70 hover:text-white"
          >
            <span>
              Past fasts ({history.filter((h) => h.endedAt !== null).length})
            </span>
            <span>{showHistory ? "▲" : "▼"}</span>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2">
              {history
                .filter((h) => h.endedAt !== null)
                .map((h) => {
                  const secondsFasted = h.endedAt
                    ? Math.floor(
                        (h.endedAt.getTime() - h.startedAt.getTime()) / 1000,
                      )
                    : 0;
                  const hrs = Math.floor(secondsFasted / 3600);
                  const mins = Math.floor((secondsFasted % 3600) / 60);
                  const reached = secondsFasted / 3600 >= h.goalHours;
                  const finalPhase = getPhase(secondsFasted / 3600);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {hrs}h {mins > 0 ? `${mins}m` : ""} fasted
                          </span>
                          {reached ? (
                            <span className="text-xs text-green-400">
                              ✓ goal met
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">
                              / {h.goalHours}h goal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">
                          {formatDateTime(h.startedAt)} →{" "}
                          {h.endedAt ? formatDateTime(h.endedAt) : "ongoing"}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: `${finalPhase.color}20`,
                          color: finalPhase.color,
                        }}
                      >
                        {finalPhase.emoji} {finalPhase.name}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
