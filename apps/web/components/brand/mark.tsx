import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md";
  className?: string;
};

export function BrandMark({
  href,
  variant = "light",
  size = "md",
  className,
}: BrandMarkProps) {
  const dark = variant === "dark";
  const compact = size === "sm";

  const mark = (
    <span
      className={cn(
        "group inline-flex items-center gap-2.5",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-extrabold shadow-sm transition-transform group-hover:scale-105",
          compact ? "h-7 w-7" : "h-8 w-8",
          dark ? "bg-white text-black" : "bg-[#0d0f11] text-white",
        )}
      >
        <Play
          className={cn(compact ? "size-3.5" : "size-4", "fill-current")}
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 font-semibold tracking-tight",
          compact ? "text-sm" : "text-base",
          dark ? "text-white" : "text-neutral-950",
        )}
      >
        UploadRelay
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent" />
      </span>
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link href={href} aria-label="UploadRelay home" className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60">
      {mark}
    </Link>
  );
}
