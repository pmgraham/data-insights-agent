import { useState, useEffect } from 'react';
import type { ChatMessage } from './types';
import { useChat } from './hooks/useChat';
import { AppLayout } from './components/Layout/AppLayout';
import { ChatPanel } from './components/Chat/ChatPanel';
import { ResultsPanel } from './components/Results/ResultsPanel';

function App() {
  const { messages, isLoading, sendMessage, selectOption, clearChat } = useChat();
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  // Auto-show results panel when a new message with query_result arrives
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.query_result) {
        setSelectedMessage(lastMessage);
      }
    }
  }, [messages]);

  const handleViewResults = (message: ChatMessage) => {
    setSelectedMessage(message);
  };

  const handleCloseResults = () => {
    setSelectedMessage(null);
  };

  const handleNewChat = () => {
    clearChat();
    setSelectedMessage(null);
  };

  return (
    <AppLayout onNewChat={handleNewChat}>
      <div className="flex h-full">
        {/* Chat Panel */}
        <div className={`flex-1 ${selectedMessage ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onSelectOption={selectOption}
            onViewResults={handleViewResults}
          />
        </div>

        {/* Results Panel */}
        {selectedMessage && (
          <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0">
            <ResultsPanel message={selectedMessage} onClose={handleCloseResults} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default App;
