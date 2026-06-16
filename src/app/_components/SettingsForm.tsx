"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";

interface Props {
  currentEmail: string | null;
}

export function SettingsForm({ currentEmail }: Props) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const utils = api.useUtils();

  const upsert = api.settings.upsertTrelloEmail.useMutation({
    onSuccess: () => {
      toast.success("✅ Email saved!");
      void utils.settings.getTrelloEmail.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = api.settings.deleteTrelloEmail.useMutation({
    onSuccess: () => {
      setEmail("");
      toast.success("Email removed.");
      void utils.settings.getTrelloEmail.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.warning("Please enter an email address.");
    upsert.mutate({ trelloEmail: email.trim() });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Form card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Trello Board Email</h2>
        <p className="mt-1 text-sm text-white/50">
          Use your personal email for testing, or paste your Trello board
          email-to-board address for production.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="trello-email" className="text-xs text-white/50">
              Email address
            </label>
            <input
              id="trello-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-board@boards.trello.com"
              inputMode="email"
              autoComplete="email"
              required
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#4f6ef7]/60 focus:ring-1 focus:ring-[#4f6ef7]/30 transition-colors"
            />
            {currentEmail && (
              <p className="text-xs text-white/40">
                Current: {currentEmail}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!email.trim() || upsert.isPending}
              className="flex-1 rounded-xl bg-[#4f6ef7] py-3 text-sm font-semibold text-white hover:bg-[#3d5ce0] disabled:opacity-40 transition-colors"
            >
              {upsert.isPending ? "Saving…" : currentEmail ? "Update Email" : "Save Email"}
            </button>
            {currentEmail && (
              <button
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                className="rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
              >
                {remove.isPending ? "…" : "Remove"}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* How-to card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold">How to find your Trello board email</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-white/50">
          <li>Open your Trello board</li>
          <li>Click <strong className="text-white/70">Share</strong> (top right)</li>
          <li>Select <strong className="text-white/70">Print, export, and share</strong></li>
          <li>Copy the <strong className="text-white/70">Email-to-board address</strong></li>
        </ol>
        <p className="mt-3 text-xs text-white/30">
          💡 Tip: Use your personal email first to test the flow without posting to Trello.
        </p>
      </div>
    </div>
  );
}
