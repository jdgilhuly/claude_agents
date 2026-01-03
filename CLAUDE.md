# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **template repository** for Claude Code configurations. It serves as a centralized master setup containing:
- Custom skills (slash commands)
- Custom agents
- MCP server configurations
- Hooks and automation scripts

The configurations here are designed to be copied to other projects, not to be executed within this repository itself.

## Repository Architecture

This repository follows the standard Claude Code configuration structure:

```
.claude/
├── skills/          # Custom slash commands
├── agents/          # Custom agent definitions
└── settings.json    # Claude Code settings
```

### Key Principles

1. **Generic, Not Project-Specific**: All configurations must work across different project types. Remove project-specific paths, dependencies, or assumptions before adding files here.

2. **Template Repository Pattern**: This is a source repository that other projects pull from. When working here:
   - Test configurations in actual projects first
   - Strip out project-specific details before committing
   - Focus on reusability and portability

3. **No Execution Context**: This repo doesn't have build commands, tests, or runtime code. It only contains configuration files.

## Working with This Repository

### Adding New Configurations

When adding a new skill or agent:
1. Ensure it has been tested in a real project
2. Remove any hardcoded paths or project-specific references
3. Add clear documentation within the file itself
4. Keep naming descriptive and clear

### Structure for New Files

- **Skills**: Place in `.claude/skills/` with `.md` or appropriate extension
- **Agents**: Place in `.claude/agents/` following Claude Code agent specification
- **Settings**: Merge into `.claude/settings.json` (avoid overwriting existing settings)
- **MCP Servers**: Document connection patterns in `mcp-servers/` directory

### Avoiding Common Mistakes

- Don't add project-specific file paths or imports
- Don't include credentials or sensitive data
- Don't create configurations that depend on specific directory structures
- Don't assume specific tech stacks unless clearly documented
