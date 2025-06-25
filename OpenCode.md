# OpenCode Configuration

## Build/Test Commands
- **Web dev**: `cd packages/web && bun run dev`
- **Web build**: `cd packages/web && bun run build`
- **Web lint**: `cd packages/web && bun run lint`
- **Core tests**: `cd packages/core && bun run test`
- **Single test**: `cd packages/core && sst shell vitest run <test-file>`

## Code Style Guidelines
- **Imports**: Use `@/` for absolute imports, group external libs first, then internal
- **Types**: Use TypeScript interfaces for objects, type aliases for unions/primitives
- **Components**: PascalCase, export as named exports, use `type` for props
- **Hooks**: Prefix with `use`, return objects with named properties
- **Files**: camelCase for utils/hooks, PascalCase for components
- **Styling**: Use Tailwind classes, `cn()` utility for conditional classes
- **Forms**: Use react-hook-form + zod validation, separate schema files
- **State**: TanStack Query for server state, React state for UI state
- **Error handling**: Throw errors in async functions, handle in components
- **Naming**: Descriptive names, avoid abbreviations, use `is/has` for booleans

## Tech Stack
- React + TypeScript + Vite + Tailwind + shadcn/ui
- Supabase for backend, TanStack Query for data fetching
- Monorepo with workspaces, SST for infrastructure