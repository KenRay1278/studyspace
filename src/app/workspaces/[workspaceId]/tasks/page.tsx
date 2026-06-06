import { TaskBoardClient } from "@/components/workspace/task-board-client";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getWorkspaceBundle } from "@/lib/supabase/data";

type TaskBoardPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function TaskBoardPage({ params }: TaskBoardPageProps) {
  const { workspaceId } = await params;
  const bundle = await getWorkspaceBundle(workspaceId);

  return (
    <WorkspaceShell
      active="tasks"
      currentUserId={bundle.user.id}
      members={bundle.members}
      workspace={bundle.workspace}
    >
      <TaskBoardClient
        currentUserId={bundle.user.id}
        members={bundle.members}
        role={bundle.membership?.role ?? "member"}
        tasks={bundle.tasks}
        votes={bundle.votes}
        workspaceId={bundle.workspace.id}
      />
    </WorkspaceShell>
  );
}
