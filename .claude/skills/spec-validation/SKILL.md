---
name: spec-validation
description: Validate Phase II specifications for completeness, internal consistency, and readiness before implementation begins. Use when (1) Creating or reviewing Phase II specs (specs/<feature>/spec.md), (2) Preparing to implement a feature and need to verify spec quality, (3) Running spec review ceremonies, or (4) Ensuring spec-authority gate passes before proceeding with implementation.
---

# Spec Validation Skill

Validates Phase II specs against quality standards using automated checks and manual review guidance.

## Quick Start

Run automated validation:
```bash
python .claude/skills/spec-validation/scripts/validate_spec.py <path/to/spec.md>
```

Then review the output and address any issues manually before proceeding with implementation.

## When to Use This Skill

Trigger this skill when:
- A Phase II spec is complete and needs review
- Before starting `/sp.implement` or any implementation work
- During spec review ceremonies or gate reviews
- After major updates to an existing spec
- When `spec-authority` agent raises concerns about spec quality

## Validation Process

### Step 1: Run Automated Checks

Execute the validation script on the spec file:
```bash
python .claude/skills/spec-validation/scripts/validate_spec.py specs/<feature-name>/spec.md
```

The script performs these automated checks:
- Required sections present (frontmatter and body structure)
- Cross-references to plan.md and tasks.md exist and are valid
- No unresolved placeholders like `{{TODO}}`, `[TBD]`, `TODO:`, `FIXME:`
- YAML frontmatter is well-formed with required fields
- Acceptance criteria section exists with numbered criteria

### Step 2: Review Validation Report

The script outputs:
```
PASS/FAIL: <overall status>
✓ Required sections present
✗ Unresolved placeholders found in line 45
✓ Cross-references valid
...

Detailed findings:
[Section-by-section breakdown]
```

### Step 3: Manual Qualitative Review

Even if automated checks pass, perform manual review of these aspects:

#### Completeness Review
Check that spec includes:
- Clear feature scope and boundaries
- User stories or use cases
- Acceptance criteria that are testable and measurable
- Dependencies (internal and external)
- Non-goals or exclusions
- Success metrics (if applicable)

#### Consistency Review
Verify:
- Acceptance criteria align with feature scope
- Dependencies listed are realistic and complete
- Language is consistent (terms used consistently)
- No contradictions within the spec
- Cross-references to plan.md/tasks.md are accurate

#### Acceptance Criteria Quality
Each acceptance criterion should:
- Be concrete and unambiguous
- Be verifiable by test or inspection
- Not include implementation details
- Use measurable language (e.g., "less than 500ms" not "fast")
- Map to a deliverable outcome

See [ACCEPTANCE_CRITERIA_GUIDE.md](references/ACCEPTANCE_CRITERIA_GUIDE.md) for detailed guidance.

### Step 4: Address Findings

For each validation finding:
- **Automated errors**: Fix spec directly (missing sections, placeholders, broken links)
- **Manual concerns**: Update spec to clarify or add missing information
- **Implementation assumptions**: Remove from spec or move to plan.md

Re-run validation script after fixes.

### Step 5: Gate Decision

The skill reports findings but does **not block** implementation. It's the user's decision whether:
- Spec is ready for implementation → Proceed with `/sp.implement`
- Spec needs refinement → Address findings and revalidate
- Critical issues exist → Hold implementation until resolved

## Common Validation Issues

### Missing Required Sections
Automated check fails. Add missing sections to spec.md frontmatter and body.

### Unresolved Placeholders
Automated check fails. Replace all `{{TODO}}`, `[TBD]`, `FIXME:` markers with actual content.

### Broken Cross-References
Automated check fails. Ensure referenced files exist (plan.md, tasks.md) and paths are correct.

### Vague Acceptance Criteria
Manual concern. Rewrite using specific, measurable language. See [ACCEPTANCE_CRITERIA_GUIDE.md](references/ACCEPTANCE_CRITERIA_GUIDE.md).

### Implementation Details in Spec
Manual concern. Move implementation details to plan.md; keep spec focused on requirements and behavior.

### Incomplete Dependencies
Manual concern. Add missing dependencies or clarify scope to remove unnecessary ones.

## Integration with Other Skills

This skill works alongside:
- **spec-authority**: Enforces spec quality gate before implementation
- **sp.specify**: Creates the spec being validated
- **sp.plan**: Uses validated spec to create implementation plan
- **sp.implement**: Requires validated spec as input

Best practice: Run validation after `/sp.specify` completes but before `/sp.plan` begins.

## Reference Materials

- [ACCEPTANCE_CRITERIA_GUIDE.md](references/ACCEPTANCE_CRITERIA_GUIDE.md): Detailed guidance on writing testable acceptance criteria
- [PHASE_II_TEMPLATE.md](references/PHASE_II_TEMPLATE.md): Reference template showing required spec structure
