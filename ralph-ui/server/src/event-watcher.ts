import { watch, FSWatcher } from 'chokidar';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { EventEmitter } from 'events';

export interface RalphEvent {
  id: string;
  type: string;
  timestamp: string;
  session_id: string;
  payload: Record<string, unknown>;
}

export interface SessionInfo {
  session_id: string;
  created_at: string;
  event_count: number;
  last_event?: RalphEvent;
}

export class EventWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private eventsDir: string;
  private filePositions: Map<string, number> = new Map();
  private sessions: Map<string, SessionInfo> = new Map();

  constructor(eventsDir: string) {
    super();
    this.eventsDir = eventsDir;
  }

  start(): void {
    if (!existsSync(this.eventsDir)) {
      console.log(`Events directory does not exist yet: ${this.eventsDir}`);
      console.log('Will start watching when it is created...');
    }

    // Scan existing sessions
    this.scanExistingSessions();

    // Watch for new events files and changes
    this.watcher = watch(this.eventsDir, {
      persistent: true,
      ignoreInitial: false,
      depth: 2,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher.on('add', (filePath) => this.handleFileAdd(filePath));
    this.watcher.on('change', (filePath) => this.handleFileChange(filePath));
    this.watcher.on('addDir', (dirPath) => this.handleDirAdd(dirPath));

    console.log(`Watching for events in: ${this.eventsDir}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  getSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionEvents(sessionId: string): RalphEvent[] {
    const eventsFile = join(this.eventsDir, sessionId, 'events.jsonl');
    if (!existsSync(eventsFile)) {
      return [];
    }

    try {
      const content = readFileSync(eventsFile, 'utf-8');
      return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as RalphEvent);
    } catch (error) {
      console.error(`Error reading events for session ${sessionId}:`, error);
      return [];
    }
  }

  private scanExistingSessions(): void {
    if (!existsSync(this.eventsDir)) {
      return;
    }

    try {
      const entries = readdirSync(this.eventsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          this.loadSessionMetadata(entry.name);
        }
      }
    } catch (error) {
      console.error('Error scanning sessions:', error);
    }
  }

  private loadSessionMetadata(sessionId: string): void {
    const metadataFile = join(this.eventsDir, sessionId, 'metadata.json');
    const eventsFile = join(this.eventsDir, sessionId, 'events.jsonl');

    let sessionInfo: SessionInfo = {
      session_id: sessionId,
      created_at: new Date().toISOString(),
      event_count: 0,
    };

    // Try to read metadata file
    if (existsSync(metadataFile)) {
      try {
        const metadata = JSON.parse(readFileSync(metadataFile, 'utf-8'));
        sessionInfo.created_at = metadata.created_at || sessionInfo.created_at;
      } catch (error) {
        console.error(`Error reading metadata for ${sessionId}:`, error);
      }
    }

    // Count events and get last event
    if (existsSync(eventsFile)) {
      try {
        const content = readFileSync(eventsFile, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());
        sessionInfo.event_count = lines.length;
        if (lines.length > 0) {
          sessionInfo.last_event = JSON.parse(lines[lines.length - 1]);
        }
        // Track file position for incremental reads
        this.filePositions.set(eventsFile, Buffer.byteLength(content, 'utf-8'));
      } catch (error) {
        console.error(`Error reading events for ${sessionId}:`, error);
      }
    }

    this.sessions.set(sessionId, sessionInfo);
  }

  private handleDirAdd(dirPath: string): void {
    // Check if this is a new session directory
    if (dirname(dirPath) === this.eventsDir) {
      const sessionId = basename(dirPath);
      this.loadSessionMetadata(sessionId);
      this.emit('session:new', sessionId);
    }
  }

  private handleFileAdd(filePath: string): void {
    if (basename(filePath) === 'events.jsonl') {
      // Initial load of events file
      this.processEventsFile(filePath, true);
    }
  }

  private handleFileChange(filePath: string): void {
    if (basename(filePath) === 'events.jsonl') {
      // Incremental read of new events
      this.processEventsFile(filePath, false);
    }
  }

  private processEventsFile(filePath: string, isInitial: boolean): void {
    const sessionId = basename(dirname(filePath));

    // Ensure session is registered
    if (!this.sessions.has(sessionId)) {
      this.loadSessionMetadata(sessionId);
      this.emit('session:new', sessionId);
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const currentPosition = this.filePositions.get(filePath) || 0;
      const newContent = isInitial
        ? content
        : content.slice(currentPosition);

      // Update file position
      this.filePositions.set(filePath, Buffer.byteLength(content, 'utf-8'));

      // Parse new events
      const lines = newContent.split('\n').filter((line) => line.trim());
      const newEvents: RalphEvent[] = [];

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as RalphEvent;
          newEvents.push(event);
        } catch (parseError) {
          console.error(`Error parsing event line: ${line}`);
        }
      }

      // Update session info
      if (newEvents.length > 0) {
        const sessionInfo = this.sessions.get(sessionId);
        if (sessionInfo) {
          sessionInfo.event_count += newEvents.length;
          sessionInfo.last_event = newEvents[newEvents.length - 1];
        }

        // Emit events
        for (const event of newEvents) {
          this.emit('event', event);
        }
      }
    } catch (error) {
      console.error(`Error processing events file ${filePath}:`, error);
    }
  }
}
