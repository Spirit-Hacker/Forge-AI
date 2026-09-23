import Workspace from "@/components/workspace/workspace";

interface WorkspacePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { projectId } = await params;

  return <Workspace projectId={projectId} />;
}
