# JML Automation Hub

## Overview

JML Automation Hub is a comprehensive employee lifecycle management system designed to streamline Joiner, Mover, and Leaver (JML) processes within organizations. The application provides workflow automation, task tracking, and reporting capabilities for HR and IT teams managing employee transitions.

The system enables organizations to create reusable workflow templates for common JML scenarios, track progress through multi-step processes, manage employee records, and generate reports on workflow efficiency and completion metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type-safe component development
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Vite as the build tool and development server

**UI Framework:**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system inspired by Linear's efficiency and Material Design's data handling
- Responsive layout with mobile-first approach using collapsible sidebar

**State Management:**
- Server state handled through React Query with infinite stale time
- Query invalidation for real-time updates after mutations
- No global client state management - relies on server as source of truth

**Design System:**
- Custom color palette with light/dark theme support via CSS variables
- Professional blue theme optimized for operational dashboards
- Typography using Inter for UI text and Roboto Mono for technical data
- Consistent spacing system using Tailwind's scale (2, 4, 6, 8, 12)
- Elevation system using subtle shadows and opacity overlays

### Backend Architecture

**Technology Stack:**
- Node.js with Express for HTTP server
- TypeScript throughout for type safety
- PostgreSQL database via Drizzle ORM
- Session-based architecture (infrastructure present but auth not implemented)

**API Design:**
- RESTful JSON API with `/api/*` prefix
- Async handler wrapper for promise-based route handling
- Centralized error handling and request logging middleware
- Raw body capture for webhook support

**Data Access Layer:**
- Storage abstraction pattern (`IStorage` interface) separating business logic from database
- Drizzle ORM for type-safe SQL queries and migrations
- Connection pooling via `pg` library
- Schema-first approach with Zod validation derived from Drizzle schemas

**Build System:**
- esbuild for server bundling with selective dependency bundling (allowlist pattern)
- Vite for client bundling with code splitting
- Development mode uses Vite middleware for HMR
- Production serves static files from Express

### Database Schema

**Core Entities:**
- **Users**: Role-based access control (admin, hr_manager, it_admin, manager, viewer) with department assignments
- **Departments**: Hierarchical structure with manager assignments
- **Employees**: People going through JML processes with status tracking (joining, active, moving, leaving, departed)
- **Workflow Templates**: Reusable process definitions for joiner/mover/leaver scenarios
- **Template Steps**: Ordered checklist items within templates with assignee roles
- **Workflows**: Active process instances linked to employees
- **Workflow Steps**: Runtime state of template steps with status tracking
- **Tasks**: Granular work items assigned to users
- **Notifications**: User alerts for workflow events
- **Audit Logs**: Complete activity tracking for compliance

**Design Patterns:**
- UUID primary keys for distributed system compatibility
- Enum types for constrained status fields
- Timestamp tracking (createdAt, updatedAt) on all entities
- Soft references between entities (no foreign key constraints defined in shown schema)
- JSON columns for flexible metadata storage

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- Lucide React for consistent iconography
- Recharts for data visualization and reporting charts
- date-fns for date manipulation and formatting

**Development Tools:**
- Drizzle Kit for database migrations and schema management
- tsx for TypeScript execution in development
- Replit-specific plugins for development experience (cartographer, dev-banner, runtime-error-modal)

**Database:**
- PostgreSQL as the primary data store
- Connection via DATABASE_URL environment variable
- Migration files stored in `/migrations` directory

**Security:**
- Password hashing using bcryptjs with 10 rounds
- Passwords never returned in API responses (omitPassword utility)
- Role-based access control with 5 permission levels
- Session management infrastructure present but auth flow not implemented

**Session Management:**
- connect-pg-simple for PostgreSQL-backed sessions (infrastructure present)
- express-session middleware configured but auth flow not implemented

**Validation:**
- Zod schemas generated from Drizzle schema definitions
- zod-validation-error for user-friendly error messages
- @hookform/resolvers for form validation integration