---
allowed-tools: Bash(git status), Bash(git diff), Bash(git log --oneline -*), Bash(git add *), Bash(git commit *)
description: Smart Git commit with automatic staging and message generation
---

# Smart Git Commit

## Context
- Current git status: !`git status`
- Current git diff: !`git diff`
- Recent commits for style reference: !`git log --oneline -3`

## Your task
Based on the above changes:

1. Analyze the staged and unstaged changes
2. Add all relevant files to staging area
3. Create a meaningful commit message following Conventional Commits format
4. Execute the commit with appropriate message including Claude Code attribution

Follow the project's commit message style and include the standard Claude Code attribution footer.