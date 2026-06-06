import { ContributionsView } from "@/components/workspace/contributions-view";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getWorkspaceBundle } from "@/lib/supabase/data";

type ContributionsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function ContributionsPage({
  params,
}: ContributionsPageProps) {
  const { workspaceId } = await params;
  const bundle = await getWorkspaceBundle(workspaceId);

  return (
    <WorkspaceShell
      active="contributions"
      currentUserId={bundle.user.id}
      members={bundle.members}
      workspace={bundle.workspace}
    >
      <ContributionsView
        ledger={bundle.ledger}
        members={bundle.members}
        workspaceId={bundle.workspace.id}
      />
    </WorkspaceShell>
  );
}
