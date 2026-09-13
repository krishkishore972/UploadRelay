"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            Your invite code
          </CardTitle>
          <CardDescription className="mt-1">
            Share this with your editor so they can link to you. Codes rotate
            per creator account.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-2.5 text-center font-mono text-sm font-bold tracking-[0.18em] text-neutral-950">
            {code}
          </code>
          <Button
            variant="brandOutline"
            size="lg"
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              toast.success("Invite code copied");
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
