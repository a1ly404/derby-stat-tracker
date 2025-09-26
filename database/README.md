# Database Scripts

This folder contains SQL scripts and database-related files for the Derby Stat Tracker application.

## Files

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
1. Add new SQL scripts to this folder
2. Use descriptive filenames with dates when relevant
3. Document the purpose and usage in this README
4. Test scripts in development before applying to production

## Development Notes

- These scripts are safe to run multiple times (uses `IF EXISTS` and `IF NOT EXISTS`)
- All changes maintain existing security policies while improving performance
- Foreign key indexes use standard naming convention: `idx_{table}_{column}`