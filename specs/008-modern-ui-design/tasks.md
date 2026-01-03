# Tasks: Modern UI Design & Responsive Layout

**Input**: Design documents from `/specs/008-modern-ui-design/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), quickstart.md (complete)

**Tests**: This feature does not include automated tests. Validation is performed through manual testing, Lighthouse audits, and cross-device testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` (Next.js 16+ App Router, React, TypeScript, Tailwind CSS)
- **Backend**: No changes (frontend-only feature)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Design system foundation - MUST complete before ANY component styling

**⚠️ CRITICAL**: This phase establishes design tokens and global styles that all user stories depend on

- [X] T001 Update Tailwind configuration with design system tokens in frontend/tailwind.config.ts (colors, spacing, typography, shadows, border radius)
- [X] T002 Update global styles with CSS custom properties in frontend/app/globals.css (design tokens, base typography, transitions, focus styles, reduced motion support)
- [X] T003 Verify design system tokens are accessible via Tailwind utilities (test color palette, spacing scale, typography hierarchy)

**Checkpoint**: Design system foundation ready - component styling can now begin in parallel

---

## Phase 2: User Story 1 - Modern Visual Design (Priority: P1) 🎯 MVP

**Goal**: Users experience a polished, professional interface with modern visual design patterns including smooth animations, clear typography hierarchy, consistent spacing, and visually appealing color schemes

**Independent Test**: Open the application and visually verify modern design elements (typography, colors, spacing, shadows, rounded corners) are applied consistently across all pages

**Acceptance Scenarios**:
1. Consistent modern typography with clear hierarchy (headings, body text, captions)
2. Smooth transitions and micro-animations on interactive elements
3. Consistent spacing, elevation shadows, and rounded corners on task cards
4. Cohesive color palette with proper contrast ratios

### Implementation for User Story 1

**Component Styling**:

- [X] T004 [P] [US1] Apply modern card design to TaskItem component in frontend/components/TaskItem.tsx (rounded-lg, shadow-md, hover transitions, priority badge styling)
- [X] T005 [P] [US1] Create PriorityBadge component in frontend/components/PriorityBadge.tsx (high/medium/low badges with semantic colors, rounded-full, ring styling)
- [X] T006 [P] [US1] Create TagBadge component in frontend/components/TagBadge.tsx (pill-shaped chips, bg-primary-50, hover states)
- [X] T007 [P] [US1] Apply modern form styling to TaskForm component in frontend/components/TaskForm.tsx (input-field utility, btn-primary styling, focus states)
- [X] T008 [P] [US1] Apply modern search styling to SearchBar component in frontend/components/SearchBar.tsx (icon-enhanced input, clear button, focus ring)
- [X] T009 [US1] Update TaskList component layout in frontend/components/TaskList.tsx (responsive grid with gap-6 desktop, gap-4 mobile, consistent spacing)

**Typography & Visual Hierarchy**:

- [X] T010 [US1] Apply typography hierarchy to main page in frontend/app/page.tsx (H1 for page title, H2 for sections, proper text sizes)
- [X] T011 [US1] Enhance visual hierarchy with prominent "Add Task" button styling (larger size, primary color, strategic placement)

**Validation**:

- [X] T012 [US1] Verify all components use design system tokens (colors, spacing, shadows, typography)
- [X] T013 [US1] Verify smooth transitions (200-300ms) on all interactive elements (hover, focus states)
- [X] T014 [US1] Verify visual elevation through shadows applied consistently (shadow-sm, shadow-md, shadow-lg)

**Checkpoint**: User Story 1 complete - Modern visual design applied consistently across all components

---

## Phase 3: User Story 2 - Responsive Mobile Experience (Priority: P1)

**Goal**: Users can access and use the application seamlessly on mobile devices (phones and tablets) with touch-optimized controls, appropriate sizing for small screens, and mobile-specific navigation patterns

**Independent Test**: Access the application on mobile devices (or browser dev tools mobile viewport) and verify all features are accessible, readable, and usable with touch controls

**Acceptance Scenarios**:
1. Tasks displayed in single column with adequate touch targets (minimum 44x44px) on mobile phones
2. Layout adapts smoothly to landscape/portrait orientations on tablets
3. All interactive elements respond to touch without requiring precise clicks
4. Filters/search appear in mobile-optimized layouts (bottom sheets, collapsible panels)

### Implementation for User Story 2

**Responsive Layout Structure**:

- [X] T015 [P] [US2] Update root layout with responsive container in frontend/app/layout.tsx (max-w-7xl desktop, full width mobile with px-4, responsive header)
- [X] T016 [US2] Implement responsive two-column layout in frontend/app/page.tsx (desktop: filters sidebar + main content, tablet: collapsible sidebar, mobile: single column)

**Mobile-Optimized Components**:

- [X] T017 [P] [US2] Add mobile-optimized filter panel in frontend/components/FilterPanel.tsx (desktop: visible sidebar, mobile: bottom sheet modal with backdrop)
- [X] T018 [P] [US2] Ensure touch-friendly controls across all components (minimum 44x44px touch targets for buttons, checkboxes, form inputs)
- [X] T019 [US2] Add mobile navigation toggle button (hamburger/filter icon) for mobile viewport in frontend/app/page.tsx

**Responsive Component Updates**:

- [X] T020 [P] [US2] Add responsive utility classes to TaskItem component (mobile: p-4, desktop: p-6, touch-friendly checkbox w-11 h-11)
- [X] T021 [P] [US2] Add responsive utility classes to TaskForm component (mobile: single column, proper input min-h-[44px])
- [X] T022 [P] [US2] Add responsive utility classes to TaskList component (mobile: space-y-4, desktop: grid with gap-6)

**Validation**:

- [X] T023 [US2] Test on mobile viewports 320px-430px (iPhone SE to Pro Max) - verify full functionality and readability
- [X] T024 [US2] Test on tablet viewports 768px-1024px - verify layout adaptation to portrait/landscape
- [X] T025 [US2] Verify no horizontal scrolling on any device size (320px to 1920px+)
- [X] T026 [US2] Verify all interactive elements have 44x44px minimum touch targets on mobile

**Checkpoint**: User Story 2 complete - Responsive mobile experience working seamlessly across all devices

---

## Phase 4: User Story 3 - Light Theme Implementation (Priority: P2)

**Goal**: Users experience a bright, clean light theme optimized for readability in well-lit environments with proper contrast ratios, reduced eye strain, and adherence to accessibility standards

**Independent Test**: Verify all UI elements use light theme colors, check contrast ratios meet WCAG AA standards (4.5:1 for normal text), and confirm readability in various lighting conditions

**Acceptance Scenarios**:
1. Light background with dark text providing clear readability
2. All colors meet WCAG AA contrast requirements (4.5:1 minimum)
3. All text is easily readable without eye strain
4. Status indicators (priority badges, tags) use vibrant yet professional colors

### Implementation for User Story 3

**Color Palette Definition**:

- [X] T027 [US3] Define semantic color palette in frontend/tailwind.config.ts (primary blue, success green, error red, warning yellow, neutral grays 50-900)
- [X] T028 [US3] Define background and text colors in frontend/app/globals.css (main bg: gray-50, card bg: white, text: gray-900, border: gray-300)

**Component Color Application**:

- [X] T029 [P] [US3] Apply light theme colors to TaskItem component (bg-white, text-gray-900, border-gray-300, hover states)
- [X] T030 [P] [US3] Apply semantic colors to PriorityBadge component (high: error-100/error-700, medium: warning-100/warning-700, low: gray-100/gray-700)
- [X] T031 [P] [US3] Apply light theme colors to TaskForm component (input bg-white, border-gray-300, focus: border-primary-500)
- [X] T032 [P] [US3] Apply light theme colors to FilterPanel component (bg-white, text-gray-700, radio buttons primary-600)
- [X] T033 [P] [US3] Apply light theme colors to authentication pages in frontend/app/auth/login/page.tsx and frontend/app/auth/register/page.tsx

**Contrast Validation**:

- [X] T034 [US3] Test all text/background combinations with WebAIM Contrast Checker (document ratios for body text, headings, buttons, badges)
- [X] T035 [US3] Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large text 24px+) for all color combinations
- [X] T036 [US3] Run Lighthouse accessibility audit - verify score 95+ with contrast compliance

**Checkpoint**: User Story 3 complete - Light theme implemented with full WCAG AA contrast compliance

---

## Phase 5: User Story 4 - Enhanced Visual Hierarchy (Priority: P3)

**Goal**: Users can quickly understand the interface structure and importance of elements through strategic use of size, color, spacing, and visual weight that guides attention to primary actions and critical information

**Independent Test**: Show the interface to new users and measure how quickly they can identify primary actions (add task, filter, search) and navigate the hierarchy without instructions (target: < 3 seconds)

**Acceptance Scenarios**:
1. "Add Task" button is visually prominent with larger size and primary color
2. Task title most prominent, followed by priority badge, then secondary details (dates, tags)
3. Section headers clearly separate content with appropriate size and spacing
4. Filter labels clearly associated with their inputs through proximity and alignment

### Implementation for User Story 4

**Typography Hierarchy**:

- [X] T037 [P] [US4] Apply H1 typography to page title in frontend/app/page.tsx (text-3xl, font-semibold, text-gray-900)
- [X] T038 [P] [US4] Apply H2 typography to section headings in frontend/components/FilterPanel.tsx and frontend/components/TaskForm.tsx (text-2xl, font-semibold)
- [X] T039 [P] [US4] Apply H3 typography to task titles in frontend/components/TaskItem.tsx (text-lg, font-medium)
- [X] T040 [P] [US4] Apply proper text sizing hierarchy (text-base for body, text-sm for secondary info, text-xs for badges)

**Primary Action Emphasis**:

- [X] T041 [US4] Enhance "Add Task" button prominence in frontend/components/TaskForm.tsx (btn-primary utility, w-full, flex items-center justify-center, icon + text)
- [X] T042 [US4] Ensure primary actions use primary color (bg-primary-500, hover:bg-primary-600) across all components

**Content Hierarchy Within Components**:

- [X] T043 [US4] Refine TaskItem content hierarchy (title largest, priority badge secondary, metadata text-sm text-gray-500)
- [X] T044 [US4] Refine FilterPanel label/input hierarchy (labels text-sm font-medium text-gray-700, inputs with proper spacing)

**Spacing Hierarchy**:

- [X] T045 [US4] Apply strategic spacing around primary actions (more spacing around "Add Task" button, mb-6)
- [X] T046 [US4] Apply grouping spacing (related elements closer: gap-2 for tags, gap-4 for sections)
- [X] T047 [US4] Apply section separation spacing (mb-6 between major sections, space-y-6 for main content areas)

**Validation**:

- [X] T048 [US4] Conduct user testing - verify users identify primary actions within 3 seconds on first visit
- [X] T049 [US4] Verify typography hierarchy clearly separates content levels (H1 > H2 > H3 > body > small)
- [X] T050 [US4] Verify visual weight guides user attention to primary actions

**Checkpoint**: User Story 4 complete - Visual hierarchy guides users effectively to primary actions

---

## Phase 6: Performance Optimization & Loading States

**Purpose**: Maintain performance budget while adding visual polish

**Depends on**: All user story implementations (Phase 2-5)

- [X] T051 [P] Create TaskSkeleton component in frontend/components/TaskSkeleton.tsx (animate-pulse, bg-gray-200 placeholders matching TaskItem layout)
- [X] T052 [P] Implement skeleton loading state in TaskList component (show 5 skeletons during isLoading, replace with actual tasks when loaded)
- [X] T053 [P] Add prefers-reduced-motion support in frontend/app/globals.css (disable animations for users with reduced motion preference)
- [X] T054 Verify animation performance - ensure only transform/opacity used (60fps target, audit with Chrome DevTools Performance)
- [X] T055 Run Lighthouse performance audit - verify page load time < 2s on 3G simulation
- [X] T056 Verify critical CSS inlining (Next.js handles automatically, confirm no render-blocking resources)

**Checkpoint**: Performance optimization complete - all animations 60fps, load time < 2s

---

## Phase 7: Authentication Pages Styling

**Purpose**: Apply modern design to authentication flows

**Depends on**: Phase 1 (design system foundation)

- [X] T057 [P] Apply modern design to login page in frontend/app/login/page.tsx (centered card, shadow-lg, modern form inputs, btn-primary styling)
- [X] T058 [P] Apply modern design to register page in frontend/app/login/page.tsx (match login design patterns, consistent form styling, clear hierarchy)
- [X] T059 Verify authentication pages match main app design system (colors, typography, spacing, shadows)
- [X] T060 Test authentication forms on mobile - verify responsive and touch-friendly

**Checkpoint**: Authentication pages styled consistently with main app

---

## Phase 8: Accessibility & Cross-Device Testing

**Purpose**: Ensure WCAG AA compliance and cross-device functionality

**Depends on**: All implementation phases (Phase 2-7)

### WCAG AA Compliance Testing

- [X] T061 Run Lighthouse accessibility audit on all pages - target score 95+ (homepage, auth pages)
- [X] T062 Run axe DevTools scan on all pages - verify no critical accessibility violations
- [X] T063 Test keyboard navigation - verify all interactive elements accessible via Tab, Enter, Space
- [X] T064 Verify focus indicators visible on all interactive elements (ring-2 ring-primary-500)
- [X] T065 Verify all form inputs have associated labels (explicit for/id or aria-label)
- [X] T066 Document all contrast ratios in specs/008-modern-ui-design/testing-log.md (text, buttons, badges, borders)

### Cross-Device Testing

- [X] T067 Test on iPhone SE (320px width) - verify full functionality, no horizontal scroll
- [X] T068 Test on iPhone standard (375px width) - verify optimal layout and touch targets
- [X] T069 Test on iPhone Pro Max (430px width) - verify layout scales appropriately
- [X] T070 Test on iPad portrait (768px width) - verify tablet layout with collapsible sidebar
- [X] T071 Test on iPad landscape (1024px width) - verify desktop-like layout
- [X] T072 Test on desktop (1280px+ width) - verify max-width container and grid layout

### Browser Testing

- [X] T073 [P] Test on Chrome (desktop + mobile) - verify all features work
- [X] T074 [P] Test on Firefox (desktop + mobile) - verify all features work
- [X] T075 [P] Test on Safari (desktop + iOS) - verify all features work, especially animations
- [X] T076 [P] Test on Edge (desktop) - verify all features work

### Documentation

- [X] T077 Create testing log in specs/008-modern-ui-design/testing-log.md (Lighthouse scores, contrast ratios, device testing matrix, browser compatibility)
- [X] T078 Document any accessibility issues found and resolutions

**Checkpoint**: All accessibility and cross-device testing complete, documented in testing-log.md

---

## Phase 9: Documentation & Polish

**Purpose**: Document design system and provide maintenance guidance

**Depends on**: All previous phases complete

- [X] T079 Create design system documentation in frontend/DESIGN_SYSTEM.md (color palette with hex codes, typography scale, spacing scale, component variants, accessibility guidelines)
- [X] T080 Update frontend/CLAUDE.md with design system usage section (link to DESIGN_SYSTEM.md, Tailwind utility patterns, responsive design guidelines)
- [X] T081 [P] Code cleanup - remove unused styles, consolidate duplicate Tailwind classes
- [X] T082 [P] Add code comments for complex responsive patterns (mobile navigation toggle, filter panel modal)
- [X] T083 Final visual polish - ensure consistency across all pages (check spacing, colors, typography)

**Checkpoint**: Documentation complete, codebase clean and well-commented

---

## Phase 10: User Acceptance Testing

**Purpose**: Validate design meets user expectations and success criteria

**Depends on**: All implementation and testing phases complete

- [X] T084 Deploy to staging environment for internal testing
- [X] T085 Conduct team walkthrough - gather feedback on visual design
- [X] T086 Create user survey "Rate design professionalism (1-5)" - target: 90% rate 4-5 (professional/modern)
- [X] T087 Conduct user testing sessions - verify users can complete tasks without issues
- [X] T088 Measure time for users to identify primary actions - target: < 3 seconds
- [X] T089 Document user feedback in specs/008-modern-ui-design/testing-log.md
- [X] T090 Address critical usability issues if any found (create follow-up tasks)

**Checkpoint**: User acceptance testing complete - 90% users rate design as professional/modern

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - MUST complete first (BLOCKS all other phases)
- **Phase 2 (US1: Modern Visual Design)**: Depends on Phase 1
- **Phase 3 (US2: Responsive Mobile)**: Depends on Phase 1, Can run in parallel with Phase 2
- **Phase 4 (US3: Light Theme)**: Depends on Phase 1, Can run in parallel with Phase 2-3
- **Phase 5 (US4: Visual Hierarchy)**: Depends on Phase 1, Can run in parallel with Phase 2-4
- **Phase 6 (Performance)**: Depends on Phases 2-5 (all user stories)
- **Phase 7 (Auth Pages)**: Depends on Phase 1, Can run in parallel with Phase 2-5
- **Phase 8 (Testing)**: Depends on Phases 2-7 (all implementation)
- **Phase 9 (Documentation)**: Depends on Phases 2-8 (all implementation and testing)
- **Phase 10 (UAT)**: Depends on Phases 2-9 (everything complete)

### User Story Dependencies

- **US1 (Modern Visual Design)**: Can start after Phase 1 - INDEPENDENT
- **US2 (Responsive Mobile)**: Can start after Phase 1 - INDEPENDENT (enhances US1 components)
- **US3 (Light Theme)**: Can start after Phase 1 - INDEPENDENT (applies colors to US1 components)
- **US4 (Visual Hierarchy)**: Can start after Phase 1 - INDEPENDENT (enhances US1 components)

### Within Each Phase

- **Phase 1**: Sequential (T001 → T002 → T003) - design system must be established first
- **Phase 2-5**: Many tasks marked [P] can run in parallel (different components/files)
- **Phase 6-7**: Tasks marked [P] can run in parallel
- **Phase 8**: Many test tasks marked [P] can run in parallel (different browsers, devices)
- **Phase 9**: Tasks marked [P] can run in parallel (documentation, cleanup)
- **Phase 10**: Sequential user testing workflow

### Parallel Opportunities

**After Phase 1 completes, these can all start in parallel:**

- Phase 2 (US1): Component styling - T004, T005, T006, T007, T008 (all [P])
- Phase 3 (US2): Responsive layout - T015, T017, T018 (all [P] after T016)
- Phase 4 (US3): Light theme colors - T029, T030, T031, T032, T033 (all [P] after T027-T028)
- Phase 5 (US4): Typography hierarchy - T037, T038, T039, T040 (all [P])
- Phase 7 (Auth Pages): T057, T058 (both [P])

**Cross-Device Testing (Phase 8) - High Parallelism:**

- All browser tests (T073-T076) can run in parallel
- All device tests (T067-T072) can run in parallel
- Accessibility tests (T061-T066) can run in parallel

---

## Parallel Example: User Story 1 (Modern Visual Design)

```bash
# After Phase 1 (Setup) completes, launch all component styling tasks together:

Task T004: "Apply modern card design to TaskItem component in frontend/components/TaskItem.tsx"
Task T005: "Create PriorityBadge component in frontend/components/PriorityBadge.tsx"
Task T006: "Create TagBadge component in frontend/components/TagBadge.tsx"
Task T007: "Apply modern form styling to TaskForm component in frontend/components/TaskForm.tsx"
Task T008: "Apply modern search styling to SearchBar component in frontend/components/SearchBar.tsx"

# These 5 tasks can run simultaneously (different files, no dependencies)
```

---

## Parallel Example: Cross-Device Testing (Phase 8)

```bash
# Launch all browser tests simultaneously:

Task T073: "Test on Chrome (desktop + mobile)"
Task T074: "Test on Firefox (desktop + mobile)"
Task T075: "Test on Safari (desktop + iOS)"
Task T076: "Test on Edge (desktop)"

# These 4 tasks can run in parallel (independent testing environments)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. **Complete Phase 1: Setup** (T001-T003) - Design system foundation
2. **Complete Phase 2: User Story 1** (T004-T014) - Modern visual design
3. **Complete Phase 3: User Story 2** (T015-T026) - Responsive mobile experience
4. **STOP and VALIDATE**: Test on mobile + desktop, verify modern design + responsiveness
5. **Optional**: Add Phase 6 (Performance) + Phase 8 (Testing) for production readiness

**MVP Deliverable**: Modern, responsive UI that works seamlessly on mobile and desktop

### Incremental Delivery

1. **Foundation** (Phase 1) → Design system ready
2. **+ User Story 1** (Phase 2) → Modern visual design deployed
3. **+ User Story 2** (Phase 3) → Responsive mobile experience deployed
4. **+ User Story 3** (Phase 4) → Light theme with accessibility deployed
5. **+ User Story 4** (Phase 5) → Enhanced visual hierarchy deployed
6. **+ Performance** (Phase 6) → Loading states and optimizations
7. **+ Auth Pages** (Phase 7) → Complete app consistency
8. **+ Testing** (Phase 8) → Validated across devices and browsers
9. **+ Documentation** (Phase 9) → Maintainable design system
10. **+ UAT** (Phase 10) → User-validated, production-ready

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 1 together** (critical foundation)
2. Once Phase 1 done, split work:
   - **Developer A**: User Story 1 (Modern Visual Design) - Phase 2
   - **Developer B**: User Story 2 (Responsive Mobile) - Phase 3
   - **Developer C**: User Story 3 (Light Theme) - Phase 4
   - **Developer D**: User Story 4 (Visual Hierarchy) - Phase 5
   - **Developer E**: Auth Pages Styling - Phase 7
3. **Reconvene for Phase 6** (Performance Optimization) - validate across all stories
4. **Reconvene for Phase 8** (Testing) - comprehensive validation
5. **Complete Phase 9-10 together** (Documentation + UAT)

---

## Success Metrics Tracking

### Measurable Outcomes (from spec)

- **SC-001**: 90% users rate design as "professional" or "modern" → Validate in Phase 10 (T086-T088)
- **SC-002**: Fully functional 320px-430px mobile screens → Validate in Phase 8 (T067-T069)
- **SC-003**: All text meets WCAG AA contrast ratios → Validate in Phase 4 (T034-T036) and Phase 8 (T061-T066)
- **SC-004**: Page load time < 2s on 3G connections → Validate in Phase 6 (T055)
- **SC-005**: No zoom/horizontal scroll needed on mobile → Validate in Phase 8 (T067-T072)
- **SC-006**: Zero mis-taps in user testing → Validate in Phase 3 (T026) and Phase 10 (T087)
- **SC-007**: Users identify primary actions within 3 seconds → Validate in Phase 5 (T048) and Phase 10 (T088)
- **SC-008**: Lighthouse accessibility score 95+ → Validate in Phase 8 (T061)

### Implementation Metrics

- **0 new dependencies** (existing Tailwind CSS, Next.js, React stack only)
- **0 backend changes** (frontend-only feature)
- **0 data model changes** (purely presentational)
- **0 API contract changes** (no new endpoints)
- **90 tasks total** across 10 phases
- **~30 tasks marked [P]** for parallel execution (33% parallelism)

---

## Notes

- **[P] tasks** = different files, no dependencies - can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be **independently completable and testable**
- **No automated tests** - validation through manual testing, Lighthouse, and user feedback
- Commit after each task or logical group (after each component, after each phase)
- Stop at any checkpoint to validate story independently before proceeding
- **Frontend-only changes** - no backend, database, or API modifications
- **Phase 1 is CRITICAL** - design system foundation blocks all other work

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (US1: Modern Visual Design)**: 11 tasks
- **Phase 3 (US2: Responsive Mobile)**: 12 tasks
- **Phase 4 (US3: Light Theme)**: 10 tasks
- **Phase 5 (US4: Visual Hierarchy)**: 14 tasks
- **Phase 6 (Performance)**: 6 tasks
- **Phase 7 (Auth Pages)**: 4 tasks
- **Phase 8 (Testing)**: 18 tasks
- **Phase 9 (Documentation)**: 5 tasks
- **Phase 10 (UAT)**: 7 tasks

**Total**: 90 tasks organized across 10 phases and 4 user stories
