---
id: 4
title: constitution agent and tool mandates
stage: constitution
date: 2025-12-31
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 006-foundation-spec
user: ahmednoorani
command: /sp.constitution add one more thing important that if it need to use browser so he should use skills i added in this project .claude folder and if he need contet about any code then it should use context7 skill also i have agents for backend frontend and spec authority so it should use that too
labels: ["constitution","agents","tools","browser-use","context7"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - None
---

## Prompt

add one more thing important that if it need to use browser so he should use skills i added in this project .claude folder and if he need contet about any code then it should use context7 skill also i have agents for backend frontend and spec authority so it should use that too

## Response snapshot

Updated constitution from v1.1.1 to v1.2.0 (MINOR bump) to mandate the use of specialized agents and specific tools for development, research, and browser interaction.

**Key Changes**:
- **Specialized Agents (Principle VIII)**: Mandated use of `backend-auth-guardian`, `secure-frontend-developer`, and `spec-authority`.
- **Resource/Tool Discipline (Principle IX)**: Mandated use of project-specific browser skills in `.claude` folder and `context7-efficient` for all code documentation/research.
- **Context-7 Integration (Principle II)**: Expanded Principle II to explicitly require the `context7-efficient` skill for all code/library information gathering.
- **Tech Stack Alignment**: Explicitly assigned specialized agents to their respective layers (Frontend -> `secure-frontend-developer`, Backend -> `backend-auth-guardian`, Spec System -> `spec-authority`).

## Outcome

- ✅ Impact: Constitution v1.2.0 ratified with strict agent and tool mandates. Ensures high specialization and context-aware tool use.
- 🧪 Tests: None (constitution refinement).
- 📁 Files: Updated .specify/memory/constitution.md.
- 🔁 Next prompts: Continue implementation tasks using the mandated agents.
- 🧠 Reflection: Successfully incorporated user feedback to ensure specialized sub-agents and optimized tools (Context7, browser skills) are used. This reduces risk and improves engineering quality.

## Evaluation notes (flywheel)

- Failure modes observed: None.
- Graders run and results (PASS/FAIL): N/A.
- Prompt variant (if applicable): N/A.
- Next experiment (smallest change to try): Verify agents proactively invoke their specialized counterparts for sub-tasks.
