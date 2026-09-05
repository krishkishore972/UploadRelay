"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion/primitives";

const headline = [
  "Upload once.",
  "Review anywhere.",
  "Publish to YouTube.",
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col bg-[#fafafa] text-[#0d0f12] antialiased md:grid md:grid-cols-[1.05fr_1fr]">
      <section className="relative flex min-h-[320px] flex-col justify-between overflow-hidden p-6 sm:min-h-[360px] sm:p-8 md:min-h-svh md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0c] via-[#12202a] to-[#3a1b24]" />

        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-accent/30 blur-3xl animate-float-soft" />
        <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-amber-500/25 blur-3xl animate-float-soft-delay" />
        <div className="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-emerald-800/30 blur-3xl animate-float-soft" />

        <Stagger className="relative z-10" mount>
          <StaggerItem y={-12}>
            <Link
              href="/"
              aria-label="Back to UploadRelay home"
              className="group inline-flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors group-hover:bg-white/25">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-white">
                UploadRelay
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent" />
              </span>
            </Link>
          </StaggerItem>
        </Stagger>

        <Stagger className="relative z-10 max-w-xl" stagger={0.14} mount>
          {headline.map((row, index) => (
            <StaggerItem key={row} y={32}>
              <h2
                className={`text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl ${
                  index === headline.length - 1
                    ? "bg-gradient-to-r from-brand-accent via-amber-400 to-brand-accent bg-clip-text text-transparent"
                    : "text-white"
                }`}
              >
                {row}
              </h2>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="flex w-full items-center justify-center px-5 py-12 md:min-h-svh">
        <FadeUp mount>{children}</FadeUp>
      </section>
    </main>
  );
}