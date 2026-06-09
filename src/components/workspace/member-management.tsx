"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { displayName, roleLabel } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Workspace, WorkspaceMember, WorkspaceRole } from "@/lib/types";

type MemberManagementProps = {
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  members: WorkspaceMember[];
  workspace: Workspace;
};

const roleOptions: WorkspaceRole[] = ["editor", "member"];

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
  const [transferTarget, setTransferTarget] =
    useState<WorkspaceMember | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
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

  async function transferOwnership() {
    if (!transferTarget) return;

    setIsTransferring(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: transferError } = await supabase.rpc(
      "transfer_workspace_ownership",
      {
        p_new_owner_id: transferTarget.user_id,
        p_workspace_id: workspace.id,
      },
    );

    setIsTransferring(false);

    if (transferError) {
      setError(transferError.message);
      setTransferTarget(null);
      return;
    }

    setTransferTarget(null);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        <Users aria-hidden="true" />
        Members
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-8 backdrop-blur-sm">
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
                {copied ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy invite"}
              </Button>
            </div>

            <div className="mt-5 overflow-hidden rounded-md border bg-secondary/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Invite link: </span>
              <span className="break-all font-mono">{inviteLink}</span>
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
                const isCurrentOwner = member.user_id === workspace.owner_id;

                return (
                  <div
                    className="grid grid-cols-[1fr_250px] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                    key={member.user_id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        className="size-9"
                        profile={member.profiles}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.user_id === currentUserId ? "You" : "Member"}
                        </p>
                      </div>
                    </div>

                    {canManageRoles ? (
                      isCurrentOwner ? (
                        <span className="ml-auto flex w-fit items-center gap-2 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                          <Crown aria-hidden="true" className="size-3.5" />
                          Owner
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {isBusy ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : null}
                          <select
                            className="h-9 min-w-24 rounded-md border bg-white px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                          <Button
                            onClick={() => setTransferTarget(member)}
                            size="sm"
                            variant="outline"
                          >
                            <Crown aria-hidden="true" />
                            Transfer
                          </Button>
                        </div>
                      )
                    ) : (
                      <span className="ml-auto w-fit rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
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

      {transferTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold tracking-normal">
              Transfer ownership?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {displayName(transferTarget.profiles)} will become the only owner.
              Your role will change to editor.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={isTransferring}
                onClick={() => setTransferTarget(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isTransferring} onClick={transferOwnership}>
                {isTransferring ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Crown />
                )}
                Transfer ownership
              </Button>
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}
