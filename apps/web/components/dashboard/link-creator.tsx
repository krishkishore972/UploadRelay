"use client";

import { useState } from "react";
import { goApi } from "@/lib/go-api";

export function LinkCreator({ onLinked }: { onLinked?: () => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLink() {
    if (!code.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      const { data } = await goApi.post("/links", { inviteCode: code.trim() });
      setMsg(
        data.alreadyLinked
          ? `Already linked to ${data.email}`
          : `Linked to ${data.email}`,
      );
      setCode("");
      onLinked?.();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { error?: string } };
      };
      setMsg(err.response?.data?.error ?? "Failed to link. Check the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-background-200 bg-background-100 p-5">
      <h2 className="text-sm font-semibold text-text-950">Link a creator</h2>
      <p className="mt-1 text-xs text-text-600">
        Paste the invite code your creator shared.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="UL-XXXXXX"
          className="h-10 flex-1 rounded-lg border border-background-200 bg-background-50 px-3 font-mono text-sm uppercase text-text-950 outline-none transition placeholder:text-text-400 focus:border-primary-700"
        />
        <button
          type="button"
          onClick={handleLink}
          disabled={busy || !code.trim()}
          className="h-10 shrink-0 rounded-lg bg-primary-700 px-4 text-sm font-semibold text-text-50 transition-colors hover:bg-primary-800 disabled:opacity-50"
        >
          {busy ? "Linking…" : "Link"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-text-600">{msg}</p> : null}
    </div>
  );
}
