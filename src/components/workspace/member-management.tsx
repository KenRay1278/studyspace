"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { displayName, initials, roleLabel } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/lib/types";

type MemberManagementProps = {
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  members: WorkspaceMember[];
  workspace: Workspace;
};

const roleOptions: WorkspaceRole[] = ["owner", "editor", "member"];

export function MemberManagement({
  currentUserId,
  currentUserRole,
  members,
  workspace,
}: MemberManagementProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManageRoles = currentUserRole === "owner";

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return `/join/${workspace.invite_code}`;
    return `${window.location.origin}/join/${workspace.invite_code}`;
  }, [workspace.invite_code]);

  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function updateRole(userId: string, role: WorkspaceRole) {
    setBusyMemberId(userId);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.rpc("update_member_role", {
      p_role: role,
      p_user_id: userId,
      p_workspace_id: workspace.id,
    });

    setBusyMemberId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        <Users aria-hidden="true" />
        Members
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold tracking-normal">
                  Members
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invite teammates and manage workspace roles.
                </p>
              </div>
              <Button variant="outline" onClick={copyInviteLink}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? "Copied" : "Copy invite"}
              </Button>
            </div>

            <div className="mt-5 rounded-md border bg-secondary/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Invite link: </span>
              <span className="font-mono">{inviteLink}</span>
            </div>

            {error ? (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-lg border">
              {members.map((member) => {
                const name = displayName(member.profiles);
                const isBusy = busyMemberId === member.user_id;

                return (
                  <div
                    className="grid grid-cols-[1fr_190px] items-center border-b px-4 py-3 last:border-b-0"
                    key={member.user_id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                        {initials(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.user_id === currentUserId ? "You" : "Member"}
                        </p>
                      </div>
                    </div>

                    {canManageRoles ? (
                      <div className="flex items-center gap-2">
                        {isBusy ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : null}
                        <select
                          className="h-9 w-full rounded-md border bg-white px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                          disabled={isBusy}
                          onChange={(event) =>
                            updateRole(
                              member.user_id,
                              event.target.value as WorkspaceRole,
                            )
                          }
                          value={member.role}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {roleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="w-fit rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                        {roleLabel(member.role)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
