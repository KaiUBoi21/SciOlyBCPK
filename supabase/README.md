# Supabase

This project uses a **hosted** Supabase project (Postgres + Auth). There is no
local Supabase stack.

Project ref: `deffhlnduwqazxzoaqxm`

## Status

- Schema from `migrations/0001_init.sql` is **already applied** to the hosted
  project. It is not recorded in Supabase's migration-history table (that only
  matters if you later adopt CLI-based `supabase db` diffing).
- `.env.local` is populated. `src/lib/database.types.ts` is generated from the
  live schema.

## One-time setup (for a fresh project)

1. Create a project at <https://app.supabase.com>.
2. Copy values from the **Connect** dialog / **Settings → API Keys** into
   `.env.local` at the repo root:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`)
   - `SUPABASE_SECRET_KEY` (`sb_secret_…`, server-only)
3. Apply the schema: open **SQL Editor**, paste `migrations/0001_init.sql`, run it.
4. **Auth → Providers → Email**: keep "Confirm email" on (the `/auth/callback`
   route handles the confirmation redirect). Set **Site URL** to
   `http://localhost:3000` for local dev.

## Creating the first user

Sign-up is open via the app's **Create account** tab. Alternatively, add users
from **Authentication → Users → Add user** in the dashboard. A `profiles` row is
created automatically by the `on_auth_user_created` trigger; edit `role`
(`captain` / `coach` / `admin`) directly in the table editor for now.

## Regenerating TypeScript types

After any schema change, regenerate `src/lib/database.types.ts`:

```
npx supabase gen types typescript --project-id deffhlnduwqazxzoaqxm > src/lib/database.types.ts
```

(or via the Supabase MCP `generate_typescript_types` tool.)

## Migrations

New schema changes go in `migrations/NNNN_description.sql` (incrementing prefix)
and are applied the same way as the initial migration.
