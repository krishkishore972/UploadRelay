"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion/primitives";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col bg-[#fafafa] text-[#0d0f12] antialiased md:grid md:grid-cols-[1.05fr_1fr]">
      <section className="relative flex min-h-[300px] flex-col justify-between overflow-hidden p-6 sm:min-h-[340px] sm:p-8 md:min-h-svh md:p-10">
        <FadeUp className="absolute inset-0" mount>
          <div className="absolute inset-0 bg-[url('/images/uploadrelay-hero.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0c]/95 via-[#0a0a0c]/45 to-[#561e1b]/35" />
        </FadeUp>

        <Stagger className="relative z-10 flex w-full items-start justify-between">
          <StaggerItem y={-12}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to home
            </Link>
          </StaggerItem>
          <StaggerItem y={-12}>
            <div className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              UploadRelay
            </div>
          </StaggerItem>
        </Stagger>

        <Stagger className="relative z-10">
          <StaggerItem>
            <h2 className="max-w-md text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Bring every cut into focus.
            </h2>
          </StaggerItem>
          <StaggerItem y={16}>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
              Upload once. Review anywhere. Publish directly to YouTube.
              Streamline master video handoffs without downloading a single
              gigabyte.
            </p>
          </StaggerItem>
          <StaggerItem y={16}>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-black shadow-sm">
                <Play className="size-4 fill-current" aria-hidden="true" />
              </span>
              UploadRelay
            </Link>
          </StaggerItem>
        </Stagger>
      </section>

      <section className="flex w-full items-center justify-center px-5 py-12 md:min-h-svh">
        <FadeUp>{children}</FadeUp>
      </section>
    </main>
  );
}