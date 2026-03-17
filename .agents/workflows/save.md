---
description: Save current project context to HANDOFF.md before switching AI windows
---

# Save Context Workflow

When the user invokes this workflow (e.g., by typing `/save`), follow these steps precisely:

1. **Analyze Current Progress**: Briefly review the recent actions and accomplishments in the current chat session.
2. **Read Current State**: Check the contents of `HANDOFF.md` and `task.md` (if they exist).
3. **Update HANDOFF.md**: Use the `write_to_file` or `replace_file_content` tool to update `HANDOFF.md`. Update the file to include:
   - **Current Sprint Goal**: What the overall objective currently is.
   - **Latest Updates**: What was just completed in this window.
   - **Next Steps / Pending Tasks**: What needs to happen next.
4. **Confirm**: Use `notify_user` to tell the user that the context is safely stored in `HANDOFF.md`, and they are free to switch to another Antigravity window or Claude Code terminal.
