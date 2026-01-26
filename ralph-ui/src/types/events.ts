export interface RalphEvent {
  id: string;
  type: EventType;
  timestamp: string;
  session_id: string;
  payload: Record<string, unknown>;
}

export type EventType =
  | 'session_start'
  | 'session_end'
  | 'iteration_start'
  | 'iteration_end'
  | 'story_start'
  | 'story_complete'
  | 'story_failed'
  | 'agent_spawn'
  | 'agent_output'
  | 'agent_complete'
  | 'quality_gate_start'
  | 'quality_gate_pass'
  | 'quality_gate_fail'
  | 'prd_loaded'
  | 'prd_updated'
  | 'briefing_generated';

export interface SessionStartPayload {
  feature_name: string;
  max_iterations: number;
}

export interface SessionEndPayload {
  status: 'completed' | 'incomplete';
  reason?: string;
}

export interface IterationStartPayload {
  iteration: number;
  max_iterations: number;
  current_story: {
    id: string;
    title: string;
  };
}

export interface IterationEndPayload {
  iteration: number;
  remaining_stories: number;
}

export interface StoryStartPayload {
  id: string;
  title: string;
  acceptance_criteria: string[];
}

export interface StoryCompletePayload {
  id: string;
}

export interface StoryFailedPayload {
  id: string;
  reason?: string;
}

export interface AgentSpawnPayload {
  agent_type: string;
  agent_id: string;
  context?: string;
}

export interface AgentOutputPayload {
  agent_id: string;
  output: string;
  output_type: 'text' | 'tool_call' | 'error';
}

export interface AgentCompletePayload {
  agent_id: string;
  status: 'success' | 'failure' | 'timeout';
}

export interface QualityGateStartPayload {
  gate_type: string;
  story_id?: string;
}

export interface QualityGatePassPayload {
  gate_type: string;
  details?: string;
}

export interface QualityGateFailPayload {
  gate_type: string;
  issues: string[];
}

export interface PrdLoadedPayload {
  total_stories: number;
  branch_name: string;
}

export interface PrdUpdatedPayload {
  completed_stories: number;
  total_stories: number;
}

export interface BriefingGeneratedPayload {
  iteration: number;
  content: string;
}

// UI State types
export interface Story {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  acceptanceCriteria: string[];
  position: number; // Position on conveyor (0-100%)
}

export interface Agent {
  id: string;
  type: string;
  status: 'active' | 'complete' | 'failed';
  context?: string;
  outputs: string[];
}

export interface QualityGate {
  type: string;
  storyId?: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  issues?: string[];
}

export interface SessionInfo {
  session_id: string;
  feature_name?: string;
  created_at: string;
  event_count: number;
  status?: 'running' | 'completed' | 'incomplete' | 'unknown';
}
