"use client";

import { Film, RefreshCw, UploadCloud } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadDialog } from "@/components/upload/upload-dialog-context";
import type { DashboardVideo } from "./use-dashboard-videos";
import { VideoCard } from "./video-card";

export function VideoLibrary({
  title,
  hint,
  videos,
  isLoading,
  errorMessage,
  emptyTitle,
  emptyDescription,
  onRefresh,
  showUpload = false,
}: {
  title: string;
  hint: string;
  videos: DashboardVideo[];
  isLoading: boolean;
  errorMessage: string;
  emptyTitle: string;
  emptyDescription: string;
  onRefresh: () => void;
  showUpload?: boolean;
}) {
  const { openUpload } = useUploadDialog();

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold tracking-tight text-neutral-950">
            {title}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-500">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="brandOutline" size="lg" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
          {showUpload ? (
            <Button variant="brand" size="lg" onClick={openUpload}>
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload a video
            </Button>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="aspect-video rounded-none" />
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center px-6 pb-16 pt-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Film className="h-5 w-5 text-neutral-600" aria-hidden="true" />
            </div>
            <CardTitle className="mt-4 text-sm">{emptyTitle}</CardTitle>
            <CardDescription className="max-w-xs">
              {emptyDescription}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}
