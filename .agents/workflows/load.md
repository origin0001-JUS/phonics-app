---
description: Load project context from HANDOFF.md when starting a new AI window
---

# Load Context Workflow

When the user invokes this workflow (e.g., by typing `/load`), follow these steps precisely:

1. **Read Core Files**: Use the `view_file` tool to immediately read `HANDOFF.md`. Also read the master `task.md` (or `CLAUDE_TASKS.md` depending on what provides the best current overview).
2. **Synchronize**: Quickly analyze the `HANDOFF.md` file to understand what other agents (terminals, other windows) are currently doing and what the most urgent pending tasks are.
3. **Report & Propose**: Inform the user of the current project state (a very brief 2-3 line summary). Detail the tasks that are currently "Up Next".
4. **Action**: Ask the user: "Which of these tasks should I (this window) take on right now?" Wait for their response to begin execution.
