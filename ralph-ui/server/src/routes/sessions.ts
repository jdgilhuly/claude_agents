import { Router, Request, Response } from 'express';
import { EventWatcher } from '../event-watcher.js';

export function createSessionsRouter(watcher: EventWatcher): Router {
  const router = Router();

  // List all sessions
  router.get('/', (_req: Request, res: Response) => {
    const sessions = watcher.getSessions();
    res.json({ sessions, count: sessions.length });
  });

  // Get specific session info
  router.get('/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = watcher.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Get events for additional stats
    const events = watcher.getSessionEvents(sessionId);

    // Calculate session stats
    const stats = calculateSessionStats(events);

    res.json({
      ...session,
      stats,
    });
  });

  return router;
}

interface SessionStats {
  total_events: number;
  iterations_completed: number;
  stories_completed: number;
  stories_failed: number;
  agents_spawned: number;
  quality_gates_passed: number;
  quality_gates_failed: number;
  status: 'running' | 'completed' | 'incomplete' | 'unknown';
  feature_name?: string;
}

function calculateSessionStats(events: Array<{ type: string; payload: Record<string, unknown> }>): SessionStats {
  const stats: SessionStats = {
    total_events: events.length,
    iterations_completed: 0,
    stories_completed: 0,
    stories_failed: 0,
    agents_spawned: 0,
    quality_gates_passed: 0,
    quality_gates_failed: 0,
    status: 'unknown',
  };

  for (const event of events) {
    switch (event.type) {
      case 'session_start':
        stats.feature_name = event.payload.feature_name as string;
        stats.status = 'running';
        break;
      case 'session_end':
        stats.status = event.payload.status === 'completed' ? 'completed' : 'incomplete';
        break;
      case 'iteration_end':
        stats.iterations_completed++;
        break;
      case 'story_complete':
        stats.stories_completed++;
        break;
      case 'story_failed':
        stats.stories_failed++;
        break;
      case 'agent_spawn':
        stats.agents_spawned++;
        break;
      case 'quality_gate_pass':
        stats.quality_gates_passed++;
        break;
      case 'quality_gate_fail':
        stats.quality_gates_failed++;
        break;
    }
  }

  return stats;
}
