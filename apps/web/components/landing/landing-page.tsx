import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  FileVideo,
  FolderKanban,
  LockKeyhole,
  MessageSquareText,
  PlayCircle,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

const platformCards = [
  {
    title: "File delivery",
    description:
      "Editors upload final exports directly to cloud storage with multipart upload.",
    icon: CloudUpload,
  },
  {
    title: "Review and approval",
    description:
      "Creators review a lightweight preview, check metadata, and approve the final version.",
    icon: MessageSquareText,
  },
  {
    title: "Publishing handoff",
    description:
      "Approved originals are queued for YouTube publishing without a creator-side reupload.",
    icon: Send,
  },
];

const workflowRows = [
  ["Upload", "Editor sends the original video to S3", "Complete"],
  ["Preview", "Worker prepares a review-friendly version", "Planned"],
  ["Approval", "Creator signs off on video and metadata", "Planned"],
  ["Publish", "Cloud sends original to YouTube private draft", "Planned"],
];

const reviewComments = [
  ["00:34", "Trim the pause before the hook."],
  ["03:12", "Thumbnail frame works. Use this version."],
  ["08:47", "Approved for private draft upload."],
];

const sections = [
  {
    eyebrow: "Workflow management",
    title: "Keep the handoff moving after the edit is done.",
    description:
      "UploadRelay gives creator teams one place to see what is uploaded, what needs review, what changed, and what is ready to publish.",
    bullets: [
      "Version status for every delivery",
      "Creator approval before publishing",
      "Clear next step for editor and creator",
    ],
    visual: "workspace",
  },
  {
    eyebrow: "Review and approval",
    title: "Review the preview without moving the original file.",
    description:
      "The creator does not need a fast connection to make a publishing decision. They review an optimized version while the source file stays ready in cloud storage.",
    bullets: [
      "Preview-first creator review",
      "Timestamped feedback model",
      "Approval trail for every version",
    ],
    visual: "review",
  },
  {
    eyebrow: "Cloud publishing",
    title: "Publish from infrastructure, not from a laptop.",
    description:
      "After approval, a background worker can use the creator's connected account to upload the original file to YouTube as a private draft.",
    bullets: [
      "Creator-controlled OAuth connection",
      "Original quality file preserved",
      "Worker-ready publishing pipeline",
    ],
    visual: "publish",
  },
];

export function LandingPage() {
  return (
    <main className="bg-background-50 text-text-950">
      <Header />
      <Hero />
      <PlatformIntro />
      <FeatureSections />
      <Metrics />
      <Roadmap />
      <FooterCta />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-background-200 bg-background-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="text-base font-semibold tracking-tight">
          UploadRelay
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-text-800 md:flex">
          <a href="#platform" className="transition hover:text-text-950">
            Platform
          </a>
          <a href="#workflow" className="transition hover:text-text-950">
            Workflow
          </a>
          <a href="#roadmap" className="transition hover:text-text-950">
            Roadmap
          </a>
        </nav>
        <a
          href="/upload"
          className="inline-flex h-9 items-center rounded-md bg-primary-700 px-4 text-sm font-semibold text-text-50 transition hover:bg-primary-800"
        >
          Open upload
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="border-b border-background-200">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-20 sm:px-8 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-800">
            Cloud review and publishing for creator teams
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
            One platform for the final video handoff.
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-text-800 sm:text-xl">
            Editors upload the original once. Creators review a lightweight
            preview. Approved videos move from cloud storage to YouTube without
            the creator downloading or reuploading the file.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/upload"
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary-700 px-5 text-sm font-semibold text-text-50 transition hover:bg-primary-800"
            >
              Test multipart upload
            </a>
            <a
              href="#platform"
              className="inline-flex h-12 items-center justify-center rounded-md border border-background-300 bg-background-50 px-5 text-sm font-semibold text-text-950 transition hover:bg-background-100"
            >
              Explore platform
            </a>
          </div>
        </div>

        <div className="mt-16">
          <ProductShell />
        </div>
      </div>
    </section>
  );
}

function ProductShell() {
  return (
    <div className="mx-auto max-w-6xl rounded-lg border border-background-200 bg-background-100 p-3 shadow-2xl shadow-primary-50/20">
      <div className="overflow-hidden rounded-md border border-background-200 bg-background-50">
        <div className="grid border-b border-background-200 lg:grid-cols-[220px_1fr_300px]">
          <aside className="hidden border-r border-background-200 bg-background-100 p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-700">
              Workspace
            </p>
            <div className="mt-5 space-y-2">
              {["Inbox", "Ready for review", "Approved", "Publishing"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`rounded-md px-3 py-2 text-sm ${
                      index === 1
                        ? "bg-primary-700 text-text-50"
                        : "text-text-800"
                    }`}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </aside>

          <div className="p-4">
            <div className="flex flex-col justify-between gap-4 border-b border-background-200 pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Launch video final</p>
                <p className="mt-1 text-xs text-text-700">
                  Original: 8.4 GB · Preview: 720p
                </p>
              </div>
              <span className="w-fit rounded-md bg-accent-700/10 px-2.5 py-1 text-xs font-semibold text-accent-900">
                Waiting for approval
              </span>
            </div>

            <div className="mt-4 aspect-video rounded-md border border-background-200 bg-background-100 p-3">
              <div className="flex h-full items-center justify-center rounded border border-background-200 bg-background-50">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary-700 text-text-50">
                  <PlayCircle className="size-8" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Title", "Summer launch story"],
                ["Visibility", "Private draft"],
                ["Thumbnail", "Selected"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-background-200 bg-background-100 p-3"
                >
                  <p className="text-xs font-medium text-text-700">{label}</p>
                  <p className="mt-2 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t border-background-200 bg-background-100 p-4 lg:border-l lg:border-t-0">
            <p className="text-sm font-semibold">Review notes</p>
            <div className="mt-4 space-y-3">
              {reviewComments.map(([time, comment]) => (
                <div
                  key={time}
                  className="rounded-md border border-background-200 bg-background-50 p-3"
                >
                  <p className="text-xs font-semibold text-accent-900">
                    {time}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-text-800">
                    {comment}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PlatformIntro() {
  return (
    <section id="platform" className="border-b border-background-200 bg-background-100 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
              The UploadRelay platform
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything after export, before publish.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-text-800">
            The product is deliberately focused: move the final file, collect
            approval, and publish only when the creator decides. No editor needs
            channel access. No creator needs to reupload a giant video.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {platformCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-lg border border-background-200 bg-background-50 p-5"
              >
                <div className="flex size-11 items-center justify-center rounded-md bg-primary-700 text-text-50">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-800">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureSections() {
  return (
    <div id="workflow">
      {sections.map((section, index) => (
        <section
          key={section.title}
          className={`border-b border-background-200 py-24 ${
            index % 2 === 0 ? "bg-background-50" : "bg-background-100"
          }`}
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div className={index % 2 === 1 ? "lg:order-2" : ""}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
                {section.eyebrow}
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                {section.title}
              </h2>
              <p className="mt-5 text-lg leading-8 text-text-800">
                {section.description}
              </p>
              <div className="mt-8 space-y-3">
                {section.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-3">
                    <CheckCircle2
                      className="size-5 text-accent-800"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-text-900">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <FeatureVisual kind={section.visual} />
          </div>
        </section>
      ))}
    </div>
  );
}

function FeatureVisual({ kind }: { kind: string }) {
  if (kind === "review") {
    return (
      <div className="rounded-lg border border-background-200 bg-background-50 p-4 shadow-xl shadow-primary-50/10">
        <div className="rounded-md border border-background-200 bg-background-100 p-4">
          <div className="aspect-video rounded border border-background-200 bg-background-50" />
          <div className="mt-4 space-y-3">
            {reviewComments.map(([time, comment]) => (
              <div key={time} className="flex gap-3 rounded-md bg-background-50 p-3">
                <span className="text-xs font-semibold text-accent-900">
                  {time}
                </span>
                <p className="text-sm text-text-800">{comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "publish") {
    const publishItems = [
      {
        title: "Original file",
        subtitle: "Stored in S3",
        icon: FileVideo,
      },
      {
        title: "Creator token",
        subtitle: "OAuth connection",
        icon: LockKeyhole,
      },
      {
        title: "Publish job",
        subtitle: "Private YouTube draft",
        icon: Send,
      },
    ];

    return (
      <div className="rounded-lg border border-background-200 bg-background-50 p-5 shadow-xl shadow-primary-50/10">
        <div className="grid gap-4">
          {publishItems.map((item) => {
            const Icon = item.icon;

            return (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-md border border-background-200 bg-background-100 p-4"
            >
              <div className="flex size-10 items-center justify-center rounded-md bg-primary-700 text-text-50">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-text-700">{item.subtitle}</p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-4 shadow-xl shadow-primary-50/10">
      <div className="rounded-md border border-background-200 bg-background-100">
        <div className="border-b border-background-200 p-4">
          <p className="text-sm font-semibold">Project queue</p>
        </div>
        <div className="divide-y divide-background-200">
          {workflowRows.map(([stage, detail, status]) => (
            <div
              key={stage}
              className="grid grid-cols-[0.8fr_1.3fr_0.8fr] gap-4 p-4"
            >
              <span className="text-sm font-medium">{stage}</span>
              <span className="text-sm text-text-800">{detail}</span>
              <span className="text-sm text-accent-900">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metrics() {
  return (
    <section className="border-b border-background-200 bg-background-100 py-20">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:px-8 md:grid-cols-3">
        {[
          ["1 upload", "The editor sends the final file once."],
          ["0 reuploads", "The creator never handles the original locally."],
          ["Private draft", "YouTube upload works for an unverified project."],
        ].map(([value, label]) => (
          <div
            key={value}
            className="rounded-lg border border-background-200 bg-background-50 p-6"
          >
            <p className="text-4xl font-semibold tracking-tight">{value}</p>
            <p className="mt-3 text-sm leading-6 text-text-800">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section id="roadmap" className="border-b border-background-200 bg-background-50 py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-800">
            MVP roadmap
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            A focused build path for the complete relay.
          </h2>
        </div>
        <div className="space-y-3">
          {[
            ["Now", "Multipart upload to S3"],
            ["Next", "Preview generation with FFmpeg worker"],
            ["Then", "Review page with comments and approval"],
            ["Finally", "Publish original to YouTube private draft"],
          ].map(([time, item]) => (
            <div
              key={item}
              className="grid grid-cols-[80px_1fr] rounded-lg border border-background-200 bg-background-100 p-4"
            >
              <span className="text-sm font-semibold text-accent-900">
                {time}
              </span>
              <span className="text-sm font-medium text-text-900">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCta() {
  return (
    <section className="bg-background-100 px-5 py-16 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent-800">
            <UserCheck className="size-4" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">
              Creator-controlled delivery
            </p>
          </div>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight">
            Let the cloud move the original. Let the creator make the call.
          </h2>
        </div>
        <a
          href="/upload"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary-700 px-5 text-sm font-semibold text-text-50 transition hover:bg-primary-800"
        >
          Open upload
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
