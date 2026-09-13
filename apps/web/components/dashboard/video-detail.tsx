"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Database,
  FileVideo,
  HardDrive,
  Link2,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { goApi } from "@/lib/go-api";
import type { VideoDetail as VideoDetailType } from "@/lib/dashboard/types";
import {
  fileExtension,
  formatBytes,
  formatDate,
  initials,
  videoStatusMeta,
} from "@/lib/dashboard/format";
import { playlistUrl } from "@/lib/dashboard/url";
import { cn } from "@/lib/utils";
import { HlsPlayer } from "@/components/videos/hls-player";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";

function DetailRow({
  icon,
  label,
  children,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="flex items-center gap-2 text-xs text-neutral-500">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "max-w-[60%] truncate text-right text-xs font-medium text-neutral-900",
          mono && "font-mono text-[11px]",
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function VideoDetail({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      if (!r.ok) return;
      const session = await r.json();
      setIsCreator(session?.user?.role === "CREATOR");
    });
  }, []);

  async function act(path: "submit" | "approve" | "reject") {
    setActing(true);
    try {
      await goApi.post(`/videos/${videoId}/${path}`);
      const response = await goApi.get<VideoDetailType>(`/videos/${videoId}`);
      setVideo(response.data);
      toast.success(
        path === "submit"
          ? "Submitted for review"
          : path === "approve"
            ? "Cut approved"
            : "Changes requested",
      );
    } catch (error) {
      console.error(error);
      toast.error("Action failed. Check video status and your role.");
    } finally {
      setActing(false);
    }
  }

  useEffect(() => {
    async function loadVideo() {
      try {
        setErrorMessage("");
        const response = await goApi.get<VideoDetailType>(`/videos/${videoId}`);
        setVideo(response.data);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load video.");
      } finally {
        setIsLoading(false);
      }
    }

    loadVideo();
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="aspect-video rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (errorMessage || !video) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="text-red-800">
          {errorMessage || "Video not found."}
        </AlertDescription>
      </Alert>
    );
  }

  const status = videoStatusMeta(video.status);
  const src = video.masterPlaylistKey
    ? playlistUrl(video.masterPlaylistKey)
    : "";
  const creator = video.creator;
  const channel = video.creator.channel;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-3 text-neutral-600"
          render={<Link href="/dashboard/videos" />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Videos
        </Button>
        <StatusBadge status={video.status} />
      </div>

      {video.status === "PREVIEW_READY" && !isCreator ? (
        <Button
          variant="brand"
          size="lg"
          disabled={acting}
          onClick={() => act("submit")}
        >
          {acting ? "Submitting…" : "Submit for review"}
        </Button>
      ) : null}

      {video.status === "APPROVAL_REQUESTED" && isCreator ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="brand"
            size="lg"
            disabled={acting}
            onClick={() => act("approve")}
          >
            {acting ? "Approving…" : "Approve"}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full"
            disabled={acting}
            onClick={() => act("reject")}
          >
            {acting ? "Rejecting…" : "Request changes"}
          </Button>
        </div>
      ) : null}

      <div>
        <h1 className="headline-display max-w-3xl text-2xl font-bold text-neutral-950 sm:text-3xl">
          {video.title || video.originalFileName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{video.originalFileName}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-neutral-900 bg-neutral-950">
            {src ? (
              <HlsPlayer src={src} className="!rounded-none" />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 text-neutral-500">
                <RefreshCw className="size-6 animate-spin" aria-hidden="true" />
                <p className="text-sm">
                  Preview is being generated. Check back shortly.
                </p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaStat
              icon={<FileVideo className="size-4" aria-hidden="true" />}
              label="Format"
              value={fileExtension(video.originalFileName)}
            />
            <MetaStat
              icon={<HardDrive className="size-4" aria-hidden="true" />}
              label="Size"
              value={formatBytes(video.originalSize)}
            />
            <MetaStat
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              label="Uploaded"
              value={formatDate(video.createdAt)}
            />
            <MetaStat
              icon={<Database className="size-4" aria-hidden="true" />}
              label="Storage"
              value="S3 · Transcode"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="size-4 text-brand-accent" aria-hidden="true" />
                File details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator />
              <DetailRow icon={<FileVideo className="size-3.5" />} label="Mime type">
                {video.originalMimeType || "Unknown"}
              </DetailRow>
              <Separator />
              <DetailRow icon={<CalendarDays className="size-3.5" />} label="Created">
                {formatDate(video.createdAt)}
              </DetailRow>
              <Separator />
              <DetailRow icon={<RefreshCw className="size-3.5" />} label="Last updated">
                {formatDate(video.updatedAt)}
              </DetailRow>
              <Separator />
              <DetailRow icon={<Database className="size-3.5" />} label="Storage key" mono>
                {video.originalS3Key}
              </DetailRow>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="size-4 text-brand-accent" aria-hidden="true" />
                Publishing target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {initials(creator.name, creator.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {creator.name || "Creator"}
                  </p>
                  <p className="truncate text-xs text-neutral-500">{creator.email}</p>
                </div>
                <Badge variant="secondary" className="ml-auto uppercase">
                  {creator.role}
                </Badge>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-neutral-900">
                    <Link2 className="size-3.5 text-brand-accent" aria-hidden="true" />
                    YouTube channel
                  </span>
                  {channel?.connected ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Not connected</Badge>
                  )}
                </div>

                {channel?.connected ? (
                  <div className="mt-3">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {channel.channelTitle || "Untitled channel"}
                    </p>
                    {channel.channelId ? (
                      <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
                        {channel.channelId}
                      </p>
                    ) : null}
                    {channel.googleAccountEmail ? (
                      <p className="mt-1 truncate text-[11px] text-neutral-400">
                        {channel.googleAccountEmail}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    This creator has not linked a YouTube channel yet. Publishing
                    will wait until a connection is added.
                  </p>
                )}
              </div>

              {video.status === "APPROVED" ? (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-3 text-[11px] leading-5 text-neutral-500">
                  Approved — direct publish to YouTube lands here next (OAuth +
                  publish worker).
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-accent" aria-hidden="true" />
                Transfer state
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator />
              <DetailRow icon={<FileVideo className="size-3.5" />} label="Status">
                {status.label}
              </DetailRow>
              <Separator />
              <DetailRow icon={<Database className="size-3.5" />} label="Original">
                {video.originalS3Key.length > 0 ? "In vault" : "Pending"}
              </DetailRow>
              <Separator />
              <DetailRow icon={<RefreshCw className="size-3.5" />} label="Preview">
                {video.masterPlaylistKey ? "HLS ready" : "Generating"}
              </DetailRow>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MetaStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="p-3">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          {icon}
          {label}
        </span>
        <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
