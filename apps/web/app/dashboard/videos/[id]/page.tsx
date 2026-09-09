import { VideoDetail } from "@/components/dashboard/video-detail";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-svh bg-background-50 text-text-950">
      <VideoDetail videoId={id} />
    </main>
  );
}