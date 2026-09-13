import { Badge } from "@/components/ui/badge";
import { videoStatusMeta } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const meta = videoStatusMeta(status);

  return (
    <Badge variant="outline" className={cn("font-medium", meta.chip)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.dot,
          meta.pulse && "animate-pulse",
        )}
      />
      {meta.label}
    </Badge>
  );
}
