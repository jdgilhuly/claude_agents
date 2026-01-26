import { Router, Request, Response } from 'express';
import betterSse from 'better-sse';
const { createSession, createChannel } = betterSse;
import { EventWatcher, RalphEvent } from '../event-watcher.js';

export function createEventsRouter(watcher: EventWatcher): Router {
  const router = Router();
  const channel = createChannel();

  // Subscribe watcher events to SSE channel
  watcher.on('event', (event: RalphEvent) => {
    channel.broadcast(event, 'event');
  });

  watcher.on('session:new', (sessionId: string) => {
    channel.broadcast({ session_id: sessionId }, 'session:new');
  });

  // SSE endpoint for real-time event streaming
  router.get('/stream', async (req: Request, res: Response) => {
    const session = await createSession(req, res);
    channel.register(session);

    // Send initial connection event
    session.push({ connected: true, timestamp: new Date().toISOString() }, 'connected');

    // Keep connection alive
    req.on('close', () => {
      channel.deregister(session);
    });
  });

  // SSE endpoint for specific session
  router.get('/stream/:sessionId', async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const sessionChannel = createChannel();

    // Filter events for this session
    const handleEvent = (event: RalphEvent) => {
      if (event.session_id === sessionId) {
        sessionChannel.broadcast(event, 'event');
      }
    };

    watcher.on('event', handleEvent);

    const session = await createSession(req, res);
    sessionChannel.register(session);

    // Send existing events as replay
    const existingEvents = watcher.getSessionEvents(sessionId);
    for (const event of existingEvents) {
      session.push(event, 'replay');
    }

    // Signal replay complete
    session.push({ replay_complete: true }, 'replay:complete');

    req.on('close', () => {
      sessionChannel.deregister(session);
      watcher.off('event', handleEvent);
    });
  });

  // Get all events for a session (non-streaming)
  router.get('/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const events = watcher.getSessionEvents(sessionId);
    res.json({ events, count: events.length });
  });

  return router;
}
