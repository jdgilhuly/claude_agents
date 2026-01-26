export interface Stage {
  id: string;
  number: number;
  name: string;
  shortDescription: string;
  fullDescription: string;
  mode: 'interactive' | 'autonomous';
  outputFile: string;
  outputLocation: string;
  claudeActions: string[];
  sourceFile: string;
  sourceContent: string;
}

export interface DecisionOption {
  key: string;
  label: string;
  description: string;
}

export interface DecisionPoint {
  id: string;
  afterStage: string;
  beforeStage: string;
  options: DecisionOption[];
}

export interface StageStatus {
  status: 'pending' | 'in_progress' | 'completed';
  outputFile: string | null;
}

export interface ExampleSession {
  sessionId: string;
  featureName: string;
  originalPrompt: string;
  stages: Record<string, StageStatus>;
}
