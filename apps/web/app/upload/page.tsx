import Link from "next/link";

import { UploadForm } from "@/components/upload/upload-form";

export default function UploadPage() {
  return (
    <main className="min-h-svh bg-background-50 text-text-950">
      <header className="border-b border-background-200 bg-background-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-base font-semibold tracking-tight">
            UploadRelay
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-text-800 transition hover:text-text-950"
          >
            Back to overview
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-65px)] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
            Upload module
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Send the original video directly to cloud storage.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-text-800">
            This module handles the first part of the UploadRelay workflow:
            chunking the selected video in the browser, signing each part, and
            completing the S3 multipart upload.
          </p>
          <div className="mt-8 grid max-w-xl gap-3">
            {[
              "Browser creates chunks from the selected file",
              "API returns signed URLs for each part",
              "S3 receives the upload directly from the browser",
              "API completes the multipart upload session",
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-background-200 bg-background-100 px-4 py-3 text-sm text-text-800"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <UploadForm />
      </section>
    </main>
  );
}
