"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock3,
  Globe2,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ds } from "@/lib/design-system";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion/primitives";

const partners = [
  "MERIDIAN",
  "NORTHLINE",
  "ARCFORM",
  "NELO GROUP",
  "JUNIPER",
  "APEXCUTS",
  "PIXELPOST",
];

const fileRows = [
  ["MOV", "Episode_04_ProRes_Master.mov", "34.2 GB", "neutral"],
  ["MOV", "RoughRoute_v2_Rec709.mov", "18.4 GB", "neutral"],
  ["SRT", "Campaign_Subtitles_EN.srt", "84 KB", "red"],
  ["PNG", "Master_Thumbnail_A_B_Test.png", "4.1 MB", "green"],
];

const featureCards = [
  {
    eyebrow: "Vault",
    title: "Campaign Master Cuts",
    body: "ProRes 422 and DNxHR cloud staging without creator-side bandwidth pain.",
    tone: "from-black via-neutral-900/90 to-neutral-800",
    accent: "text-amber-400",
  },
  {
    eyebrow: "Review",
    title: "Frame Review",
    body: "Preview-first approval keeps the original in S3 while creators review a lighter stream.",
    tone: "from-[#282115] via-neutral-900 to-black",
    accent: "text-orange-400",
  },
  {
    eyebrow: "Security",
    title: "Creator Control",
    body: "Editors never need channel credentials. Publishing waits for creator approval.",
    tone: "from-[#17222a] via-neutral-950 to-black",
    accent: "text-sky-400",
  },
  {
    eyebrow: "Dispatch",
    title: "Direct YouTube Pipeline",
    body: "Approved originals move from cloud storage to YouTube ingestion servers.",
    tone: "from-[#221c27] via-neutral-900 to-black",
    accent: "text-emerald-400",
  },
];

const updates = [
  {
    type: "Product",
    date: "Now",
    title: "Multipart upload and S3 ingest pipeline are live in the MVP.",
    visual: "Relay",
    tone: "from-amber-400 via-brand-accent to-neutral-900",
  },
  {
    type: "Worker",
    date: "Next",
    title: "FFmpeg preview jobs generate HLS renditions for browser review.",
    visual: "HLS",
    tone: "from-teal-900 via-neutral-900 to-black",
  },
  {
    type: "Review",
    date: "Planned",
    title: "Creator approval and publishing controls complete the next vertical slice.",
    visual: "OK",
    tone: "from-neutral-800 via-neutral-900 to-neutral-700",
  },
];

export function LandingPage() {
  return (
    <main className={ds.page}>
      <FloatingNav />
      <HeroSection />
      <PipelineSection />
      <FoundationSection />
      <PreviewSection />
      <UseCasesSection />
      <QuoteSection />
      <UpdatesSection />
      <CtaSection />
      <Footer />
    </main>
  );
}

function FloatingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      className="sticky top-5 z-50 flex w-full justify-center px-4"
    >
      <nav className={`${ds.nav} flex w-full max-w-4xl items-center justify-between px-4 py-2`}>
        <Link
          href="/"
          aria-label="UploadRelay Home"
          className="group flex items-center gap-2.5 pl-1"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-black shadow-sm transition-transform group-hover:scale-105">
            <Play className="size-4 fill-current" aria-hidden="true" />
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-white">
            UploadRelay
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent" />
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-xs font-medium text-neutral-300 md:flex">
          <a className="transition-colors hover:text-white" href="#pipeline">
            Pipeline
          </a>
          <a className="transition-colors hover:text-white" href="#features">
            Features
          </a>
          <a className="transition-colors hover:text-white" href="#workflow">
            Workflow
          </a>
          <a className="transition-colors hover:text-white" href="#updates">
            Updates
          </a>
        </div>

        <Link
href="/auth?mode=signup"
          className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black shadow-sm transition-colors hover:bg-neutral-200"
        >
          Get started
        </Link>
      </nav>
    </motion.header>
  );
}

function HeroSection() {
  return (
    <section className={`${ds.container} pb-16 pt-20 text-center md:pb-20 md:pt-28`}>
      <Stagger className="mx-auto max-w-4xl">
        <StaggerItem>
          <h1 className="headline-display mx-auto max-w-4xl text-5xl font-bold text-neutral-900 sm:text-6xl md:text-7xl lg:text-[84px]">
            Bring every cut
            <br />
            into focus
          </h1>
        </StaggerItem>
        <StaggerItem y={18}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-600 sm:text-xl">
            Upload once. Review anywhere. Publish directly to YouTube. Streamline
            master video handoffs without downloading a single gigabyte.
          </p>
        </StaggerItem>
        <StaggerItem y={18}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/upload" className={ds.primaryButton}>
              Test multipart upload
            </Link>
            <Link href="/auth" className={ds.secondaryButton}>
              Sign in
            </Link>
          </div>
        </StaggerItem>
      </Stagger>

      <FadeUp mount y={32} delay={0.25} className="mx-auto mt-12 w-full max-w-5xl rounded-3xl bg-gradient-to-b from-neutral-300 via-neutral-200 to-transparent p-1.5 shadow-2xl sm:p-2 md:mt-16">
        <div className="hero-glow-container flex h-72 w-full items-center justify-center rounded-[22px] p-6 text-white shadow-inner sm:h-96 md:h-[480px]">
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/20 bg-black/40 p-6 text-left shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className={`${ds.mono} ml-2 hidden text-neutral-300 sm:inline`}>
                  RELAY_PIPELINE // 04K_MASTER.mov
                </span>
              </div>
              <span className="rounded-full border border-brand-accent/40 bg-brand-accent/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                Direct API
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-neutral-200">
                  Render and ingest stream
                </span>
                <span className="font-mono text-xs text-emerald-400">
                  100% lossless
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-yellow-400 via-brand-accent to-pink-500" />
              </div>
              <div className="flex items-center justify-between pt-1 text-xs text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5 text-white/80" aria-hidden="true" />
                  Rendered in 22s
                </span>
                <span className="font-mono text-neutral-200">
                  YouTube 4K60 ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp mount y={18} delay={0.35}>
        <div className="mt-20 border-t border-neutral-200/80 pt-8">
          <p className={`${ds.label} mb-8 text-neutral-600`}>
            Trusted by high-throughput creator networks and post-production studios
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-semibold tracking-wider text-neutral-600 sm:gap-14">
            {partners.map((partner) => (
              <span key={partner} className="transition-colors hover:text-neutral-900">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

function PipelineSection() {
  return (
    <section id="pipeline" className="overflow-hidden px-4 py-24">
      <div className="relative mx-auto max-w-5xl">
        <FadeUp>
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
              Creative intelligence and dispatch
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-neutral-600">
              Decouple high-resolution master storage from creator approvals.
              Every edit stays pristine.
            </p>
          </div>
        </FadeUp>

        <Stagger className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          <StaggerItem>
            <div className="glass-card-warm flex h-48 -rotate-1 flex-col justify-between rounded-2xl p-5 text-white shadow-xl transition-transform hover:rotate-0">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="font-mono">ProRes 422 HQ</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
                  Lossless
                </span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/70">
                  Master volume
                </div>
                <div className="text-sm font-semibold">
                  10-bit color depth verified
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-black/20">
                <div className="h-full w-3/4 bg-white/80" />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="space-y-4 md:-mt-8">
              <div className={`${ds.card} p-6 shadow-xl`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className={`${ds.label} text-neutral-500`}>
                    Fast-track node
                  </span>
                  <div className="flex h-5 w-9 items-center justify-end rounded-full bg-neutral-900 p-0.5">
                    <div className="h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-brand-accent">
                    4K
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900">
                      Auto proxy generator
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Stream ready in under 90 seconds
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card-teal flex h-40 flex-col justify-between rounded-2xl p-5 text-white shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span>Direct OAuth 2.0</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                </div>
                <p className="text-xs leading-5 text-white/90">
                  Channel credentials stay protected while editors manage delivery.
                </p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="glass-card-teal flex h-52 rotate-1 flex-col justify-between rounded-2xl p-5 text-white shadow-xl transition-transform hover:rotate-0">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="font-mono">YouTube Direct API</span>
                <span>v3 dispatch</span>
              </div>
              <div className="my-auto space-y-2">
                <div className="text-sm font-semibold">
                  Metadata and thumbnail sync
                </div>
                <p className="text-xs leading-5 text-white/80">
                  Titles, tags, chapters, and thumbnails travel with the final
                  approval state.
                </p>
              </div>
              <div className="font-mono text-[11px] text-white/60">
                Status: Connected, 24ms latency
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        <FadeUp>
          <div className="mx-auto mt-24 max-w-3xl px-4 text-center">
            <p className="text-2xl font-normal leading-snug tracking-tight text-neutral-800 sm:text-3xl md:text-[34px]">
              As video pipelines expand across remote editors and distributed
              creators, the need for a singular source of truth has never been
              more critical.{" "}
              <span className="font-semibold text-black">
                UploadRelay unifies your workflow.
              </span>
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function FoundationSection() {
  return (
    <section id="features" className="border-y border-neutral-200/70 bg-white px-4 py-16 md:py-24">
      <Stagger className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <StaggerItem>
          <div className={`${ds.softPanel} p-6 sm:p-8`}>
            <div className={`${ds.card} p-5`}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 text-xs text-neutral-400">
                <span className="font-medium text-neutral-700">
                  Project master cuts
                </span>
                <span>...</span>
              </div>
              <ul className="divide-y divide-neutral-100 text-xs">
                {fileRows.map(([ext, name, size, tone]) => (
                  <li key={name} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] ${
                          tone === "red"
                            ? "bg-red-50 text-brand-accent"
                            : tone === "green"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {ext}
                      </div>
                      <span className="truncate font-medium text-neutral-800">
                        {name}
                      </span>
                    </div>
                    <span className={`${ds.mono} shrink-0 text-neutral-400`}>
                      {size}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem y={20}>
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              The intelligent foundation for your channel.
            </h2>
            <FeatureList
              items={[
                [
                  "Centralized asset knowledge",
                  "Hold uncompressed master files, raw stems, captions, and thumbnail variants in one structured handoff.",
                ],
                [
                  "Contextual previews",
                  "Generate streamable previews for managers and talent without moving the source file.",
                ],
                [
                  "Seamless distribution",
                  "Remove the repeated download and upload loop from every approved final cut.",
                ],
              ]}
            />
          </div>
        </StaggerItem>
      </Stagger>
    </section>
  );
}

function PreviewSection() {
  return (
    <section className="px-4 py-16 md:py-24">
      <Stagger className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <StaggerItem y={20}>
          <div className="order-2 space-y-8 lg:order-1">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Generate review-ready previews in seconds.
            </h2>
            <FeatureList
              items={[
                [
                  "Automated HLS previews",
                  "Workers generate adaptive streams so reviewers can watch from ordinary browsers and networks.",
                ],
                [
                  "Timecoded decisions",
                  "The next layer is review comments, approvals, and change requests tied to the preview.",
                ],
                [
                  "Publish-ready originals",
                  "The high-quality source remains available for a direct YouTube upload after approval.",
                ],
              ]}
            />
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="order-1 flex min-h-[340px] items-center justify-center rounded-3xl bg-[#dce8f8] p-8 sm:p-12 lg:order-2">
            <div className={`${ds.card} relative w-full max-w-sm p-5 shadow-lg`}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
                Live sign-off event
              </div>
              <p className="text-sm font-medium leading-relaxed text-neutral-800">
                Creator approved Cut v4 at 04:18. Scheduling the 24.6 GB 4K
                master for YouTube publication.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-400">
                <span>Token: Auth_Relay_yt_98</span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] text-emerald-600">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </StaggerItem>
      </Stagger>
    </section>
  );
}

function FeatureList({ items }: { items: string[][] }) {
  return (
    <div className="space-y-6">
      {items.map(([title, body], index) => (
        <div
          key={title}
          className={`border-l-2 pl-4 ${
            index === 0 ? "border-brand-accent" : "border-neutral-300"
          }`}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {body}
          </p>
        </div>
      ))}
    </div>
  );
}

function UseCasesSection() {
  return (
    <section id="workflow" className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
              Built for every team.
            </h2>
            <div className="inline-flex items-center rounded-full border border-neutral-200/80 bg-neutral-100 p-1 text-xs">
              {["Strategy", "Creators", "Post Houses", "Media"].map((item, index) => (
                <button
                  key={item}
                  className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                    index === 0
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        <Stagger className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {featureCards.map((card) => (
            <StaggerItem key={card.title}>
              <article
                className={`${ds.darkCard} group relative flex h-64 flex-col justify-end overflow-hidden p-6 sm:h-72`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-tr ${card.tone} opacity-95 transition-transform duration-500 group-hover:scale-105`}
                />
                <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-brand-accent opacity-30 blur-lg" />
                <div className="relative z-10">
                  <span className={`${ds.mono} uppercase tracking-widest ${card.accent}`}>
                    {card.eyebrow}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-300">
                    {card.body}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="border-t border-neutral-200/60 bg-[#fafafa] px-4 py-24">
      <FadeUp className="mx-auto max-w-3xl text-center" y={24}>
        <blockquote className="text-2xl font-medium leading-snug tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
          &ldquo;UploadRelay was built to remove the repeated file transfer work from
          creative teams, so they can focus on sharper stories and cleaner
          launches.&rdquo;
        </blockquote>
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-accent to-amber-500 text-xs font-bold text-white">
            UR
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-neutral-900">
              UploadRelay Studio
            </div>
            <div className="text-[11px] text-neutral-500">
              Cloud handoff system
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

function UpdatesSection() {
  return (
    <section id="updates" className="border-t border-neutral-200/80 bg-white px-4 py-20 md:py-24">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Latest updates
            </h2>
            <Link
              href="/upload"
              className="text-xs font-semibold text-neutral-500 transition-colors hover:text-black"
            >
              Open upload
            </Link>
          </div>
        </FadeUp>

        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {updates.map((update) => (
            <StaggerItem key={update.title}>
              <article
                className="group rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4 shadow-sm transition-all hover:border-neutral-300"
              >
                <div className={`flex h-44 items-center justify-center rounded-xl bg-gradient-to-br ${update.tone} p-4`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white backdrop-blur-md">
                    {update.visual}
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`${ds.mono} text-neutral-400`}>
                    {update.type} / {update.date}
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-neutral-900 transition-colors group-hover:text-brand-accent">
                    {update.title}
                  </h3>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-[#fafafa] px-4 py-24 text-center">
      <FadeUp className="mx-auto max-w-3xl space-y-6" y={24}>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-xs text-neutral-600 shadow-sm">
          <Sparkles className="size-4" aria-hidden="true" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
          Experience the future of video publishing
        </h2>
        <p className="mx-auto max-w-md text-sm leading-6 text-neutral-500">
          Start with the working upload backbone, then layer review, approval,
          and YouTube publishing on top.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link href="/auth?mode=signup" className={ds.primaryButton}>
            Experience Relay
          </Link>
          <Link href="/upload" className={ds.secondaryButton}>
            Open upload
          </Link>
        </div>
      </FadeUp>
    </section>
  );
}

function Footer() {
  return (
    <FadeUp className="px-4 pb-6 pt-2" y={16}>
      <div className="mx-auto max-w-6xl rounded-3xl bg-brand-black px-8 py-14 text-neutral-400 md:py-16">
        <div className="grid grid-cols-1 gap-10 border-b border-neutral-800 pb-12 text-xs md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                R
              </span>
              <span className="text-sm font-bold tracking-tight text-white">
                UploadRelay
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
              The operating system for modern creator handoffs. Upload once,
              review lightly, and publish with control.
            </p>
            <div className="flex items-center gap-3 pt-2 text-neutral-500">
              <Share2 className="size-4" aria-hidden="true" />
              <Globe2 className="size-4" aria-hidden="true" />
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
          </div>

          <FooterColumn title="Product" items={["Platform", "Preview", "Studio", "Integrations"]} />
          <FooterColumn title="Company" items={["About", "Roadmap", "Newsroom", "Contact"]} />
          <FooterColumn title="Resources" items={["Docs", "API", "Support", "Status"]} />
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[11px] text-neutral-500 sm:flex-row">
          <div>Copyright 2026 UploadRelay. All rights reserved.</div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a className="transition-colors hover:text-neutral-300" href="#">
              Privacy
            </a>
            <a className="transition-colors hover:text-neutral-300" href="#">
              Terms
            </a>
            <a className="transition-colors hover:text-neutral-300" href="#">
              YouTube API Terms
            </a>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white">
        {title}
      </div>
      <ul className="space-y-2 text-neutral-400">
        {items.map((item) => (
          <li key={item}>
            <a className="transition-colors hover:text-white" href="#">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

