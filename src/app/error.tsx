"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#efeee8] px-6">
      <div className="w-full max-w-lg rounded-lg border bg-white p-6 shadow-sm">
        <AlertTriangle aria-hidden="true" className="size-8 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold tracking-normal">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error.message || "StudySpace could not load this screen."}
        </p>
        <Button className="mt-5" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </div>
    </main>
  );
}
