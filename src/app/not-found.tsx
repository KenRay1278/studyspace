import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#efeee8] px-6">
      <div className="w-full max-w-lg rounded-lg border bg-white p-6 text-center shadow-sm">
        <SearchX aria-hidden="true" className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold tracking-normal">
          Workspace not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          You may not have access to this workspace, or the invite may be wrong.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    </main>
  );
}
