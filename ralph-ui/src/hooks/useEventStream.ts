import { useEffect, useRef, useCallback } from 'react';
import { useAssemblyStore } from '../stores/assemblyStore';
import type { RalphEvent, SessionInfo } from '../types/events';

const API_BASE = '/api';

export function useEventStream(sessionId?: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    setConnected,
    processEvent,
    setCurrentSession,
    setSessions,
    addSession,
    reset,
  } = useAssemblyStore();

  // Fetch sessions list
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/sessions`);
      const data = await response.json();
      setSessions(data.sessions as SessionInfo[]);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, [setSessions]);

  // Connect to SSE stream
  const connect = useCallback((targetSessionId?: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Reset state for new session
    reset();

    const url = targetSessionId
      ? `${API_BASE}/events/stream/${targetSessionId}`
      : `${API_BASE}/events/stream`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setConnected(true);
      if (targetSessionId) {
        setCurrentSession(targetSessionId);
      }
    });

    eventSource.addEventListener('event', (e) => {
      try {
        const event = JSON.parse(e.data) as RalphEvent;
        processEvent(event);
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    });

    eventSource.addEventListener('replay', (e) => {
      try {
        const event = JSON.parse(e.data) as RalphEvent;
        processEvent(event);
      } catch (error) {
        console.error('Failed to parse replay event:', error);
      }
    });

    eventSource.addEventListener('replay:complete', () => {
      console.log('Replay complete');
    });

    eventSource.addEventListener('session:new', (e) => {
      try {
        const data = JSON.parse(e.data) as { session_id: string };
        // Fetch full session info
        fetch(`${API_BASE}/sessions/${data.session_id}`)
          .then((res) => res.json())
          .then((session: SessionInfo) => addSession(session))
          .catch(console.error);
      } catch (error) {
        console.error('Failed to parse session:new event:', error);
      }
    });

    eventSource.onerror = () => {
      setConnected(false);
      console.error('EventSource error - attempting reconnect...');
      // Attempt reconnect after delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          connect(targetSessionId);
        }
      }, 3000);
    };
  }, [setConnected, processEvent, setCurrentSession, addSession, reset]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, [setConnected]);

  // Initial connection
  useEffect(() => {
    fetchSessions();
    connect(sessionId ?? undefined);

    return () => {
      disconnect();
    };
  }, [sessionId]);

  // Reconnect when sessionId changes
  useEffect(() => {
    if (sessionId !== undefined) {
      connect(sessionId ?? undefined);
    }
  }, [sessionId, connect]);

  return {
    connect,
    disconnect,
    fetchSessions,
  };
}

export function useAssemblyState() {
  return useAssemblyStore();
}
