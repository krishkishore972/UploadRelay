"use client";

import { Clock3, Film, Send } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUploadDialog } from "@/components/upload/upload-dialog-context";
import {
  useDashboardVideos,
  useLoadVideosOnMount,
} from "./use-dashboard-videos";

type Metric = {
  label: string;
  hint: string;
  value: number;
  href: string;
};

export function DashboardOverview() {
  const { videos, isCreator, isLoading, loadVideos } = useDashboardVideos();
  const { uploadVersion } = useUploadDialog();
  useLoadVideosOnMount(loadVideos, uploadVersion);

  const pendingReview = videos.filter(
    (video) => video.status === "APPROVAL_REQUESTED",
  ).length;
  const approvedCount = videos.filter(
    (video) => video.status === "APPROVED",
  ).length;
  const previewReady = videos.filter(
    (video) => video.status === "PREVIEW_READY",
  ).length;

  const metrics: Metric[] = isCreator
    ? [
        {
          label: "Awaiting your review",
          hint: "Approval requested",
          value: pendingReview,
          href: "/dashboard/review",
        },
        {
          label: "All cuts",
          hint: "From linked editors",
          value: videos.length,
          href: "/dashboard/videos",
        },
        {
          label: "Approved",
          hint: "Cleared for publishing",
          value: approvedCount,
          href: "/dashboard/videos",
        },
      ]
    : [
        {
          label: "Master cuts",
          hint: "All your uploads",
          value: videos.length,
          href: "/dashboard/videos",
        },
        {
          label: "Ready to submit",
          hint: "Preview generated",
          value: previewReady,
          href: "/dashboard/videos",
        },
        {
          label: "Approved",
          hint: "Creator signed off",
          value: approvedCount,
          href: "/dashboard/videos",
        },
      ];

  return (
    <main className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          {isCreator ? "Creator Portal" : "Studio Portal"}
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="headline-display text-3xl font-bold text-neutral-950 md:text-4xl">
              Overview
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              {isCreator
                ? "See what needs approval, then jump into the review queue or your invite links."
                : "Upload a master, link a creator, and track cuts through preview and approval."}
            </p>
          </div>
          {isCreator ? (
            <Button variant="brand" size="lg" render={<Link href="/dashboard/review" />}>
              Open review queue
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {metric.label}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200/60 bg-neutral-100 text-neutral-700">
                  {metric.label === "Approved" ? (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  ) : metric.label.includes("review") ||
                    metric.label.includes("submit") ? (
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Film className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="font-mono text-3xl font-bold tracking-tight text-neutral-950">
                  {isLoading ? "—" : metric.value}
                </div>
                <p className="mt-1 font-mono text-xs text-neutral-400">
                  {metric.hint}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
