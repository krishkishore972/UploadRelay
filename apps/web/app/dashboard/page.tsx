import Link from "next/link";

import { EditorVideos } from "@/components/videos/editor-videos";

export default function DashboardPage() {
  return (
    <main className="min-h-svh bg-background-50 text-text-950">
      <header className="border-b border-background-200 bg-background-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-base font-semibold tracking-tight">
            UploadRelay
          </Link>

          <Link
            href="/upload"
            className="text-sm font-medium text-text-800 transition hover:text-text-950"
          >
            Upload video
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
            Editor dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Uploaded videos
          </h1>
        </div>

        <EditorVideos />
      </section>
    </main>
  );
}