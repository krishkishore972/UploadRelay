"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
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
    <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-neutral-950">
        <Link2 className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        Link a creator
      </h2>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Paste the invite code your creator shared to stage masters for their
        channel.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="UL-XXXXXX"
          className="h-11 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 font-mono text-sm uppercase tracking-[0.14em] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900"
        />
        <button
          type="button"
          onClick={handleLink}
          disabled={busy || !code.trim()}
          className="smooth-transition h-11 shrink-0 rounded-full bg-neutral-950 px-6 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? "Linking…" : "Link creator"}
        </button>
      </div>
      {msg ? (
        <p className="mt-2 font-mono text-[11px] text-neutral-500">{msg}</p>
      ) : null}
    </div>
  );
}
