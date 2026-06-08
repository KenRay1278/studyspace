import { ProofOfWorkView } from "@/components/workspace/proof-of-work-view";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getWorkspaceBundle } from "@/lib/supabase/data";

type ProofOfWorkPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function ProofOfWorkPage({ params }: ProofOfWorkPageProps) {
  const { workspaceId } = await params;
  const bundle = await getWorkspaceBundle(workspaceId);
  const generatedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <WorkspaceShell
      active="proof"
      currentUserId={bundle.user.id}
      members={bundle.members}
      workspace={bundle.workspace}
    >
      <ProofOfWorkView
        generatedAt={generatedAt}
        ledger={bundle.ledger}
        members={bundle.members}
        workspace={bundle.workspace}
      />
    </WorkspaceShell>
  );
}
