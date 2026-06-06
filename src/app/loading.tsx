import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#efeee8]">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 text-sm text-muted-foreground shadow-sm">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Loading StudySpace...
      </div>
    </main>
  );
}
