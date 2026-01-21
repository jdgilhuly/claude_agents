import { Stage } from '../types/workflow';

export const stages: Stage[] = [
  {
    id: 'planning',
    number: 1,
    name: 'Planning',
    shortDescription: 'Refine idea with Claude in plan mode',
    fullDescription: `Claude asks clarifying questions about your idea and generates a comprehensive technical plan.`,
    mode: 'interactive',
    outputFile: 'plan_<timestamp>.md',
    outputLocation: '<session_dir>/',
    claudeActions: [
      'Asks clarifying questions via clickable options',
      'Gathers requirements interactively',
      'Generates comprehensive technical plan',
    ],
    sourceFile: 'stage-1-planning.sh',
    sourceContent: `# Planning System Prompt

You are a technical planning assistant. Your task is to take the user's initial idea and expand it into a comprehensive technical plan.

## IMPORTANT: Document Your Steps First

Before doing ANY work, you MUST use the TodoWrite tool to outline all the steps you plan to take. This includes:
- Clarifying questions you need to ask
- Research/exploration tasks
- Each section of the plan you will write

Update the todo list as you complete each step. This ensures the user can see your progress and approach.

## Process

1. First, use TodoWrite to create your task list
2. Ask clarifying questions as needed (use AskUserQuestion tool for multiple-choice)
3. Work through each section, marking todos complete as you go
4. Save the final plan

## Plan Structure

The final plan should include:

### Project Overview
[Expanded description of what will be built]

### Functional Requirements
[What the system must DO - features, behaviors, capabilities]
- User-facing features
- System behaviors
- Data operations
- Integrations

### Non-Functional Requirements
[How the system must PERFORM - quality attributes]
- Performance (response times, throughput)
- Security (authentication, authorization, data protection)
- Scalability (expected load, growth)
- Reliability (uptime, error handling)
- Usability (accessibility, UX standards)

### Technical Architecture
[High-level architecture decisions - stack, patterns, structure]

### User Flows
[Key user journeys through the application]

### Data Model
[Main entities and their relationships]

### API Design
[Key endpoints or interactions - REST/GraphQL/etc]

### Non-Goals / Out of Scope
[What this project will NOT include]

IMPORTANT: Do NOT include an "Open Questions" section. All questions must be resolved during this planning phase through clarifying questions. The final plan should have no ambiguity.

Be specific and actionable. This plan will feed into PRD and task generation.`,
  },
  {
    id: 'prd',
    number: 2,
    name: 'PRD Generation',
    shortDescription: 'Generate Product Requirements Document',
    fullDescription: `Converts the technical plan into a formal Product Requirements Document.`,
    mode: 'interactive',
    outputFile: 'prd-<feature-name>.md',
    outputLocation: 'tasks/',
    claudeActions: [
      'Reads the plan from Stage 1',
      'Asks focused clarifying questions',
      'Generates formal PRD document',
    ],
    sourceFile: 'create-prd.md',
    sourceContent: `# Rule: Generating a Product Requirements Document (PRD)

## Goal

To guide an AI assistant in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer to understand and implement the feature.

## Process

1. **Receive Initial Prompt:** The user provides a brief description or request for a new feature
2. **Ask Clarifying Questions:** Before writing the PRD, the AI *must* ask only the most essential clarifying questions needed to write a clear PRD. Limit questions to 3-5 critical gaps in understanding. Use the AskUserQuestion tool to present clickable multiple-choice options.
3. **Generate PRD:** Based on the initial prompt and the user's answers, generate a PRD using the structure outlined below.
4. **Save PRD:** Save the generated document as \`prd-[feature-name].md\` inside the \`/tasks\` directory.

## Clarifying Questions (Guidelines)

Ask only the most critical questions needed to write a clear PRD:

- **Problem/Goal:** If unclear - "What problem does this feature solve for the user?"
- **Core Functionality:** If vague - "What are the key actions a user should be able to perform?"
- **Scope/Boundaries:** If broad - "Are there any specific things this feature *should not* do?"
- **Success Criteria:** If unstated - "How will we know when this feature is successfully implemented?"

**Important:** Only ask questions when the answer isn't reasonably inferable from the initial prompt.

## PRD Structure

The generated PRD should include:

1. **Introduction/Overview:** Briefly describe the feature and the problem it solves
2. **Goals:** List the specific, measurable objectives for this feature
3. **User Stories:** Detail the user narratives describing feature usage
4. **Functional Requirements:** List the specific functionalities the feature must have
5. **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include
6. **Design Considerations (Optional):** UI/UX requirements if applicable
7. **Technical Considerations (Optional):** Known technical constraints or dependencies
8. **Success Metrics:** How will the success of this feature be measured?
9. **Open Questions:** Any remaining questions needing clarification

## Target Audience

Assume the primary reader of the PRD is a **junior developer**. Requirements should be explicit, unambiguous, and avoid jargon where possible.

## Final Instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Take the user's answers to improve the PRD`,
  },
  {
    id: 'tasks',
    number: 3,
    name: 'Task Generation',
    shortDescription: 'Break down PRD into implementation tasks',
    fullDescription: `Breaks down the PRD into an ordered task list ready for implementation.`,
    mode: 'interactive',
    outputFile: 'tasks-<feature-name>.md',
    outputLocation: 'tasks/',
    claudeActions: [
      'Analyzes the PRD',
      'Generates high-level parent tasks',
      'Waits for user confirmation',
      'Expands into detailed sub-tasks',
    ],
    sourceFile: 'generate-tasks.md',
    sourceContent: `# Rule: Generating a Task List from User Requirements

## Goal

To guide an AI assistant in creating a detailed, step-by-step task list in Markdown format based on user requirements. The task list should guide a developer through implementation.

## Output

- **Format:** Markdown (\`.md\`)
- **Location:** \`/tasks/\`
- **Filename:** \`tasks-[feature-name].md\`

## Process

1. **Receive Requirements:** The user provides a feature request or points to existing documentation
2. **Analyze Requirements:** Analyze the functional requirements and implementation scope
3. **Phase 1: Generate Parent Tasks:** Create ~5 high-level tasks. **Always include task 0.0 "Create feature branch" as the first task.** Present these to the user and wait for "Go" confirmation.
4. **Wait for Confirmation:** Pause and wait for the user to respond with "Go"
5. **Phase 2: Generate Sub-Tasks:** Break down each parent task into smaller, actionable sub-tasks
6. **Identify Relevant Files:** List files that will need to be created or modified
7. **Save Task List:** Save as \`tasks-[feature-name].md\`

## Output Format

\`\`\`markdown
## Relevant Files

- \`path/to/file1.ts\` - Brief description
- \`path/to/file1.test.ts\` - Unit tests for file1.ts

### Notes

- Unit tests should be placed alongside the code files they test
- Use \`npx jest [optional/path]\` to run tests

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing \`- [ ]\` to \`- [x]\`. Update the file after completing each sub-task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout new branch (\`git checkout -b feature/[name]\`)
- [ ] 1.0 Parent Task Title
  - [ ] 1.1 [Sub-task description]
  - [ ] 1.2 [Sub-task description]
- [ ] 2.0 Parent Task Title
  - [ ] 2.1 [Sub-task description]
\`\`\`

## Interaction Model

The process requires a pause after generating parent tasks to get user confirmation ("Go") before generating detailed sub-tasks. This ensures the high-level plan aligns with user expectations.

## Target Audience

Assume the primary reader is a **junior developer** who will implement the feature.`,
  },
  {
    id: 'ralph',
    number: 4,
    name: 'Ralph Implementation',
    shortDescription: 'Autonomously implement each task',
    fullDescription: `Autonomously implements each task, one user story at a time. Runs with --dangerously-skip-permissions.`,
    mode: 'autonomous',
    outputFile: 'prd.json, progress.txt',
    outputLocation: 'scripts/ralph/',
    claudeActions: [
      'Converts tasks to prd.json format',
      'Creates feature branch',
      'Implements one story per iteration',
      'Runs typecheck and tests',
      'Commits changes automatically',
    ],
    sourceFile: 'prompt.md',
    sourceContent: `# Ralph Agent Instructions

## IMPORTANT: Use TodoWrite for Task Tracking

You MUST use the TodoWrite tool to track your implementation progress. Before starting any work:
1. Create todos for each step of implementing the current story
2. Mark todos as in_progress when you start them
3. Mark todos as completed when you finish them

This gives the user visibility into your progress.

## Quality Gates (REQUIRED)

After committing your changes, you MUST pass quality review before marking the story complete:

1. **Get the diff**: Run \`git diff HEAD~1\` to see your changes
2. **Run code-reviewer**: Use the Task tool with subagent_type=code-reviewer
   - Must receive no critical issues
3. **Run pr-test-analyzer**: Use the Task tool with subagent_type=pr-test-analyzer
   - Must confirm tests properly validate the implemented functionality

### If reviewers find issues:
- Fix all critical issues identified
- Run typecheck and tests again
- Amend the commit: \`git commit --amend --no-edit\`
- Re-run BOTH reviewers on the updated diff
- Repeat until both reviewers pass

## Your Task

1. Read \`scripts/ralph/prd.json\`
2. Read \`scripts/ralph/progress.txt\` (check Codebase Patterns first)
3. Check you're on the correct branch
4. Pick highest priority story where \`passes: false\`
5. **Use TodoWrite** to create task list for this story
6. Implement that ONE story (updating todos as you go)
7. Run typecheck and tests
8. Update AGENTS.md files with learnings
9. Commit: \`feat: [ID] - [Title]\`
10. **QUALITY GATE**: Run code-reviewer on \`git diff HEAD~1\`
11. **QUALITY GATE**: Run pr-test-analyzer on the diff
12. If issues found → fix, re-test, amend commit, re-run reviewers
13. After both reviewers pass → Update prd.json: \`passes: true\`
14. Append learnings to progress.txt (include reviewer feedback)

## Progress Format

APPEND to progress.txt:

\`\`\`markdown
## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
\`\`\`

## Stop Condition

If ALL stories pass, reply:
\`<promise>COMPLETE</promise>\`

Otherwise end normally.`,
  },
];
