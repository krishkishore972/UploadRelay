"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { goApi } from "@/lib/go-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LinkCreator({ onLinked }: { onLinked?: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLink() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data } = await goApi.post("/links", { inviteCode: code.trim() });
      toast.success(
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
      toast.error(err.response?.data?.error ?? "Failed to link. Check the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-neutral-500" aria-hidden="true" />
          Link a creator
        </CardTitle>
        <CardDescription>
          Paste the invite code your creator shared to stage masters for their
          channel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="UL-XXXXXX"
            className="font-mono uppercase tracking-[0.14em]"
          />
          <Button
            variant="brand"
            size="lg"
            onClick={handleLink}
            disabled={busy || !code.trim()}
          >
            {busy ? "Linking…" : "Link creator"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
