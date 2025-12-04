# Design Guidelines: JML Automation Hub

## Design Approach

**Design System Approach** - Inspired by Linear's clean efficiency and Material Design's data handling patterns. The design prioritizes clarity, productivity, and professional polish suitable for both SMB and enterprise environments.

**Core Principles:**
- Information density with breathing room - efficient without overwhelming
- Clear visual hierarchy for rapid task processing
- Trustworthy, professional aesthetic that reduces cognitive load
- Dashboard-first design optimized for daily operational use

## Typography

**Font Families** (Google Fonts):
- Primary: 'Inter' - Modern, highly legible for UI and data
- Monospace: 'Roboto Mono' - For timestamps, IDs, and technical data

**Hierarchy:**
- Page Headers: Inter, 28-32px, weight 700
- Section Headers: Inter, 20-24px, weight 600
- Card Titles: Inter, 16-18px, weight 600
- Body Text: Inter, 14px, weight 400, line-height 1.5
- Data/Metrics: Inter, 24-32px, weight 700 (for KPIs)
- Labels/Meta: Inter, 12-13px, weight 500
- Timestamps/IDs: Roboto Mono, 12px, weight 400

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, and 12
- Card padding: p-6, p-8
- Section spacing: py-8, py-12
- Grid gaps: gap-4, gap-6
- Component spacing: mb-4, mb-6, mb-8

**Layout Structure:**
- Fixed sidebar: w-64 on desktop, collapsed/drawer on mobile
- Main content: flex-1 with max-w-[1600px] and px-6 lg:px-8
- Dashboard grids: 3-column (desktop), 2-column (tablet), 1-column (mobile)

## Component Library

### Sidebar Navigation
- Fixed left sidebar with company logo at top
- Grouped navigation sections: Dashboard, Joiners, Movers, Leavers, Reports, Settings
- Active state with subtle background and border accent
- Section icons from Heroicons
- User profile with avatar and role at bottom
- Collapse toggle for space efficiency

### Dashboard Overview
- Hero section with KPI cards grid (4 metrics across desktop)
  - Large numeric display with trend indicator (up/down arrow)
  - Small sparkline chart showing 7-day trend
  - Cards: Active Workflows, Pending Tasks, Completed This Week, Avg Completion Time
- Recent Activity timeline below KPIs
- Quick Actions card with frequently used workflows
- Status Distribution donut chart showing workflow states

### Workflow Timeline
- Vertical timeline with connected nodes
- Each step shows: Status indicator dot, step name, assignee avatar, timestamp
- Expandable sections for step details and comments
- Progress bar showing overall completion percentage
- Color-coded status: Green (complete), Amber (in progress), Red (blocked), Gray (pending)

### Task Lists
- Compact table layout with sortable columns
- Row actions on hover: Edit, View Details, Mark Complete
- Checkbox selection for bulk operations
- Filters: Status, Assignee, Department, Date Range
- Pagination with items per page selector
- Search bar with instant filtering

### Data Cards
- Elevated cards with subtle shadow
- Clear header with icon and title
- Content area with generous padding
- Footer actions when applicable
- Consistent height for grid alignment where appropriate

### Workflow Creation/Edit
- Multi-step form with progress indicator
- Sidebar showing template selection
- Main area with step-by-step configuration
- Field groups with clear labels and helper text
- Preview pane showing workflow visualization
- Save as draft and publish buttons

### Reporting Charts
- Bar charts for completion metrics
- Line graphs for trend analysis
- Donut charts for status distribution
- Data table export functionality
- Date range picker for filtering
- Legend with interactive filtering

### Employee Cards
- Avatar with name and department
- Status badge (Joining, Moving, Leaving)
- Key dates and assignment info
- Quick action buttons: View Profile, Manage Tasks
- Used in Joiners/Movers/Leavers sections

### Notifications
- Toast notifications: Top-right, auto-dismiss in 5s
- Notification center dropdown from header
- Categorized by type: System, Task, Comment, Approval
- Mark as read functionality
- Desktop notification integration

## Icons
**Heroicons** (outline style for navigation, solid for actions):
- Dashboard, users, briefcase, chart-bar, document, settings
- Plus, edit, trash, check, clock, bell
- Arrow indicators for trends and navigation
- Status dots using custom spans with border-radius

## Images

**No large hero image** - This is a productivity dashboard focused on data and workflows, not marketing content.

**Small Imagery:**
- User avatars throughout (profile photos)
- Company logo in sidebar header
- Empty state illustrations for blank sections (simple line art)
- Onboarding tutorial screenshots in help section

## Forms
- Label above input field
- Input fields with border focus states
- Inline validation with clear error messages
- Required indicators (asterisk)
- Multi-select dropdowns with checkboxes
- Date pickers for scheduling
- Rich text editor for comments/notes
- Autocomplete for employee/department selection

## Status Indicators
- Green: Completed, Active, On Track
- Amber: Pending, In Progress, Attention Needed
- Red: Blocked, Overdue, Critical
- Gray: Not Started, Inactive
- Badges with subtle backgrounds and border

## Animations
**Minimal, productivity-focused:**
- Sidebar collapse/expand (250ms ease)
- Card hover elevation (150ms)
- Dropdown/modal fade (200ms)
- Loading spinners for async operations
- Smooth scroll to sections
- Chart animations on load (subtle, 400ms)

**No scroll-triggered or decorative animations**

## Responsive Behavior
- Sidebar collapses to hamburger menu on mobile
- Dashboard grid stacks to single column on mobile
- Tables convert to card layout on small screens
- Sticky table headers on scroll
- Fixed action buttons on mobile for forms
- Touch-friendly tap targets (min 44px)

## Accessibility
- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Keyboard navigation for all interactions
- Focus visible states on all interactive elements
- Screen reader announcements for status changes
- High contrast mode support
- Color not sole indicator of status (icons/text included)