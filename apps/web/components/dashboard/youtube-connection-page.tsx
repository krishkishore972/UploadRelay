"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2,} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { toast } from "sonner";

import { goApi } from "@/lib/go-api";
import type {
  StartYouTubeOAuthResponse,
  YouTubeConnection,
} from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function YouTubeConnectionPage() {
  const [connection, setConnection] = useState<YouTubeConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function loadConnection() {
    try {
      const response = await goApi.get<YouTubeConnection>("/youtube/connection");
      setConnection(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load YouTube connection.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadConnection();

    const params = new URLSearchParams(window.location.search);
    const status = params.get("youtube");

    if (status === "connected") {
      toast.success("YouTube channel connected.");
      window.history.replaceState(null, "", "/dashboard/youtube");
    } else if (status && status !== "connected") {
      toast.error("YouTube connection failed.");
      window.history.replaceState(null, "", "/dashboard/youtube");
    }
  }, []);

  async function connect() {
    setIsConnecting(true);
    try {
      const response = await goApi.get<StartYouTubeOAuthResponse>(
        "/youtube/oauth/start",
      );
      window.location.href = response.data.url;
    } catch (error) {
      console.error(error);
      toast.error("Failed to start YouTube connection.");
      setIsConnecting(false);
    }
  }

  async function disconnect() {
    setIsDisconnecting(true);
    try {
      await goApi.delete("/youtube/connection");
      await loadConnection();
      toast.success("YouTube channel disconnected.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect YouTube.");
    } finally {
      setIsDisconnecting(false);
    }
  }

  const connected = connection?.connected;

  return (
    <main className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          Creator Portal
        </p>
        <h1 className="headline-display mt-2 text-3xl font-bold text-neutral-950 md:text-4xl">
          YouTube connection
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          Connect the YouTube channel that approved videos will publish to.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaYoutube className="h-5 w-5 text-red-600" aria-hidden="true" />
            Channel access
          </CardTitle>
          <CardDescription>
            UploadRelay only stores OAuth tokens for publishing approved videos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading connection…
            </div>
          ) : connected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-neutral-950">
                    {connection.channelTitle || "YouTube channel"}
                  </p>
                  <Badge variant="success">Connected</Badge>
                </div>

                {connection.channelId ? (
                  <p className="mt-2 break-all font-mono text-xs text-neutral-500">
                    {connection.channelId}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="brand"
                  disabled={isConnecting}
                  onClick={connect}
                >
                  {isConnecting ? "Reconnecting…" : "Reconnect"}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDisconnecting}
                  onClick={disconnect}
                >
                  {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-950">
                  No YouTube channel connected
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Connect your channel before publishing approved videos.
                </p>
              </div>

              <Button
                type="button"
                variant="brand"
                disabled={isConnecting}
                onClick={connect}
              >
                {isConnecting ? "Opening Google…" : "Connect YouTube"}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}