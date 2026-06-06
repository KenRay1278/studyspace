"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Loader2, LogIn, Plus, Search } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { displayName, roleLabel } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  Profile,
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
} from "@/lib/types";

type ProjectDashboardProps = {
  profile: Profile | null;
  workspaces: Workspace[];
  memberships: WorkspaceMembership[];
};

export function ProjectDashboard({
  profile,
  workspaces,
  memberships,
}: ProjectDashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const roleByWorkspace = new Map(
    memberships.map((membership) => [
      membership.workspace_id,
      membership.role,
    ]),
  );

  const filteredWorkspaces = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return workspaces.filter((workspace) => {
      return (
        workspace.name.toLowerCase().includes(lowerQuery) ||
        workspace.description?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [query, workspaces]);

  async function createProject() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setIsSaving(false);
      setError("Your browser session expired. Please sign in again.");
      return;
    }

    const { data, error: createError } = await supabase.rpc(
      "create_workspace",
      {
        p_description: description.trim() || null,
        p_name: name.trim(),
      },
    );

    setIsSaving(false);

    if (createError) {
      setError(createError.message);
      return;
    }

    setIsModalOpen(false);
    setName("");
    setDescription("");
    router.push(`/workspaces/${data.id}/tasks`);
    router.refresh();
  }

  async function joinProject() {
    if (!inviteCode.trim()) {
      setJoinError("Invite code or link is required.");
      return;
    }

    const normalizedCode =
      inviteCode
        .trim()
        .split("/")
        .filter(Boolean)
        .at(-1) ?? inviteCode.trim();

    setIsJoining(true);
    setJoinError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error: joinProjectError } = await supabase.rpc(
      "join_workspace_by_invite",
      {
        p_invite_code: normalizedCode,
      },
    );

    setIsJoining(false);

    if (joinProjectError) {
      setJoinError(joinProjectError.message);
      return;
    }

    setIsJoinModalOpen(false);
    setInviteCode("");
    router.push(`/workspaces/${data}/tasks`);
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-[#efeee8]">
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r bg-white">
          <div className="flex items-center gap-3 border-b px-5 py-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              SS
            </div>
            <div>
              <p className="font-semibold">StudySpace</p>
              <p className="text-xs text-muted-foreground">
                Contribution ledger
              </p>
            </div>
          </div>

          <nav className="space-y-2 px-3 py-5 text-sm">
            <p className="px-3 text-xs font-medium text-muted-foreground">
              Workspace
            </p>
            <div className="rounded-md bg-secondary px-3 py-2 font-medium">
              Projects
            </div>
          </nav>

          <div className="mt-auto flex items-center gap-3 border-t px-4 py-4">
            <UserAvatar className="size-9" profile={profile} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {displayName(profile)}
              </p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-10 py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">
                Projects
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a workspace or create a new academic project.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="h-10 w-72 rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects..."
                  value={query}
                />
              </label>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus aria-hidden="true" />
                New project
              </Button>
              <Button variant="outline" onClick={() => setIsJoinModalOpen(true)}>
                <LogIn aria-hidden="true" />
                Join
              </Button>
            </div>
          </div>

          {workspaces.length === 0 ? (
            <EmptyProjects onCreate={() => setIsModalOpen(true)} />
          ) : (
            <div className="mt-10 overflow-x-auto rounded-lg border bg-white">
              <div className="grid min-w-[900px] grid-cols-[1fr_160px_180px] border-b px-6 py-3 text-xs font-medium text-muted-foreground">
                <span>Name</span>
                <span>Role</span>
                <span>Created</span>
              </div>

              {filteredWorkspaces.map((workspace) => {
                const role =
                  roleByWorkspace.get(workspace.id) ?? ("member" as WorkspaceRole);

                return (
                  <Link
                    className="grid min-w-[900px] grid-cols-[1fr_160px_180px] items-center border-b px-6 py-5 transition hover:bg-secondary/60 last:border-b-0"
                    href={`/workspaces/${workspace.id}/tasks`}
                    key={workspace.id}
                  >
                    <div className="flex items-center gap-4">
                      <Folder aria-hidden="true" className="size-9" />
                      <div>
                        <p className="font-medium">{workspace.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workspace.description || "No description yet"}
                        </p>
                      </div>
                    </div>
                    <span className="w-fit rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                      {roleLabel(role)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(workspace.created_at))}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                Create project
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start a shared workspace for one academic group project.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Project name</span>
                <input
                  className="h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Software Engineering"
                  value={name}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="min-h-24 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="CS Global Program group project"
                  value={description}
                />
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isSaving} onClick={createProject}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Plus />}
                Create
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isJoinModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                Join project
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste a StudySpace invite code or invite link from a teammate.
              </p>
            </div>

            <label className="mt-6 block space-y-2">
              <span className="text-sm font-medium">Invite code or link</span>
              <input
                className="h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ABC123DEF456 or your StudySpace invite link"
                value={inviteCode}
              />
            </label>

            {joinError ? (
              <p className="mt-4 text-sm text-destructive">{joinError}</p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={isJoining}
                onClick={() => setIsJoinModalOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isJoining} onClick={joinProject}>
                {isJoining ? <Loader2 className="animate-spin" /> : <LogIn />}
                Join
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-10 flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 text-center">
      <Folder aria-hidden="true" className="size-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold tracking-normal">
        No projects yet
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Create the first workspace to invite members, define weighted tasks, and
        start tracking verified contribution.
      </p>
      <Button className="mt-5" onClick={onCreate}>
        <Plus aria-hidden="true" />
        New project
      </Button>
    </div>
  );
}
