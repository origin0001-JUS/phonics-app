---
description: Generate a highly specific prompt file for Claude Code terminal execution
---

# Claude Code Task Generator Workflow

When the user invokes this workflow (e.g. typing `/claude [Task description]`), follow these steps:

1. **Information Gathering**: If the user didn't specify what Claude should do, ask them. If they did, proceed.
2. **Create the Prompt**: Create a file named `CLAUDE_PROMPT_[TaskName].md` in the root directory. This prompt should:
   - List the specific files Claude needs to read or edit.
   - Give step-by-step implementation instructions.
   - Define exact success criteria (e.g., "Run `npm run build` and ensure 0 errors").
3. **Update HANDOFF.md**: Update `HANDOFF.md` to reflect that Claude Code is currently assigned to this new task.
4. **Give Executable Command**: Tell the user to run the exact command in their terminal:
   `claude -p CLAUDE_PROMPT_[TaskName].md`
