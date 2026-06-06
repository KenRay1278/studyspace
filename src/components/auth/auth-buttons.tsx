"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthButtons({ nextPath = "/" }: { nextPath?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
  }

  return (
    <Button
      className="h-11 w-full max-w-sm"
      disabled={isLoading}
      onClick={signInWithGoogle}
    >
      <LogIn aria-hidden="true" />
      {isLoading ? "Opening Google..." : "Continue with Google"}
    </Button>
  );
}
