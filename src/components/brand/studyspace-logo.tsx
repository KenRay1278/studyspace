import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

type StudySpaceLogoProps = {
  className?: string;
  compact?: boolean;
  iconClassName?: string;
};

export function StudySpaceLogo({
  className,
  compact = false,
  iconClassName,
}: StudySpaceLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          iconClassName,
        )}
      >
        <BookOpen aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block font-semibold">StudySpace</span>
          <span className="block text-xs text-muted-foreground">
            Contribution ledger
          </span>
        </span>
      )}
    </div>
  );
}
