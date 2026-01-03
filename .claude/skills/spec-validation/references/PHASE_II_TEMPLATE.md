# Phase II Spec Template

Reference template showing required structure and content for Phase II specifications.

```markdown
---
name: [feature-name]
description: [Concise 1-2 sentence description of what the feature does]
status: draft | in-review | approved | implemented
type: user-facing | internal | infrastructure | refactoring
owner: [team-or-individual]
---

## Overview

[Brief description of the feature and its value proposition]

### Problem Statement

[What problem does this solve? Who is it for?]

### Success Metrics

[How will we know this feature is successful?]

## Scope

### In Scope

[What is included in this feature? List specific capabilities]

- [Item 1]
- [Item 2]
- [Item 3]

### Out of Scope

[What is explicitly not included? List exclusions to manage expectations]

- [Excluded item 1]
- [Excluded item 2]
- [Excluded item 3]

## User Stories / Use Cases

[Stories or scenarios from user perspective]

1. As a [user type], I want [action], so that [benefit]
2. As a [user type], I want [action], so that [benefit]

## Requirements

### Functional Requirements

[What the system must do]

- [Requirement 1]
- [Requirement 2]

### Non-Functional Requirements

[How the system must behave - performance, security, reliability]

- Performance: [specific metric]
- Security: [specific requirement]
- Reliability: [specific requirement]

## Acceptance Criteria

[Numbered list of testable, measurable criteria]

1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

## Dependencies

### Internal Dependencies

[Other features, services, or systems this depends on]

- [Dependency 1]
- [Dependency 2]

### External Dependencies

[Third-party services, APIs, or systems]

- [Dependency 1]
- [Dependency 2]

## Assumptions and Constraints

[Assumptions made during specification, constraints on implementation]

- [Assumption 1]
- [Constraint 1]

## Open Questions

[Unresolved questions that need answers before implementation]

- [Question 1]

## Related Work

[Links to related specs, PRs, issues, or documents]

- See: [link to plan.md]
- See: [link to tasks.md]
- Related: [other spec or issue]
```

## Required Frontmatter Fields

- **name**: Feature identifier (kebab-case)
- **description**: Concise description (1-2 sentences)
- **status**: draft | in-review | approved | implemented
- **type**: user-facing | internal | infrastructure | refactoring
- **owner**: Team or individual responsible

## Required Body Sections

- **## Overview**: High-level description and problem statement
- **## Scope**: In-scope and out-of-scope items
- **## Acceptance Criteria**: Numbered testable criteria

## Optional Body Sections

- **## User Stories / Use Cases**: User-centered descriptions
- **## Requirements**: Functional and non-functional requirements
- **## Dependencies**: Internal and external dependencies
- **## Assumptions and Constraints**: Context for implementation
- **## Open Questions**: Outstanding items to resolve
- **## Related Work**: Links to other artifacts

## Cross-References

Spec should reference:
- `plan.md`: Implementation plan (created after spec approved)
- `tasks.md`: Detailed implementation tasks (created during planning)

Example reference format:
```
See: [plan.md](./plan.md)
See: [tasks.md](./tasks.md)
```
