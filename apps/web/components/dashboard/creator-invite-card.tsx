"use client";

import { useEffect, useState } from "react";

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
    <div className="rounded-2xl border border-background-200 bg-background-100 p-5">
      <h2 className="text-sm font-semibold text-text-950">
        Your invite code
      </h2>
      <p className="mt-1 text-xs text-text-600">
        Share this with your editor so they can link to you.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-background-50 px-3 py-2 font-mono text-sm font-bold tracking-wider text-primary-700">
          {code}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg border border-background-200 px-3 py-2 text-xs font-semibold text-text-700 transition-colors hover:border-background-300 hover:text-text-950"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
