#!/usr/bin/env python3
"""
Validate Phase II specification files for completeness and quality.
Automated checks for required sections, cross-references, and placeholders.
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

# Configure UTF-8 output for Windows compatibility
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class SpecValidator:
    """Validates Phase II specs against quality standards."""

    REQUIRED_FRONTMATTER_FIELDS = ['name', 'description', 'status', 'type', 'owner']
    REQUIRED_BODY_SECTIONS = [
        '## Overview',
        '## Scope',
        '## Acceptance Criteria'
    ]
    PLACEHOLDER_PATTERNS = [
        r'\{\{[^}]+\}\}',      # {{TODO}}, {{placeholder}}, etc.
        r'\[TODO\]',            # [TODO]
        r'\[TBD\]',             # [TBD]
        r'FIXME:',              # FIXME:
        r'^TODO:',              # Lines starting with TODO:
    ]

    def __init__(self, spec_path: Path):
        self.spec_path = spec_path.resolve()
        self.spec_dir = spec_path.parent
        self.content = self.spec_path.read_text(encoding='utf-8')
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed_checks: List[str] = []

    def validate(self) -> bool:
        """Run all validation checks."""
        print(f"\n{'='*60}")
        print(f"Validating: {self.spec_path}")
        print(f"{'='*60}\n")

        # Run checks
        self._check_file_exists()
        self._check_frontmatter()
        self._check_required_sections()
        self._check_placeholders()
        self._check_cross_references()

        # Report results
        self._report_results()

        return len(self.errors) == 0

    def _check_file_exists(self):
        """Check if spec file exists."""
        if not self.spec_path.exists():
            self.errors.append(f"Spec file not found: {self.spec_path}")
            return
        self.passed_checks.append("File exists")

    def _check_frontmatter(self):
        """Check YAML frontmatter completeness."""
        # Extract frontmatter (between --- markers)
        frontmatter_match = re.match(r'^---\n(.*?)\n---', self.content, re.DOTALL)
        if not frontmatter_match:
            self.errors.append("Missing YAML frontmatter (must be enclosed in --- markers)")
            return

        frontmatter = frontmatter_match.group(1)
        missing_fields = []
        for field in self.REQUIRED_FRONTMATTER_FIELDS:
            if f'{field}:' not in frontmatter:
                missing_fields.append(field)

        if missing_fields:
            self.errors.append(f"Missing required frontmatter fields: {', '.join(missing_fields)}")
        else:
            self.passed_checks.append("Required frontmatter fields present")

    def _check_required_sections(self):
        """Check that required body sections exist."""
        missing_sections = []
        for section in self.REQUIRED_BODY_SECTIONS:
            if section not in self.content:
                missing_sections.append(section)

        if missing_sections:
            self.errors.append(f"Missing required sections: {', '.join(missing_sections)}")
        else:
            self.passed_checks.append("Required body sections present")

    def _check_placeholders(self):
        """Check for unresolved placeholders."""
        placeholder_lines = []

        for line_num, line in enumerate(self.content.split('\n'), start=1):
            for pattern in self.PLACEHOLDER_PATTERNS:
                if re.search(pattern, line):
                    placeholder_lines.append(f"  Line {line_num}: {line.strip()}")
                    break

        if placeholder_lines:
            self.errors.append(f"Unresolved placeholders found:\n" + "\n".join(placeholder_lines))
        else:
            self.passed_checks.append("No unresolved placeholders")

    def _check_cross_references(self):
        """Check cross-references to plan.md and tasks.md."""
        cross_refs_ok = True

        # Check for plan.md reference
        if 'plan.md' in self.content:
            plan_path = self.spec_dir / 'plan.md'
            if plan_path.exists():
                self.passed_checks.append("plan.md reference valid")
            else:
                self.warnings.append("plan.md referenced but file does not exist")
                cross_refs_ok = False
        else:
            self.warnings.append("No reference to plan.md found")

        # Check for tasks.md reference
        if 'tasks.md' in self.content:
            tasks_path = self.spec_dir / 'tasks.md'
            if tasks_path.exists():
                self.passed_checks.append("tasks.md reference valid")
            else:
                self.warnings.append("tasks.md referenced but file does not exist")
                cross_refs_ok = False
        else:
            self.warnings.append("No reference to tasks.md found")

        if cross_refs_ok and ('plan.md' in self.content or 'tasks.md' in self.content):
            self.passed_checks.append("Cross-references valid")

    def _report_results(self):
        """Print validation results."""
        total_checks = len(self.passed_checks) + len(self.errors) + len(self.warnings)
        pass_count = len(self.passed_checks)

        # Overall status
        if len(self.errors) > 0:
            status = "FAIL"
        else:
            status = "PASS"

        print(f"{'='*60}")
        print(f"Status: {status} ({pass_count}/{total_checks} checks passed)")
        print(f"{'='*60}\n")

        # Passed checks
        if self.passed_checks:
            print("PASSED CHECKS:")
            for check in self.passed_checks:
                print(f"  ✓ {check}")
            print()

        # Warnings
        if self.warnings:
            print("WARNINGS:")
            for warning in self.warnings:
                print(f"  ⚠ {warning}")
            print()

        # Errors
        if self.errors:
            print("ERRORS:")
            for error in self.errors:
                print(f"  ✗ {error}")
            print()

        # Manual review guidance
        print("MANUAL REVIEW REQUIRED:")
        print("  - Completeness: Check scope, dependencies, non-goals")
        print("  - Consistency: Verify acceptance criteria align with scope")
        print("  - Quality: Ensure acceptance criteria are testable and measurable")
        print("  - See references/ACCEPTANCE_CRITERIA_GUIDE.md for detailed guidance\n")


def main():
    parser = argparse.ArgumentParser(
        description='Validate Phase II specification files'
    )
    parser.add_argument(
        'spec_file',
        type=Path,
        help='Path to spec.md file to validate'
    )

    args = parser.parse_args()

    validator = SpecValidator(args.spec_file)
    success = validator.validate()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
