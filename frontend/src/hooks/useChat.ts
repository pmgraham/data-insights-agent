import { useState, useCallback } from 'react';
import type { ChatMessage, QueryResult } from '../types';
import { api } from '../services/api';

interface UseChatReturn {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  selectOption: (option: string) => Promise<void>;
  clearError: () => void;
  clearChat: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      insights: [],
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await api.sendMessage(message, sessionId || undefined);

      // Update session ID if new
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      // Add assistant message
      setMessages((prev) => {
        // Remove any streaming placeholder and add the final message
        const withoutStreaming = prev.filter((m) => !m.is_streaming);
        return [...withoutStreaming, response.message];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Add error message as assistant response
      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date().toISOString(),
        insights: [],
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const selectOption = useCallback(async (option: string) => {
    // When user selects a clarifying option, send it as a message
    await sendMessage(option);
  }, [sendMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    error,
    sendMessage,
    selectOption,
    clearError,
    clearChat,
  };
}
