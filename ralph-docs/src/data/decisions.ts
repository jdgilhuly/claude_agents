import { DecisionPoint } from '../types/workflow';

export const decisionPoints: DecisionPoint[] = [
  {
    id: 'after-planning',
    afterStage: 'planning',
    beforeStage: 'prd',
    options: [
      {
        key: 'Enter',
        label: 'Continue',
        description: 'Proceed to PRD Generation stage',
      },
      {
        key: 'r',
        label: 'Review',
        description: 'Open and review the generated plan file',
      },
      {
        key: 'e',
        label: 'Edit',
        description: 'Edit the plan file before continuing',
      },
      {
        key: 's',
        label: 'Save & Exit',
        description: 'Save session and exit (resume later with --continue)',
      },
      {
        key: 'q',
        label: 'Quit',
        description: 'Exit without saving',
      },
    ],
  },
  {
    id: 'after-prd',
    afterStage: 'prd',
    beforeStage: 'tasks',
    options: [
      {
        key: 'Enter',
        label: 'Continue',
        description: 'Proceed to Task Generation stage',
      },
      {
        key: 'r',
        label: 'Review',
        description: 'Open and review the generated PRD file',
      },
      {
        key: 'e',
        label: 'Edit',
        description: 'Edit the PRD file before continuing',
      },
      {
        key: 's',
        label: 'Save & Exit',
        description: 'Save session and exit (resume later with --continue)',
      },
      {
        key: 'q',
        label: 'Quit',
        description: 'Exit without saving',
      },
    ],
  },
  {
    id: 'after-tasks',
    afterStage: 'tasks',
    beforeStage: 'ralph',
    options: [
      {
        key: 'Enter',
        label: 'Continue',
        description: 'Proceed to Ralph Implementation (autonomous mode)',
      },
      {
        key: 'r',
        label: 'Review',
        description: 'Open and review the generated tasks file',
      },
      {
        key: 'e',
        label: 'Edit',
        description: 'Edit tasks before implementation begins',
      },
      {
        key: 's',
        label: 'Save & Exit',
        description: 'Save session and exit (resume later with --continue)',
      },
      {
        key: 'q',
        label: 'Quit',
        description: 'Exit without saving',
      },
    ],
  },
];
