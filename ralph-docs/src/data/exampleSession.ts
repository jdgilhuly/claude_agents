import { ExampleSession } from '../types/workflow';

export const exampleSession: ExampleSession = {
  sessionId: 'abc12345',
  featureName: 'user-authentication',
  originalPrompt: 'Add user authentication with OAuth support and session management',
  stages: {
    planning: {
      status: 'completed',
      outputFile: '.ralph/sessions/abc12345/plan_1705123456.md',
    },
    prd: {
      status: 'completed',
      outputFile: 'tasks/prd-user-authentication.md',
    },
    tasks: {
      status: 'completed',
      outputFile: 'tasks/tasks-user-authentication.md',
    },
    ralph: {
      status: 'in_progress',
      outputFile: 'scripts/ralph/prd.json',
    },
  },
};
