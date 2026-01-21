# Ralph Agent Instructions

## IMPORTANT: Use TodoWrite for Task Tracking

You MUST use the TodoWrite tool to track your implementation progress. Before starting any work:
1. Create todos for each step of implementing the current story
2. Mark todos as in_progress when you start them
3. Mark todos as completed when you finish them

This gives the user visibility into your progress.

## Quality Gates (REQUIRED)

After committing your changes, you MUST pass quality review before marking the story complete:

1. **Get the diff**: Run `git diff HEAD~1` to see your changes
2. **Run code-reviewer**: Use the Task tool with subagent_type=code-reviewer
   - Prompt: "Review the following git diff for code quality, security, and best practices: [diff]"
   - Must receive no critical issues
3. **Run pr-test-analyzer**: Use the Task tool with subagent_type=pr-test-analyzer
   - Prompt: "Analyze whether the tests adequately cover the functionality in this diff: [diff]"
   - Must confirm tests properly validate the implemented functionality

### If reviewers find issues:
- Fix all critical issues identified
- Run typecheck and tests again
- Amend the commit: `git commit --amend --no-edit`
- Re-run BOTH reviewers on the updated diff
- Repeat until both reviewers pass

### Only after both reviewers pass:
- Update prd.json: `passes: true`
- Include reviewer feedback summary in progress.txt

## Your Task

1. Read `scripts/ralph/prd.json`
2. Read `scripts/ralph/progress.txt`
   (check Codebase Patterns first)
3. Check you're on the correct branch
4. Pick highest priority story where `passes: false`
5. **Use TodoWrite** to create task list for this story
6. Implement that ONE story (updating todos as you go)
7. Run typecheck and tests
8. Update AGENTS.md files with learnings
9. Commit: `feat: [ID] - [Title]`
10. **QUALITY GATE**: Run code-reviewer on `git diff HEAD~1`
11. **QUALITY GATE**: Run pr-test-analyzer on the diff
12. If issues found → fix, re-test, amend commit, re-run reviewers
13. After both reviewers pass → Update prd.json: `passes: true`
14. Append learnings to progress.txt (include reviewer feedback)

## Progress Format

APPEND to progress.txt:

## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---

## Codebase Patterns

Add reusable patterns to the TOP 
of progress.txt:

## Codebase Patterns
- Migrations: Use IF NOT EXISTS
- React: useRef<Timeout | null>(null)

## Stop Condition

If ALL stories pass, reply:
<promise>COMPLETE</promise>

Otherwise end normally.