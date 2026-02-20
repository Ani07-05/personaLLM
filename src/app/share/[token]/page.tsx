import { notFound } from 'next/navigation';
import { fetchQuery } from 'convex/nextjs';
import { api } from '../../../../convex/_generated/api';
import { SharePageClient } from './SharePageClient';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const data = await fetchQuery(api.conversations.getByShareToken, { token });

  if (!data) notFound();

  return (
    <SharePageClient
      conversation={data.conversation as { _id: string; title: string; shareToken?: string }}
      messages={data.messages}
      shareToken={token}
    />
  );
}
