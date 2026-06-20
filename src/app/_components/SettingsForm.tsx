"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";

// Standard Trello-compatible colors
const TRELLO_COLORS: { name: string; hex: string }[] = [
  { name: "Red",    hex: "#eb5a46" },
  { name: "Orange", hex: "#ff9f1a" },
  { name: "Yellow", hex: "#f2d600" },
  { name: "Green",  hex: "#61bd4f" },
  { name: "Blue",   hex: "#0079bf" },
  { name: "Purple", hex: "#c377e0" },
  { name: "Pink",   hex: "#ff78cb" },
  { name: "Sky",    hex: "#00c2e0" },
  { name: "Lime",   hex: "#51e898" },
  { name: "Black",  hex: "#344563" },
];

export function SettingsForm() {
  const utils = api.useUtils();
  const { data: boards = [], isLoading } = api.settings.getBoardEmails.useQuery();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // ── Labels state ────────────────────────────────────────────────────────────
  const { data: labels = [], isLoading: labelsLoading } = api.settings.getLabels.useQuery();
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(TRELLO_COLORS[3]!.hex); // green default
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState("");
  const [editLabelColor, setEditLabelColor] = useState("");

  const invalidateLabels = () => void utils.settings.getLabels.invalidate();

  const addLabel = api.settings.addLabel.useMutation({
    onSuccess: () => {
      toast.success("✅ Label added!");
      setLabelName("");
      setLabelColor(TRELLO_COLORS[3]!.hex);
      invalidateLabels();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateLabel = api.settings.updateLabel.useMutation({
    onSuccess: () => {
      toast.success("✅ Label saved!");
      setEditingLabelId(null);
      invalidateLabels();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeLabel = api.settings.deleteLabel.useMutation({
    onSuccess: () => { toast.success("Label removed."); invalidateLabels(); },
    onError: (err) => toast.error(err.message),
  });

  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelName.trim()) return toast.warning("Please enter a label name.");
    addLabel.mutate({ name: labelName.trim(), color: labelColor });
  };

  const startEditLabel = (id: string, name: string, color: string) => {
    setEditingLabelId(id);
    setEditLabelName(name);
    setEditLabelColor(color);
  };

  const invalidate = () => void utils.settings.getBoardEmails.invalidate();

  const add = api.settings.addBoardEmail.useMutation({
    onSuccess: () => {
      toast.success("✅ Board added!");
      setNickname(""); setEmail("");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const update = api.settings.updateBoardEmail.useMutation({
    onSuccess: () => {
      toast.success("✅ Saved!");
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = api.settings.deleteBoardEmail.useMutation({
    onSuccess: () => { toast.success("Board removed."); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return toast.warning("Please enter a nickname.");
    if (!email.trim()) return toast.warning("Please enter an email.");
    add.mutate({ nickname: nickname.trim(), email: email.trim() });
  };

  const startEdit = (id: string, n: string, e: string) => {
    setEditingId(id); setEditNickname(n); setEditEmail(e);
  };

  const handleUpdate = (id: string) => {
    update.mutate({ id, nickname: editNickname.trim(), email: editEmail.trim() });
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Board list */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Trello Board Emails</h2>
        <p className="mt-1 text-sm text-white/50">
          Add one entry per Trello board. Give each a nickname so you can pick the right board when creating a card.
        </p>

        {isLoading && <p className="mt-4 text-sm text-white/30 animate-pulse">Loading…</p>}

        {!isLoading && boards.length === 0 && (
          <p className="mt-4 text-sm text-white/30">No boards yet — add one below.</p>
        )}

        {boards.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {boards.map((board) => (
              <li key={board.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                {editingId === board.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      placeholder="Nickname"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 transition-colors"
                    />
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="board@boards.trello.com"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(board.id)}
                        disabled={update.isPending}
                        className="flex-1 rounded-lg bg-[#4f6ef7] py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {update.isPending ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{board.nickname}</p>
                      <p className="text-xs text-white/40 truncate">{board.email}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => startEdit(board.id, board.nickname, board.email)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove.mutate({ id: board.id })}
                        disabled={remove.isPending}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add new board */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-semibold">Add a board</h2>
        <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder='e.g. "Incoming – Team Global"'
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">Board email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-board@boards.trello.com"
              inputMode="email"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!nickname.trim() || !email.trim() || add.isPending}
            className="rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white hover:bg-[#3d5ce0] disabled:opacity-40 transition-colors"
          >
            {add.isPending ? "Adding…" : "+ Add Board"}
          </button>
        </form>
      </div>

      {/* How-to card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold">How to find your Trello board email</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-white/50">
          <li>Open your Trello board</li>
          <li>Open the board sidebar and click <strong className="text-white/70">More</strong></li>
          <li>Click <strong className="text-white/70">Email-to-board Settings</strong></li>
          <li>Copy your unique board email address</li>
          <li>Give it a nickname like <em className="text-white/60">&ldquo;Incoming – Team Global&rdquo;</em> so you know which list it lands in</li>
        </ol>
        <p className="mt-3 text-xs text-white/30">
          💡 Tip: Add multiple entries for the same board with different lists (top vs. bottom, different columns).
        </p>
      </div>

      {/* ── Custom Labels ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Custom Labels</h2>
        <p className="mt-1 text-sm text-white/50">
          Define labels that match your Trello board. The label name is appended as{" "}
          <code className="rounded bg-white/10 px-1 text-xs text-white/70">#name</code> to the card title so Trello applies the matching label automatically.
        </p>

        {labelsLoading && <p className="mt-4 text-sm text-white/30 animate-pulse">Loading…</p>}

        {!labelsLoading && labels.length === 0 && (
          <p className="mt-4 text-sm text-white/30">No labels yet — add one below.</p>
        )}

        {labels.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {labels.map((label) => (
              <li key={label.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                {editingLabelId === label.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={editLabelName}
                      onChange={(e) => setEditLabelName(e.target.value)}
                      placeholder="Label name"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 transition-colors"
                    />
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-white/40">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {TRELLO_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.name}
                            onClick={() => setEditLabelColor(c.hex)}
                            style={{ backgroundColor: c.hex }}
                            className={`h-7 w-7 rounded-full transition-all ${editLabelColor === c.hex ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1f36] scale-110" : "opacity-70 hover:opacity-100"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateLabel.mutate({ id: label.id, name: editLabelName.trim(), color: editLabelColor })}
                        disabled={updateLabel.isPending}
                        className="flex-1 rounded-lg bg-[#4f6ef7] py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {updateLabel.isPending ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingLabelId(null)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-5 w-5 shrink-0 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm font-medium text-white">{label.name}</span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => startEditLabel(label.id, label.name, label.color)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeLabel.mutate({ id: label.id })}
                        disabled={removeLabel.isPending}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add new label */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-semibold">Add a label</h2>
        <form onSubmit={handleAddLabel} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">Label name</label>
            <input
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder='e.g. "Urgent", "Bug", "Feature"'
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50">Color</label>
            <div className="flex flex-wrap gap-2">
              {TRELLO_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setLabelColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`h-8 w-8 rounded-full transition-all ${labelColor === c.hex ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1f36] scale-110" : "opacity-60 hover:opacity-90"}`}
                />
              ))}
            </div>
            {labelColor && (
              <p className="text-xs text-white/30">
                Selected:{" "}
                <span
                  className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: labelColor }}
                >
                  {labelName || "Label"}
                </span>
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!labelName.trim() || addLabel.isPending}
            className="rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white hover:bg-[#3d5ce0] disabled:opacity-40 transition-colors"
          >
            {addLabel.isPending ? "Adding…" : "+ Add Label"}
          </button>
        </form>
      </div>
    </div>
  );
}
