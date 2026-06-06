import { redirect } from "next/navigation";

type WorkspacePageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  redirect(`/workspaces/${workspaceId}/tasks`);
}
