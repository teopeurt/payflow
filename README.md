# PayFlow

PayFlow is a business-management web app for invoicing and payments. It handles clients, projects, quotes, estimates, invoices, payments and documents. It's built as a Bun/npm-workspaces monorepo on the [SST v3](https://sst.dev) template and deploys to AWS.

## Layout

- `packages/web-app/` is the main product, a React + TypeScript + Vite frontend.
  - Tailwind and shadcn/ui for styling, react-hook-form with zod for forms, TanStack Query for server state.
  - Supabase is the backend. The `supabase/` folder holds `config.toml` and migrations, and there is a `docker-compose.yml`.
  - Pages cover Auth, Dashboard, Clients, Projects, Quotes, Estimates, Invoices, Payments, Documents, Profile and Settings. Most entities have New, Edit and Details views.
  - Other features include PDF preview, file upload, status badges and shared UI components.
- `packages/core/` holds shared code, written as modules and tested with Vitest through `sst shell`.
- `packages/functions/` holds AWS Lambda handlers. `infra/api.ts` defines the `MyApi` function, which has a public URL and is linked to the bucket.
- `packages/scripts/` holds utility scripts.
- `infra/` and `sst.config.ts` define the SST/AWS infrastructure: an S3 bucket and the API function. The app is retained and protected on the `production` stage.
- `OpenCode.md` and `.opencode/` configure the OpenCode AI coding tool, including build/test commands and the code style guide.

## Getting started

```bash
bun install
```

Run the web app:

```bash
cd packages/web-app && bun run dev
```

Other web-app commands:

```bash
cd packages/web-app && bun run build
cd packages/web-app && bun run lint
```

Run the core tests:

```bash
cd packages/core && bun run test
```

Deploy the infrastructure:

```bash
npx sst deploy
```

## Status

The frontend has the most work in it. The SST backend is still mostly template scaffolding, and the SST app name is still `monorepo-template`.

## License

See [LICENSE](LICENSE).
