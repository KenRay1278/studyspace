"use client";

import { useState } from "react";

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
      className="h-11 w-full bg-white text-foreground shadow-sm ring-1 ring-border hover:bg-secondary"
      disabled={isLoading}
      onClick={signInWithGoogle}
    >
      <GoogleIcon />
      {isLoading ? "Opening Google..." : "Continue with Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.877 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.963 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.708V4.96H.956A9 9 0 0 0 0 9c0 1.45.347 2.824.956 4.04l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.578c1.322 0 2.508.454 3.441 1.346l2.581-2.582C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.96l3.007 2.332C4.672 5.163 6.656 3.578 9 3.578Z"
        fill="#EA4335"
      />
    </svg>
  );
}
