# Technology Stack (Summary)

## Purpose
This document provides a summary overview of the technology stack for the events-stepperslife project.

## Complete Documentation
For the complete and detailed technology stack specifications, see:
**[docs/development/technology-stack.md](../development/technology-stack.md)**

## Key Technologies Overview

### Frontend
- **Framework:** Next.js 14+ with React 18+
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **State Management:** Context API, React Query

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js

### Development & Deployment
- **Package Manager:** npm
- **Build Tools:** Next.js built-in bundling
- **Deployment:** Docker containers
- **Version Control:** Git

### MCP Integration
- **Claude MCP Tools:** Full integration for AI-assisted development
- **Server Management:** Custom MCP server implementations
- **API Gateway:** MCP protocol support

## Architecture Alignment
This technology stack supports the full-stack architecture detailed in [system-overview.md](./system-overview.md) and implements the requirements specified in [product-requirements.md](../business/product-requirements.md).