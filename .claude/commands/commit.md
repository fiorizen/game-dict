---
allowed-tools: Bash(git status), Bash(git diff), Bash(git log --oneline -*), Bash(git add *), Bash(git commit *)
description: Quick commit - equivalent to "OK コミットして" 
---

# Quick Commit (OK コミットして)

## Context
!`git status && echo "--- DIFF ---" && git diff && echo "--- RECENT COMMITS ---" && git log --oneline -5`

## Your task
Immediately execute a commit workflow:
1. Stage all modified files
2. Generate appropriate commit message based on changes
3. Commit with Claude Code attribution
4. Confirm completion

This is the automated equivalent of "OK コミットして" - perform the commit operation without additional questions or confirmation.