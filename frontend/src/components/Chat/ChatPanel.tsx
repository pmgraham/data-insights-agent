import type { ChatMessage } from '../../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onSelectOption: (option: string) => void;
  onViewResults?: (message: ChatMessage) => void;
}

export function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  onSelectOption,
  onViewResults,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSelectOption={onSelectOption}
        onViewResults={onViewResults}
      />
      <MessageInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
}
