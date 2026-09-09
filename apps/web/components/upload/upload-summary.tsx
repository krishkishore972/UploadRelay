type UploadSummaryProps = {
  file: File;
};

export function UploadSummary({ file }: UploadSummaryProps) {
  return (
<div className="rounded-2xl border border-background-200 bg-background-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-950">
            {file.name}
          </p>
          <p className="mt-1 text-sm text-text-600">
            {file.type || "Unknown video type"}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-primary-700/10 px-3 py-1.5 font-mono text-[11px] font-medium text-primary-700">
          {formatBytes(file.size)}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];

  if (bytes === 0) {
    return "0 B";
  }

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
