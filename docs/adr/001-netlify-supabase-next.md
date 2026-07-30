# ADR-001 — Stack Netlify + Supabase + Next.js

## Status
Accepted

## Context
MVP demo necesita hosting simple, DB/Auth/Storage y App Router.

## Decision
Next.js App Router en Netlify; Supabase Postgres/Auth/Storage; TypeScript strict; Tailwind + shadcn + Motion.

## Consequences
Vendor coupling aceptable para MVP; migraciones SQL en repo.
