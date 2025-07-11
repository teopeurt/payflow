# Agent Guidelines for Payflow Invoice CLM

## Build/Test Commands
- **Frontend (payflow-suite)**: `cd packages/payflow-suite && bun run dev|build|lint`
- **Core tests**: `cd packages/core && bun run test` (uses vitest via sst shell)
- **Go service**: `cd packages/go-serverless && make` (check Makefile for targets)
- **SST deployment**: `sst dev|deploy` (from root)

## Code Style
- **TypeScript**: Strict disabled (`noImplicitAny: false`, `strictNullChecks: false`)
- **Imports**: Use `@/` path alias for src imports, group external/internal imports
- **React**: Functional components with hooks, forwardRef for UI components
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **UI Components**: Use shadcn/ui patterns with `cn()` utility and `cva` variants
- **Data Fetching**: TanStack Query with Supabase, transform data in custom hooks
- **Types**: Export types from hooks/components, use interface for props
- **Error Handling**: Throw errors in query functions, handle in UI with try/catch
- **Formatting**: 2-space indentation, semicolons, double quotes for strings

## Testing
- Use vitest for core package tests
- Run single test: `cd packages/core && bun run test -- <test-file>`