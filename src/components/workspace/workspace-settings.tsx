"use client";

import { useState } from "react";
import { Loader2, LogOut, Settings2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Workspace, WorkspaceRole } from "@/lib/types";

type WorkspaceSettingsProps = {
  currentUserRole: WorkspaceRole;
  workspace: Workspace;
};

export function WorkspaceSettings({
  currentUserRole,
  workspace,
}: WorkspaceSettingsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwner = currentUserRole === "owner";

  async function leaveWorkspace() {
    setIsLeaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: leaveError } = await supabase.rpc("leave_workspace", {
      p_workspace_id: workspace.id,
    });

    setIsLeaving(false);

    if (leaveError) {
      setError(leaveError.message);
      setIsLeaveOpen(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function deleteWorkspace() {
    setIsDeleting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: deleteError } = await supabase.rpc("delete_workspace", {
      p_confirmation_name: deleteConfirmation,
      p_workspace_id: workspace.id,
    });

    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleteOpen(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Button
        aria-label="Project settings"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        size="sm"
        title="Project settings"
        variant="outline"
      >
        <Settings2 aria-hidden="true" />
        Settings
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg border bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                Project settings
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your access and permanent workspace actions.
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-y py-5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Workspace</dt>
                <dd className="mt-1 font-medium">{workspace.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Your role</dt>
                <dd className="mt-1 font-medium">
                  {roleLabel(currentUserRole)}
                </dd>
              </div>
            </dl>

            {error ? (
              <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <section className="mt-6">
              <h3 className="text-sm font-medium">Membership</h3>
              <div className="mt-3 flex items-center justify-between gap-5 rounded-md border px-4 py-4">
                <div>
                  <p className="text-sm font-medium">Leave workspace</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {isOwner
                      ? "Transfer ownership in Members before leaving."
                      : "Remove your access while preserving verified records."}
                  </p>
                </div>
                <Button
                  disabled={isOwner}
                  onClick={() => setIsLeaveOpen(true)}
                  variant="outline"
                >
                  <LogOut aria-hidden="true" />
                  Leave
                </Button>
              </div>
            </section>

            {isOwner ? (
              <section className="mt-6 border-t border-destructive/20 pt-5">
                <h3 className="text-sm font-medium text-destructive">
                  Danger zone
                </h3>
                <div className="mt-3 flex items-center justify-between gap-5 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4">
                  <div>
                    <p className="text-sm font-medium">Delete workspace</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Permanently remove tasks, votes, and contribution data.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setDeleteConfirmation("");
                      setIsDeleteOpen(true);
                    }}
                    variant="destructive"
                  >
                    <Trash2 aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </section>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isLeaveOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold tracking-normal">
              Leave workspace?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You will lose access to{" "}
              <strong className="text-foreground">{workspace.name}</strong>.
              Verified contribution records remain in the ledger.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={isLeaving}
                onClick={() => setIsLeaveOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={isLeaving}
                onClick={leaveWorkspace}
                variant="destructive"
              >
                {isLeaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <LogOut />
                )}
                Leave workspace
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold tracking-normal">
              Delete workspace?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This cannot be undone. Enter{" "}
              <strong className="text-foreground">{workspace.name}</strong> to
              confirm.
            </p>
            <input
              className="mt-5 h-10 w-full rounded-md border px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={workspace.name}
              value={deleteConfirmation}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                disabled={isDeleting}
                onClick={() => setIsDeleteOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  isDeleting || deleteConfirmation.trim() !== workspace.name
                }
                onClick={deleteWorkspace}
                variant="destructive"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
