# Ralph Workflow

An automated feature development pipeline that takes you from idea to implementation using Claude Code.

## Overview

Ralph is a 4-stage workflow orchestrator that:
1. Refines your initial idea through interactive planning
2. Generates a detailed Product Requirements Document (PRD)
3. Breaks down the PRD into implementable tasks
4. Autonomously implements each task with progress tracking

## Quick Start

```bash
# Start a new workflow
./ralph-workflow.sh "build a twitter clone"

# Resume the most recent session
./ralph-workflow.sh --continue

# Resume a specific session
./ralph-workflow.sh --resume abc12345

# Resume from a specific stage
./ralph-workflow.sh --resume abc12345 --from-stage 3

# List all sessions
./ralph-workflow.sh --list-sessions
```

## The 4 Stages

### Stage 1: Planning (Interactive)

Claude asks clarifying questions about your idea and generates a comprehensive technical plan.

- **Mode**: Fully interactive with clickable question options
- **Output**: `<session_dir>/plan_<timestamp>.md`
- **What happens**: Claude uses AskUserQuestion to gather requirements, then produces a structured plan covering architecture, user flows, data models, and API design.

### Stage 2: PRD Generation

Converts the plan into a formal Product Requirements Document.

- **Mode**: Interactive questions, auto-accepts file writes
- **Output**: `tasks/prd-<feature-name>.md`
- **What happens**: Claude asks focused clarifying questions, then generates a PRD with goals, user stories, functional requirements, and success metrics.

### Stage 3: Task Generation

Breaks down the PRD into an ordered task list.

- **Mode**: Interactive questions, auto-accepts file writes
- **Output**: `tasks/tasks-<feature-name>.md`
- **What happens**: Claude generates high-level parent tasks, waits for your "Go" confirmation, then expands into detailed sub-tasks with checkboxes.

### Stage 4: Ralph Implementation Loop

Autonomously implements each task, one story at a time.

- **Mode**: Fully autonomous (`--dangerously-skip-permissions`)
- **Output**: Code changes, commits, `prd.json`, `progress.txt`
- **What happens**:
  1. Converts tasks to `prd.json` format (user stories with acceptance criteria)
  2. Creates/switches to feature branch `ralph/<feature-name>`
  3. Loops through stories, implementing one per iteration
  4. Runs typecheck/tests, commits, updates progress
  5. Stops when all stories pass or max iterations reached

## File Structure

```
scripts/ralph/
├── ralph-workflow.sh      # Main orchestrator
├── stage-1-planning.sh    # Interactive planning
├── stage-2-prd.sh         # PRD generation
├── stage-3-tasks.sh       # Task breakdown
├── stage-4-ralph.sh       # Implementation loop
├── prompt.md              # Ralph agent instructions
├── create-prd.md          # PRD generation guidelines
├── generate-tasks.md      # Task generation guidelines
├── prd.json               # Current user stories (generated)
├── progress.txt           # Implementation learnings (generated)
└── lib/
    ├── ui.sh              # Terminal UI utilities
    ├── session.sh         # Session state management
    └── feature-name.sh    # Feature name utilities

.ralph/
└── sessions/
    └── <session-id>/
        ├── state.json           # Session state
        ├── prompt_original.txt  # Original user prompt
        └── plan_<timestamp>.md  # Generated plan

tasks/
├── prd-<feature>.md       # Product requirements
└── tasks-<feature>.md     # Implementation tasks
```

## Session Management

Ralph tracks workflow state in `.ralph/sessions/`. Each session contains:

- **state.json**: Current stage, timestamps, output file paths
- **prompt_original.txt**: Your original idea
- **plan files**: Generated during Stage 1

### Session States

Each stage tracks:
- `pending` - Not started
- `in_progress` - Currently running
- `completed` - Finished with output file

## Configuration

Environment variables:

```bash
# Max implementation iterations (default: 10)
MAX_ITERATIONS=20

# Pause between iterations for review (default: true)
PAUSE_BETWEEN_ITERATIONS=false

# Tasks directory (default: tasks)
TASKS_DIR=my-tasks

# Ralph data directory (default: .ralph)
RALPH_DIR=.workflow
```

## The prd.json Format

Stage 4 converts tasks into this format for the implementation loop:

```json
{
  "branchName": "ralph/feature-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "Implement user authentication",
      "acceptanceCriteria": [
        "Users can sign up with email/password",
        "Users can log in",
        "typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

## Progress Tracking

The `progress.txt` file accumulates learnings across iterations:

```markdown
## Codebase Patterns
- Migrations: Use IF NOT EXISTS
- React: useRef<Timeout | null>(null)

## Key Files
- src/auth/index.ts - Authentication module

---

## 2024-01-15 - US-001
- Implemented signup/login forms
- Files: src/auth/*, src/components/LoginForm.tsx
- **Learnings:**
  - Used bcrypt for password hashing
  - JWT tokens stored in httpOnly cookies
---
```

## Stage Boundaries

Between stages, you can:
- **[Enter]** - Continue to next stage
- **[r]** - Review output file
- **[e]** - Edit output file before continuing
- **[s]** - Save and exit (resume later)
- **[q]** - Quit

## Tips

1. **Be specific in Stage 1**: The more detail you provide during planning, the better the PRD and tasks will be.

2. **Review before Stage 4**: Check `prd.json` before the implementation loop starts. You can edit it to adjust priorities or acceptance criteria.

3. **Use progress.txt patterns**: Ralph reads this first to understand codebase conventions discovered in previous iterations.

4. **Resume anytime**: Sessions persist automatically. Use `--continue` to pick up where you left off.

5. **Adjust iterations**: For large features, increase `MAX_ITERATIONS`. For quick fixes, reduce it.
