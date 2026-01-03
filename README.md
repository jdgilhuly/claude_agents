# Claude Agents Master Setup

This repository contains the master configuration for Claude Code agents and slash commands (skills) that can be easily added to any project.

## Purpose

This is a centralized template repository for:
- Custom Claude Code agents
- Slash commands (skills)
- MCP server configurations
- Hooks and automation scripts

Instead of recreating these configurations for each project, you can copy them from this master repository.

## Repository Structure

```
claude_agents/
├── .claude/
│   ├── skills/          # Custom slash commands
│   ├── agents/          # Custom agent definitions
│   └── settings.json    # Claude Code settings
├── .claude-code/        # Alternative configuration location
└── mcp-servers/         # MCP server configurations
```

## Usage

### Adding to a New Project

1. **Copy the entire `.claude` directory** to your project:
   ```bash
   cp -r /path/to/claude_agents/.claude /path/to/your-project/
   ```

2. **Or copy specific components**:
   ```bash
   # Just skills
   cp -r /path/to/claude_agents/.claude/skills /path/to/your-project/.claude/

   # Just agents
   cp -r /path/to/claude_agents/.claude/agents /path/to/your-project/.claude/
   ```

3. **Customize for your project** as needed

### Syncing Updates

When you create a new agent or skill that you want to reuse across projects:

1. Add it to this repository first
2. Commit and push the changes
3. Pull updates into other projects as needed

## What to Store Here

### Skills (Slash Commands)
- Reusable workflows (commit messages, PR creation, code review)
- Project setup automation
- Common refactoring patterns

### Agents
- Specialized agents for specific tasks
- Custom agent configurations with specific tool access

### Hooks
- Pre-commit automation
- User prompt enhancements
- Tool call interceptors

### MCP Servers
- Shared MCP server configurations
- Connection settings for common services

## Best Practices

1. **Keep it generic**: Avoid project-specific configurations
2. **Document well**: Each agent/skill should have clear usage instructions
3. **Version control**: Commit working configurations only
4. **Test first**: Verify agents/skills work before adding them here
5. **Stay organized**: Use clear naming and directory structure

## Quick Reference

### Creating a New Skill
```bash
mkdir -p .claude/skills
# Create your skill file in .claude/skills/
```

### Creating a New Agent
```bash
mkdir -p .claude/agents
# Create your agent definition in .claude/agents/
```

### Claude Code Documentation
- Skills: https://docs.claude.com/claude-code/skills
- Agents: https://docs.claude.com/claude-code/agents
- MCP Servers: https://docs.claude.com/claude-code/mcp

## Contributing to This Repo

When you create something useful in another project:

1. Test it thoroughly
2. Remove project-specific details
3. Add it to this repository
4. Update this README if needed

## Notes

- This is a personal template repository
- Configurations here should work across different project types
- Keep sensitive data out of this repository
