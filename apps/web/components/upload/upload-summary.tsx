import { formatBytes } from "@/lib/upload/format-bytes";

type UploadSummaryProps = {
  file: File;
};

export function UploadSummary({ file }: UploadSummaryProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-950">
            {file.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {file.type || "Unknown video type"}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-neutral-950/[0.06] px-2.5 py-1.5 font-mono text-[11px] font-medium text-neutral-950">
          {formatBytes(file.size)}
        </div>
      </div>
    </div>
  );
}
