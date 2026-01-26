import { create } from 'zustand';
import type { RalphEvent, Story, Agent, QualityGate, SessionInfo } from '../types/events';

// Per-session state
interface SessionState {
  sessionId: string;
  featureName: string | null;
  branchName: string | null;
  currentIteration: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'completed' | 'incomplete';
  stories: Story[];
  currentStoryId: string | null;
  agents: Map<string, Agent>;
  qualityGates: QualityGate[];
  events: RalphEvent[];
  currentBriefing: string | null;
}

interface AssemblyState {
  // Connection
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // Sessions
  currentSession: string | null;
  sessions: SessionInfo[];
  sessionStates: Map<string, SessionState>;
  setCurrentSession: (sessionId: string | null) => void;
  setSessions: (sessions: SessionInfo[]) => void;
  addSession: (session: SessionInfo) => void;

  // Get session state (creates if not exists)
  getSessionState: (sessionId: string) => SessionState;
  getAllSessionStates: () => SessionState[];

  // Legacy getters (for current session)
  featureName: string | null;
  branchName: string | null;
  currentIteration: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'completed' | 'incomplete';
  stories: Story[];
  currentStoryId: string | null;
  agents: Map<string, Agent>;
  qualityGates: QualityGate[];
  events: RalphEvent[];
  currentBriefing: string | null;

  // Story operations
  addStory: (sessionId: string, story: Story) => void;
  updateStory: (sessionId: string, id: string, updates: Partial<Story>) => void;

  // Agent operations
  spawnAgent: (sessionId: string, agent: Agent) => void;
  updateAgent: (sessionId: string, id: string, updates: Partial<Agent>) => void;
  addAgentOutput: (sessionId: string, id: string, output: string) => void;

  // Quality gate operations
  updateQualityGate: (sessionId: string, type: string, updates: Partial<QualityGate>) => void;

  // Event operations
  addEvent: (sessionId: string, event: RalphEvent) => void;
  addEvents: (sessionId: string, events: RalphEvent[]) => void;

  // Selected element for detail view
  selectedElement: { type: 'story' | 'agent' | 'gate'; id: string; sessionId?: string } | null;
  setSelectedElement: (element: { type: 'story' | 'agent' | 'gate'; id: string; sessionId?: string } | null) => void;

  // Process event
  processEvent: (event: RalphEvent) => void;

  // Reset
  reset: () => void;
}

const createEmptySessionState = (sessionId: string): SessionState => ({
  sessionId,
  featureName: null,
  branchName: null,
  currentIteration: 0,
  maxIterations: 0,
  status: 'idle',
  stories: [],
  currentStoryId: null,
  agents: new Map(),
  qualityGates: [],
  events: [],
  currentBriefing: null,
});

const initialState = {
  connected: false,
  currentSession: null,
  sessions: [],
  sessionStates: new Map<string, SessionState>(),
  featureName: null,
  branchName: null,
  currentIteration: 0,
  maxIterations: 0,
  status: 'idle' as const,
  stories: [],
  currentStoryId: null,
  agents: new Map<string, Agent>(),
  qualityGates: [],
  events: [],
  selectedElement: null,
  currentBriefing: null,
};

export const useAssemblyStore = create<AssemblyState>((set, get) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),

  setCurrentSession: (sessionId) => set({ currentSession: sessionId }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.session_id !== session.session_id)],
    })),

  getSessionState: (sessionId: string) => {
    const state = get();
    let sessionState = state.sessionStates.get(sessionId);
    if (!sessionState) {
      sessionState = createEmptySessionState(sessionId);
      const newMap = new Map(state.sessionStates);
      newMap.set(sessionId, sessionState);
      set({ sessionStates: newMap });
    }
    return sessionState;
  },

  getAllSessionStates: () => {
    return Array.from(get().sessionStates.values());
  },

  addStory: (sessionId, story) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId) || createEmptySessionState(sessionId);
      sessionStates.set(sessionId, {
        ...session,
        stories: [...session.stories, story],
      });

      // Also update legacy state if this is current session
      if (sessionId === state.currentSession || !state.currentSession) {
        return { sessionStates, stories: [...state.stories, story] };
      }
      return { sessionStates };
    }),

  updateStory: (sessionId, id, updates) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId);
      if (session) {
        sessionStates.set(sessionId, {
          ...session,
          stories: session.stories.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        });
      }

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        return {
          sessionStates,
          stories: state.stories.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        };
      }
      return { sessionStates };
    }),

  spawnAgent: (sessionId, agent) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId) || createEmptySessionState(sessionId);
      const agents = new Map(session.agents);
      agents.set(agent.id, agent);
      sessionStates.set(sessionId, { ...session, agents });

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        const legacyAgents = new Map(state.agents);
        legacyAgents.set(agent.id, agent);
        return { sessionStates, agents: legacyAgents };
      }
      return { sessionStates };
    }),

  updateAgent: (sessionId, id, updates) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId);
      if (session) {
        const agents = new Map(session.agents);
        const existing = agents.get(id);
        if (existing) {
          agents.set(id, { ...existing, ...updates });
          sessionStates.set(sessionId, { ...session, agents });
        }
      }

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        const legacyAgents = new Map(state.agents);
        const existing = legacyAgents.get(id);
        if (existing) {
          legacyAgents.set(id, { ...existing, ...updates });
        }
        return { sessionStates, agents: legacyAgents };
      }
      return { sessionStates };
    }),

  addAgentOutput: (sessionId, id, output) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId);
      if (session) {
        const agents = new Map(session.agents);
        const existing = agents.get(id);
        if (existing) {
          agents.set(id, { ...existing, outputs: [...existing.outputs, output] });
          sessionStates.set(sessionId, { ...session, agents });
        }
      }

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        const legacyAgents = new Map(state.agents);
        const existing = legacyAgents.get(id);
        if (existing) {
          legacyAgents.set(id, { ...existing, outputs: [...existing.outputs, output] });
        }
        return { sessionStates, agents: legacyAgents };
      }
      return { sessionStates };
    }),

  updateQualityGate: (sessionId, type, updates) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId) || createEmptySessionState(sessionId);
      const existing = session.qualityGates.find((g) => g.type === type);
      let qualityGates: QualityGate[];

      if (existing) {
        qualityGates = session.qualityGates.map((g) =>
          g.type === type ? { ...g, ...updates } : g
        );
      } else {
        qualityGates = [...session.qualityGates, { type, status: 'pending', ...updates } as QualityGate];
      }
      sessionStates.set(sessionId, { ...session, qualityGates });

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        return { sessionStates, qualityGates };
      }
      return { sessionStates };
    }),

  addEvent: (sessionId, event) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId) || createEmptySessionState(sessionId);
      sessionStates.set(sessionId, {
        ...session,
        events: [...session.events, event],
      });

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        return { sessionStates, events: [...state.events, event] };
      }
      return { sessionStates };
    }),

  addEvents: (sessionId, events) =>
    set((state) => {
      const sessionStates = new Map(state.sessionStates);
      const session = sessionStates.get(sessionId) || createEmptySessionState(sessionId);
      sessionStates.set(sessionId, {
        ...session,
        events: [...session.events, ...events],
      });

      // Also update legacy state
      if (sessionId === state.currentSession || !state.currentSession) {
        return { sessionStates, events: [...state.events, ...events] };
      }
      return { sessionStates };
    }),

  setSelectedElement: (element) => set({ selectedElement: element }),

  processEvent: (event) => {
    const state = get();
    const sessionId = event.session_id;

    // Ensure session state exists
    state.getSessionState(sessionId);
    state.addEvent(sessionId, event);

    const updateSessionState = (updates: Partial<SessionState>) => {
      set((s) => {
        const sessionStates = new Map(s.sessionStates);
        const session = sessionStates.get(sessionId) || createEmptySessionState(sessionId);
        sessionStates.set(sessionId, { ...session, ...updates });

        // Also update legacy state for current session
        const legacyUpdates: Partial<AssemblyState> = { sessionStates };
        if (sessionId === s.currentSession || !s.currentSession) {
          if ('featureName' in updates) legacyUpdates.featureName = updates.featureName;
          if ('branchName' in updates) legacyUpdates.branchName = updates.branchName;
          if ('currentIteration' in updates) legacyUpdates.currentIteration = updates.currentIteration;
          if ('maxIterations' in updates) legacyUpdates.maxIterations = updates.maxIterations;
          if ('status' in updates) legacyUpdates.status = updates.status;
          if ('currentStoryId' in updates) legacyUpdates.currentStoryId = updates.currentStoryId;
          if ('currentBriefing' in updates) legacyUpdates.currentBriefing = updates.currentBriefing;
        }
        return legacyUpdates;
      });
    };

    switch (event.type) {
      case 'session_start': {
        const payload = event.payload as { feature_name: string; max_iterations: number };
        updateSessionState({
          featureName: payload.feature_name,
          maxIterations: payload.max_iterations,
          status: 'running',
        });
        break;
      }

      case 'session_end': {
        const payload = event.payload as { status: string };
        updateSessionState({
          status: payload.status === 'completed' ? 'completed' : 'incomplete',
        });
        break;
      }

      case 'prd_loaded': {
        const payload = event.payload as { branch_name: string; total_stories: number };
        updateSessionState({ branchName: payload.branch_name });
        break;
      }

      case 'iteration_start': {
        const payload = event.payload as {
          iteration: number;
          max_iterations: number;
          current_story: { id: string; title: string };
        };
        updateSessionState({
          currentIteration: payload.iteration,
          maxIterations: payload.max_iterations,
          currentStoryId: payload.current_story.id,
        });

        // Create story if not exists
        const sessionState = state.getSessionState(sessionId);
        const existingStory = sessionState.stories.find((s) => s.id === payload.current_story.id);
        if (!existingStory) {
          state.addStory(sessionId, {
            id: payload.current_story.id,
            title: payload.current_story.title,
            status: 'pending',
            acceptanceCriteria: [],
            position: 0,
          });
        }
        break;
      }

      case 'iteration_end': {
        // Could update story positions here
        break;
      }

      case 'story_start': {
        const payload = event.payload as {
          id: string;
          title: string;
          acceptance_criteria: string[];
        };

        // Create story if it doesn't exist
        const sessionState = state.getSessionState(sessionId);
        const existingStory = sessionState.stories.find((s) => s.id === payload.id);
        if (!existingStory) {
          state.addStory(sessionId, {
            id: payload.id,
            title: payload.title,
            status: 'processing',
            acceptanceCriteria: payload.acceptance_criteria,
            position: 0,
          });
        } else {
          state.updateStory(sessionId, payload.id, {
            status: 'processing',
            acceptanceCriteria: payload.acceptance_criteria,
          });
        }
        break;
      }

      case 'story_complete': {
        const payload = event.payload as { id: string };
        state.updateStory(sessionId, payload.id, { status: 'complete', position: 100 });
        break;
      }

      case 'story_failed': {
        const payload = event.payload as { id: string };
        state.updateStory(sessionId, payload.id, { status: 'failed' });
        break;
      }

      case 'agent_spawn': {
        const payload = event.payload as {
          agent_type: string;
          agent_id: string;
          context?: string;
        };
        state.spawnAgent(sessionId, {
          id: payload.agent_id,
          type: payload.agent_type,
          status: 'active',
          context: payload.context,
          outputs: [],
        });
        break;
      }

      case 'agent_output': {
        const payload = event.payload as { agent_id: string; output: string };
        state.addAgentOutput(sessionId, payload.agent_id, payload.output);
        break;
      }

      case 'agent_complete': {
        const payload = event.payload as { agent_id: string; status: string };
        state.updateAgent(sessionId, payload.agent_id, {
          status: payload.status === 'success' ? 'complete' : 'failed',
        });
        break;
      }

      case 'quality_gate_start': {
        const payload = event.payload as { gate_type: string; story_id?: string };
        state.updateQualityGate(sessionId, payload.gate_type, {
          status: 'checking',
          storyId: payload.story_id,
        });
        break;
      }

      case 'quality_gate_pass': {
        const payload = event.payload as { gate_type: string };
        state.updateQualityGate(sessionId, payload.gate_type, { status: 'passed' });
        break;
      }

      case 'quality_gate_fail': {
        const payload = event.payload as { gate_type: string; issues: string[] };
        state.updateQualityGate(sessionId, payload.gate_type, {
          status: 'failed',
          issues: payload.issues,
        });
        break;
      }

      case 'briefing_generated': {
        const payload = event.payload as { content: string };
        updateSessionState({ currentBriefing: payload.content });
        break;
      }
    }
  },

  reset: () => set({ ...initialState, agents: new Map(), sessionStates: new Map() }),
}));
