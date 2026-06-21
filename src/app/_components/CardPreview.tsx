"use client";

import { getLabelColor, parseCardText } from "./parseCardText";

interface Props {
  title: string;
  description?: string;
  /** Strip a specific `#label` token from the title (one-tap correction). */
  onRemoveLabel?: (label: string) => void;
  /** Strip a specific `@member` token from the title (one-tap correction). */
  onRemoveMember?: (member: string) => void;
}

export function CardPreview({
  title,
  description,
  onRemoveLabel,
  onRemoveMember,
}: Props) {
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
                className="group inline-flex h-5 min-w-[2.5rem] items-center gap-1 rounded-full px-2 text-[10px] font-semibold uppercase leading-5 text-white/90"
                style={{ backgroundColor: getLabelColor(label) }}
              >
                {label}
                {onRemoveLabel && (
                  <button
                    type="button"
                    onClick={() => onRemoveLabel(label)}
                    aria-label={`Remove label ${label}`}
                    title="Remove from title"
                    className="-mr-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-black/25 hover:text-white"
                  >
                    ✕
                  </button>
                )}
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
                className="inline-flex items-center gap-1 rounded-full bg-[#4f6ef7] px-2 py-0.5 text-[11px] font-medium text-white"
              >
                @{member}
                {onRemoveMember && (
                  <button
                    type="button"
                    onClick={() => onRemoveMember(member)}
                    aria-label={`Remove member ${member}`}
                    title="Remove from title"
                    className="-mr-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-black/25 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {(onRemoveLabel ?? onRemoveMember) &&
        (labels.length > 0 || members.length > 0) && (
          <p className="mt-1.5 text-[11px] text-white/30">
            Mis-heard? Tap ✕ on a chip to remove it.
          </p>
        )}

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

