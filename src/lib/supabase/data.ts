import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  LedgerEntry,
  Profile,
  Task,
  TaskVote,
  Workspace,
  WorkspaceMember,
  WorkspaceMembership,
} from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function getDashboardData(user: {
  id: string;
  user_metadata: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const metadata = user.user_metadata;
  const fullName = metadata.full_name ?? metadata.name;
  const avatarUrl = metadata.avatar_url ?? metadata.picture;

  await supabase
    .from("profiles")
    .update({
      avatar_url: typeof avatarUrl === "string" ? avatarUrl : null,
      full_name: typeof fullName === "string" ? fullName : null,
    })
    .eq("id", user.id);

  const [{ data: workspaces }, { data: memberships }, { data: profile }] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("workspace_members")
        .select("workspace_id,user_id,role")
        .eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

  return {
    profile: profile as Profile | null,
    workspaces: (workspaces ?? []) as Workspace[],
    memberships: (memberships ?? []) as WorkspaceMembership[],
  };
}

export async function getWorkspaceBundle(workspaceId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const metadata = user.user_metadata;
  const fullName = metadata.full_name ?? metadata.name;
  const avatarUrl = metadata.avatar_url ?? metadata.picture;

  await supabase
    .from("profiles")
    .update({
      avatar_url: typeof avatarUrl === "string" ? avatarUrl : null,
      full_name: typeof fullName === "string" ? fullName : null,
    })
    .eq("id", user.id);

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (!workspace) {
    notFound();
  }

  const [{ data: members }, { data: tasks }, { data: ledger }] =
    await Promise.all([
      supabase
        .from("workspace_members")
        .select("workspace_id,user_id,role,joined_at,profiles(id,full_name,avatar_url)")
        .eq("workspace_id", workspaceId)
        .order("joined_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("task_number", { ascending: true }),
      supabase
        .from("verified_ledger")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("verified_at", { ascending: true }),
    ]);

  const taskIds = (tasks ?? []).map((task) => task.id);
  const { data: votes } = taskIds.length
    ? await supabase.from("task_votes").select("*").in("task_id", taskIds)
    : { data: [] };

  const normalizedMembers = (members ?? []).map((member) => ({
    ...member,
    profiles: Array.isArray(member.profiles)
      ? (member.profiles[0] ?? null)
      : member.profiles,
  })) as WorkspaceMember[];

  const membership = normalizedMembers.find(
    (member) => member.user_id === user.id,
  );

  return {
    user,
    workspace: workspace as Workspace,
    members: normalizedMembers,
    membership,
    tasks: (tasks ?? []) as Task[],
    votes: (votes ?? []) as TaskVote[],
    ledger: (ledger ?? []) as LedgerEntry[],
  };
}
