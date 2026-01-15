import { useState, useCallback, useRef, useEffect } from 'react';
import type { StreamEvent, QueryResult } from '../types';

interface UseWebSocketOptions {
  sessionId: string;
  onToken?: (text: string) => void;
  onQueryResult?: (result: QueryResult) => void;
  onComplete?: (message: string, queryResult?: QueryResult) => void;
  onError?: (error: string) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isStreaming: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
}

export function useWebSocket({
  sessionId,
  onToken,
  onQueryResult,
  onComplete,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const accumulatedTextRef = useRef('');
  const queryResultRef = useRef<QueryResult | undefined>(undefined);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${sessionId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsStreaming(false);
    };

    ws.onerror = () => {
      onError?.('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const streamEvent: StreamEvent = JSON.parse(event.data);

        switch (streamEvent.event_type) {
          case 'start':
            setIsStreaming(true);
            accumulatedTextRef.current = '';
            queryResultRef.current = undefined;
            break;

          case 'token':
            const tokenData = streamEvent.data as { text: string };
            accumulatedTextRef.current += tokenData.text;
            onToken?.(tokenData.text);
            break;

          case 'query_result':
            queryResultRef.current = streamEvent.data as QueryResult;
            onQueryResult?.(queryResultRef.current);
            break;

          case 'done':
            setIsStreaming(false);
            const doneData = streamEvent.data as { message: string; query_result?: QueryResult };
            onComplete?.(
              doneData.message || accumulatedTextRef.current,
              doneData.query_result || queryResultRef.current
            );
            break;

          case 'error':
            setIsStreaming(false);
            const errorData = streamEvent.data as { error: string };
            onError?.(errorData.error);
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    wsRef.current = ws;
  }, [sessionId, onToken, onQueryResult, onComplete, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message }));
    } else {
      onError?.('WebSocket is not connected');
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isStreaming,
    connect,
    disconnect,
    sendMessage,
  };
}
