const STATUS_META: Record<
  string,
  { label: string; chip: string; dot: string; pulse?: boolean }
> = {
  UPLOADING: {
    label: "Uploading",
    chip: "border-background-200 bg-background-200/60 text-text-700",
    dot: "bg-neutral-400",
    pulse: true,
  },
  UPLOADED: {
    label: "In storage",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  UPLOAD_ABORTED: {
    label: "Aborted",
    chip: "border-background-200 bg-background-200/60 text-text-600",
    dot: "bg-neutral-400",
  },
  TRANSCODING: {
    label: "Transcoding",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    pulse: true,
  },
  PREVIEW_READY: {
    label: "Preview ready",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  TRANSCODE_FAILED: {
    label: "Transcode failed",
    chip: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  APPROVAL_REQUESTED: {
    label: "Approval requested",
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    pulse: true,
  },
  APPROVED: {
    label: "Approved",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    chip: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  PUBLISHING: {
    label: "Publishing",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    pulse: true,
  },
  PUBLISHED: {
    label: "Published",
    chip: "border-emerald-200 bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-600",
  },
  PUBLISH_FAILED: {
    label: "Publish failed",
    chip: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

export function videoStatusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status.replaceAll("_", " "),
      chip: "border-background-200 bg-background-200/60 text-text-700",
      dot: "bg-neutral-400",
    }
  );
}

export function formatBytes(bytes: number | null) {
  if (bytes == null || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function fileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index === -1) {
    return "FILE";
  }
  return fileName.slice(index + 1).toUpperCase();
}

export function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.slice(0, 2).toUpperCase();
}