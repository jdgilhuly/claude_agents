import express from 'express';
import cors from 'cors';
import { join, resolve } from 'path';
import { EventWatcher } from './event-watcher.js';
import { createEventsRouter } from './routes/events.js';
import { createSessionsRouter } from './routes/sessions.js';

const PORT = process.env.PORT || 3001;
const RALPH_DIR = process.env.RALPH_DIR || '.ralph';
const EVENTS_DIR = process.env.EVENTS_DIR || join(process.cwd(), RALPH_DIR, 'events');

async function main() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(express.json());

  // Initialize event watcher
  const absoluteEventsDir = resolve(EVENTS_DIR);
  console.log(`Events directory: ${absoluteEventsDir}`);

  const watcher = new EventWatcher(absoluteEventsDir);
  watcher.start();

  // Routes
  app.use('/api/events', createEventsRouter(watcher));
  app.use('/api/sessions', createSessionsRouter(watcher));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      eventsDir: absoluteEventsDir,
      sessions: watcher.getSessions().length,
      timestamp: new Date().toISOString(),
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Ralph Event Server running on http://localhost:${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/api/events/stream`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    watcher.stop();
    process.exit(0);
  });
}

main().catch(console.error);
