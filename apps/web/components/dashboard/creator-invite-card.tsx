"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Ticket } from "lucide-react";

export function CreatorInviteCard() {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/creator/invite").then(async (r) => {
      const data = await r.json();
      if (data.inviteCode) setCode(data.inviteCode);
    });
  }, []);

  if (!code) return null;

  return (
    <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-neutral-950">
            <Ticket className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            Your invite code
          </h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Share this with your editor so they can link to you. Codes rotate
            per creator account.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <code className="flex-1 rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-2.5 text-center font-mono text-sm font-bold tracking-[0.18em] text-neutral-950">
          {code}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="smooth-transition inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-700 hover:border-neutral-900 hover:text-neutral-950"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
