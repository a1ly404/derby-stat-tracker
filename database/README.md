# Database Scripts

This folder contains SQL scripts and database-related files for the Derby Stat Tracker application.

## Directory Structure

```
database/
├── schema.sql                          # Initial schema — run this first on a new project
├── supabase-rls-performance-fixes.sql  # One-time RLS + index performance patches
└── migrations/                         # Versioned, numbered migration scripts
    ├── README.md                       # How to apply migrations
    └── 001_live_tables.sql             # Adds live_games and live_jam_snapshots tables
```

## Files

### `schema.sql`

The initial database setup script. Creates all core tables (`teams`, `players`, `player_teams`, `bouts`, `player_stats`), their triggers, RLS policies, and sample seed data. **This must be applied before any numbered migration.**

### `migrations/`

Versioned SQL migration scripts that extend the schema beyond the initial setup. See [`migrations/README.md`](./migrations/README.md) for full instructions on how to apply them and the order they must be run.

### `supabase-rls-performance-fixes.sql`

Comprehensive SQL script to fix Supabase performance issues identified by the database linter.

**Includes:**
- **RLS Performance Fixes** - Optimizes Row Level Security policies by wrapping `auth.uid()` calls in subqueries
- **Foreign Key Indexes** - Adds missing indexes on foreign key columns for better query performance

**How to use:**
1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of this file
4. Execute the SQL commands

**Performance Benefits:**
- Eliminates RLS auth function re-evaluation per row (22 warnings fixed)
- Improves join performance with proper foreign key indexing (4 warnings fixed)
- Faster queries for live stat tracking operations
- Better performance when loading team rosters and bout data

**Tables Optimized:**
- `teams` - RLS policies and foreign key references
- `players` - RLS policies  
- `player_teams` - RLS policies and team_id indexing
- `bouts` - RLS policies and team foreign key indexing
- `player_stats` - RLS policies and bout_id indexing

## Future Database Changes

When making database schema changes:
1. Add a new numbered SQL file to the `migrations/` directory (e.g. `002_my_change.sql`)
2. Write the script to be **idempotent** — use `IF NOT EXISTS`, `DROP … IF EXISTS`, and `CREATE OR REPLACE` guards
3. Update the table in [`migrations/README.md`](./migrations/README.md) with the new file and a brief description
4. Test the script in a local / staging Supabase project before applying to production
5. Apply migrations in strict numerical order — never skip or reorder them

## Development Notes

- These scripts are safe to run multiple times (uses `IF EXISTS` and `IF NOT EXISTS`)
- All changes maintain existing security policies while improving performance
- Foreign key indexes use standard naming convention: `idx_{table}_{column}`