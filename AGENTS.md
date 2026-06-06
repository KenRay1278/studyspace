# StudySpace Agent Guide

StudySpace is a Next.js and Supabase MVP for group task management with weighted bounty tasks, peer verification, and lecturer-readable workload reporting.

## Stack

- Next.js App Router with TypeScript.
- Supabase for database, auth, and server/browser clients.
- Tailwind CSS v4 for styling.
- shadcn/ui source-owned components with lucide-react icons.
- pnpm as the package manager.

## Current Scope

This scaffold intentionally does not implement auth, the task board, bounty weighting, verification, PDF export, or database schema. Keep the first iteration focused on project foundation.

## Conventions

- Use `src/app` for routes and layouts.
- Use `src/components/ui` for shadcn/ui primitives.
- Use `src/lib` for shared helpers.
- Use `@/*` imports for files under `src`.
- Keep Supabase service role keys out of the browser and out of `.env.example`.
- Prefer small, reviewable changes with lint, typecheck, and build passing before PRs.

## Verification

Run these before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm build
```
