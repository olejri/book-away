"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";

export function SettingsForm() {
  const utils = api.useUtils();
  const { data: boards = [], isLoading } = api.settings.getBoardEmails.useQuery();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editEmail, setEditEmail] = useState("");

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
          <li>Give it a nickname like <em className="text-white/60">"Incoming – Team Global"</em> so you know which list it lands in</li>
        </ol>
        <p className="mt-3 text-xs text-white/30">
          💡 Tip: Add multiple entries for the same board with different lists (top vs. bottom, different columns).
        </p>
      </div>
    </div>
  );
}
