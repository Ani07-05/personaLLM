import { memo } from 'react';
import type { UIMessage } from 'ai';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

interface MessageItemProps {
  message: UIMessage;
  isStreaming?: boolean;
  onFork?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
}

export const MessageItem = memo(function MessageItem({ message, isStreaming, onFork, onEdit }: MessageItemProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} onEdit={onEdit} />;
  }
  if (message.role === 'assistant') {
    return (
      <AssistantMessage
        message={message}
        isStreaming={isStreaming}
        onFork={onFork}
      />
    );
  }
  return null;
});
