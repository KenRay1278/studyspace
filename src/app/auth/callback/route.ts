import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    if (user) {
      const metadata = user.user_metadata;
      await supabase
        .from("profiles")
        .update({
          avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
          full_name: metadata.full_name ?? metadata.name ?? null,
        })
        .eq("id", user.id);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
