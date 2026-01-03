# Design System Documentation

## Color Palette

### Primary Colors
- `primary-50`: #eff6ff
- `primary-100`: #dbeafe
- `primary-200`: #bfdbfe
- `primary-300`: #93c5fd
- `primary-400`: #60a5fa
- `primary-500`: #3b82f6 (Primary blue)
- `primary-600`: #2563eb
- `primary-700`: #1d4ed8
- `primary-800`: #1e40af
- `primary-900`: #1e3a8a

### Semantic Colors
- `success-50`: #f0fdf4
- `success-100`: #dcfce7
- `success-500`: #10b981 (Success green)
- `success-600`: #059669

- `error-50`: #fef2f2
- `error-100`: #fee2e2
- `error-500`: #ef4444 (Error red)
- `error-600`: #dc2626

- `warning-50`: #fffbeb
- `warning-100`: #fef3c7
- `warning-500`: #f59e0b (Warning yellow)
- `warning-600`: #d97706

### Gray Scale
- `gray-50`: #f9fafb
- `gray-100`: #f3f4f6
- `gray-200`: #e5e7eb
- `gray-300`: #d1d5db
- `gray-400`: #9ca3af
- `gray-500`: #6b7280
- `gray-600`: #4b5563
- `gray-700`: #374151
- `gray-800`: #1f2937
- `gray-900`: #111827

## Typography Scale

- H1: 2rem (32px) - font-semibold
- H2: 1.5rem (24px) - font-semibold
- H3: 1.125rem (18px) - font-medium
- Body: 1rem (16px) - regular
- Small: 0.875rem (14px) - regular
- Caption: 0.75rem (12px) - regular

## Spacing Scale

- `spacing-xs`: 4px
- `spacing-sm`: 8px
- `spacing-md`: 16px
- `spacing-lg`: 24px
- `spacing-xl`: 32px
- `spacing-2xl`: 48px

## Border Radius

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px

## Shadows

- `shadow-sm`: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- `shadow-md`: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
- `shadow-lg`: 0 8px 16px -2px rgba(0, 0, 0, 0.15)

## Component Variants

### Buttons
- `.btn-primary`: Primary action button
  - Background: `primary-500`
  - Hover: `primary-600`
  - Text: white
  - Padding: py-2.5 px-6
  - Border-radius: `--radius-lg`
  - Min-height: 44px

- `.btn-secondary`: Secondary action button
  - Background: white
  - Text: `gray-700`
  - Border: 1px solid `gray-300`
  - Hover: `gray-50`
  - Padding: py-2.5 px-6
  - Border-radius: `--radius-lg`
  - Min-height: 44px

### Input Fields
- `.input-field`: Standard input field
  - Border: 1px solid `gray-300`
  - Border-radius: `--radius-lg`
  - Padding: py-2.5 px-4
  - Min-height: 44px
  - Focus: border-color `primary-500`, box-shadow

### Cards
- `.card`: Standard card component
  - Background: white
  - Border-radius: `--radius-lg`
  - Box-shadow: `shadow-md`
  - Hover: `shadow-lg`

## Accessibility Guidelines

### Contrast Ratios
- Normal text: 4.5:1 minimum against background
- Large text: 3:1 minimum against background
- All semantic colors meet WCAG AA standards

### Touch Targets
- Minimum 44px × 44px for touch targets
- Buttons and interactive elements have adequate touch area

### Focus Indicators
- All interactive elements have visible focus indicators
- Focus uses `ring-2 ring-primary-500` style