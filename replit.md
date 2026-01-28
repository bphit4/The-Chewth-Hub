# The Chewth - Sports Podcast & News Platform

## Overview

The Chewth is a full-stack sports media application providing podcast episodes, news articles, and live scores across major sports leagues (NFL, NBA, MLB, UFC, College Football, College Basketball). The platform features an ESPN-style interface with sport-specific hubs, real-time score updates, standings, stats, and team information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS v4 with CSS variables for theming, shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with reusable components. Sport-specific pages share common patterns through the `SportSubnav` component and consistent data hooks. The UI uses a dark sports theme with Inter and Oswald fonts.

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **API Pattern**: REST endpoints that proxy external sports data APIs
- **Data Normalization**: Server-side transformation of SportsDataIO responses to a consistent `ChewthGame` format

The backend acts primarily as an API proxy layer, keeping external API keys secure on the server while providing normalized data to the frontend. Routes are registered in `server/routes.ts` with sport-specific endpoints for scores, standings, and stats.

### Data Flow
1. Frontend requests data from `/api/{sport}/...` endpoints
2. Backend fetches from SportsDataIO API with server-side caching (1-minute TTL)
3. Response is normalized to frontend-expected format via `server/normalizers.ts`
4. React Query handles client-side caching and refetching

### Database Schema
- Uses Drizzle ORM with PostgreSQL
- Currently minimal schema with a `users` table for future authentication
- In-memory storage (`MemStorage`) used as default, can be swapped for database storage

### Key Design Decisions

**Proxy Architecture for Sports Data**
- Problem: Need real-time sports data without exposing API keys to clients
- Solution: Backend proxy endpoints that cache and normalize external API responses
- Benefit: Single source of truth for data format, secure key management

**ESPN-Style Sport Hubs**
- Problem: Need consistent navigation across different sports
- Solution: Each sport has identical tab structure (Scores, Standings, Stats, etc.) with sport-specific data
- Implementation: `SPORTS` config in `client/src/lib/espn.ts` defines available sports and their tabs

**Component Library**
- Uses shadcn/ui components (Radix UI primitives + Tailwind styling)
- Components are copied into `client/src/components/ui/` for full customization
- Configured via `components.json` for the new-york style variant

## External Dependencies

### Sports Data APIs
- **SportsDataIO**: Primary source for live scores, standings, and stats (requires `SPORTSDATA_API_KEY` environment variable)
- **ESPN Public API**: Used for score ticker and supplementary data (no key required)

### Database
- **PostgreSQL**: Required for production, configured via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `/migrations` directory

### Third-Party Services
- **Google Fonts**: Inter and Oswald font families loaded via CDN
- **ESPN CDN**: Team logos sourced from `a.espncdn.com`

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `wouter`: Client-side routing
- `date-fns`: Date formatting
- `express-session` / `connect-pg-simple`: Session management (available for auth)