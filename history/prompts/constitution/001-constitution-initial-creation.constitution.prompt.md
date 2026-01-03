---
id: 1
title: constitution initial creation
stage: constitution
date: 2025-12-31
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: ahmednoorani
command: /sp.constitution
labels: ["constitution","setup","governance"]
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

Write a CONSTITUTION.md for a Phase II, full-stack, spec-driven Todo web application.

This constitution is the highest authority in the repository and must be followed by all specs, plans, agents, and generated code.

The constitution MUST:
- Enforce spec-driven development using Spec-Kit Plus and Claude Code
- Require using Context-7 knowledge to ensure up-to-date technologies, best practices, and modern code patterns
- Prohibit manual coding; all code must be generated via approved specs and Claude Code
- Enforce clean architecture, security by default, and maintainability

Tech Stack (MANDATORY):
- Frontend: Next.js 16+ (App Router)
- Backend: Python, FastAPI, UV package manager
- ORM: SQLModel
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth (JWT-based)
- Spec System: GitHub Spec-Kit + Spec-Kit Plus

Functional Requirements:
- Implement all 5 basic Todo features (add, view, update, delete, toggle complete)
- Build a responsive web frontend
- Create RESTful API endpoints
- Persist data in Neon PostgreSQL
- Support multi-user authentication and strict user isolation

API Rules:
- All API endpoints require a valid JWT
- JWT must be sent via Authorization: Bearer <token>
- User identity must be derived from the JWT, not trusted from request params
- All task queries must be filtered by the authenticated user
- Unauthorized requests must return 401

Auth Integration Rules:
- Better Auth runs on the frontend
- Better Auth must issue JWT tokens
- FastAPI must verify JWT using a shared secret (BETTER_AUTH_SECRET)
- Task ownership must be enforced on every operation

Repository & Monorepo Rules:
- Specs live under /specs using Spec-Kit structure
- Frontend and backend exist in a single monorepo
- Root CLAUDE.md governs the project
- Frontend and backend have their own CLAUDE.md files
- Specs are authoritative over code

The constitution MUST include sections for:
1. Purpose & Authority
2. Development Philosophy
3. Spec Governance Rules
4. Security & Authentication Rules
5. API & Data Ownership Rul

## Response snapshot

Created comprehensive constitution v1.0.0 at `.specify/memory/constitution.md` with 7 core principles:

1. **Spec-Driven Development (NON-NEGOTIABLE)** - All work starts with specs, manual coding prohibited
2. **Context-7 Knowledge First** - All tech decisions verified via Context-7 MCP
3. **No Manual Coding** - All code generated via Claude Code executing approved specs
4. **Clean Architecture & Maintainability** - Strict separation of concerns, testability
5. **Security by Default (NON-NEGOTIABLE)** - JWT auth required, user isolation enforced
6. **Modern Tech Stack Adherence** - Next.js 16+, FastAPI, SQLModel, Neon, Better Auth (all mandatory)
7. **User Isolation & Data Ownership** - Every query filtered by user_id, cross-user access is critical violation

Key sections added:
- Purpose & Authority: Constitution is supreme authority over all specs, plans, code
- Spec Governance Rules: Approval gates, amendment process, validation requirements
- Security & Authentication Rules: JWT flow, endpoint security, data security
- API & Data Ownership Rules: RESTful design, ownership enforcement, prohibited patterns
- Tech Stack Mandates: Detailed tech requirements for frontend, backend, database, auth, spec system
- Monorepo Structure & Governance: Repository layout, development workflow, spec authority
- Functional Requirements: 5 core todo features + technical requirements
- Governance: Amendment process, compliance review, complexity justification

Constitution defines:
- Version 1.0.0 (initial ratification)
- Ratified: 2025-12-31
- Full sync impact report included (HTML comment at top)
- Template validation: All templates (spec, plan, tasks, phr) aligned

## Outcome

- ✅ Impact: Established constitutional foundation for Phase II Todo application with 7 non-negotiable principles
- 🧪 Tests: None (constitution creation)
- 📁 Files: Created .specify/memory/constitution.md (593 lines)
- 🔁 Next prompts: /sp.specify to create first feature spec
- 🧠 Reflection: Constitution successfully enforces spec-driven development, security-first approach, and mandatory tech stack. Templates aligned. Ready for feature development.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test /sp.specify workflow to validate constitution compliance
