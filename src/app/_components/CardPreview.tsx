"use client";

import { getLabelColor, parseCardText } from "./parseCardText";

interface Props {
  title: string;
  description?: string;
}

export function CardPreview({ title, description }: Props) {
  const { title: cardName, labels, members } = parseCardText(title);

  if (!title.trim() && !description?.trim()) return null;

  return (
    <div className="w-full">
      <p className="mb-2 text-xs text-white/40">Draft preview</p>

      {/* Trello-style card */}
      <div className="rounded-lg bg-[#23272b] p-3 shadow-lg ring-1 ring-white/10">
        {/* Label chips */}
        {labels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {labels.map((label, i) => (
              <span
                key={i}
                className="h-5 min-w-[2.5rem] rounded-full px-2 text-[10px] font-semibold uppercase leading-5 text-white/90"
                style={{ backgroundColor: getLabelColor(label) }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Card title */}
        <p className="text-sm font-semibold leading-snug text-white">
          {cardName || <span className="italic text-white/30">Card title…</span>}
        </p>

        {/* Description */}
        {description?.trim() && (
          <p className="mt-1.5 text-xs leading-relaxed text-white/50">
            {description}
          </p>
        )}

        {/* Members */}
        {members.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {members.map((member, i) => (
              <span
                key={i}
                className="rounded-full bg-[#4f6ef7] px-2 py-0.5 text-[11px] font-medium text-white"
              >
                @{member}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Email breakdown */}
      <div className="mt-2 space-y-0.5 rounded-lg border border-white/5 bg-white/[0.03] p-3 text-xs text-white/40">
        <p>
          <span className="text-white/50">Subject → card name:</span>{" "}
          <span className="text-white/70">{title.trim() || "—"}</span>
        </p>
        {description?.trim() && (
          <p>
            <span className="text-white/50">Body → description:</span>{" "}
            <span className="text-white/70">{description.trim()}</span>
          </p>
        )}
      </div>
    </div>
  );
}

