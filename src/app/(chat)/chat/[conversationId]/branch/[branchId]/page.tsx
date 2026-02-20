import { ChatShell } from '@/components/chat/ChatShell';

interface Props {
  params: Promise<{ conversationId: string; branchId: string }>;
}

export default async function BranchPage({ params }: Props) {
  const { conversationId, branchId } = await params;
  return <ChatShell conversationId={conversationId} branchId={branchId} />;
}
