import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JoinPageProps = {
  params: Promise<{
    inviteCode: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { inviteCode } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(`/?join=${encodeURIComponent(inviteCode)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_workspace_by_invite", {
    p_invite_code: inviteCode,
  });

  if (error || !data) {
    redirect(`/?join=${encodeURIComponent(inviteCode)}`);
  }

  redirect(`/workspaces/${data}/tasks`);
}
