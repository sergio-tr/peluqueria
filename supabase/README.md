# Supabase local / remote operations

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local `supabase start`)

## Reset and seed (local)

```bash
npx supabase start
npx supabase db reset
```

`db reset` applies `supabase/migrations/*` then `supabase/seed/seed.sql` when configured in `config.toml`.

If seed is not linked in config, apply manually:

```bash
psql "$DATABASE_URL" -f supabase/seed/seed.sql
```

## Production / remote

Link the project once (`supabase link`), then:

```bash
npx supabase db push
# seed separately in a controlled environment — never blindly re-seed production
```

## Extensions

Migration `20260730100000_init.sql` enables `btree_gist` and `pgcrypto`.

## Phase 1A note

Schema and seed are reproducible. Application APIs that read masters land in phase 1B.
