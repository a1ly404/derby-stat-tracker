# Emoji Management Guide

This document explains how to manage emojis in the Derby Stat Tracker application.

## Overview

All emojis used throughout the application are centralized in `/src/utils/emojis.ts`. This allows you to easily change any emoji from one location instead of hunting through multiple files.

## File Structure

```
src/utils/emojis.ts
├── EMOJIS object (main emoji definitions)
├── Helper functions (getNavigationEmoji, getStatsEmoji, etc.)
└── TypeScript types for type safety
```

## How to Change Emojis

To change any emoji in the app:

1. Open `/src/utils/emojis.ts`
2. Find the emoji you want to change in the `EMOJIS` object
3. Replace the emoji value
4. Save the file - changes will be reflected everywhere automatically

## Emoji Categories

### Navigation Icons

- `dashboard`: 📊 (Dashboard tab)
- `players`: 🏃‍♀️‍➡️ (Players tab)
- `bouts`: ⚡ (Bouts tab)
- `teams`: 🏟️ (Teams tab)
- `settings`: ⚙️ (Settings tab)

### Dashboard Stats

- `teams`: 🏟️ (Teams stat card)
- `players`: 🛼 (Players stat card)
- `bouts`: ⚡ (Bouts stat card)
- `activeUsers`: ✅ (Active players stat card)
- `analytics`: 📊 (View stats button)

### Activity Feed

- `playerAdded`: 🏃‍♀️‍➡️ (New player added)
- `teamAdded`: 🏟️ (New team created)
- `boutScheduled`: ⚡ (Bout scheduled)

### Bout Management

- `empty`: ⚡ (Empty state icon)
- `date`: 📅 (Date/time display)
- `venue`: 📍 (Venue location)
- `notes`: 📝 (Notes/comments)

### App Branding

- `favicon`: 🛼 (Browser favicon)
- `app`: 🛼 (Main app icon)

## Usage Examples

### Using Helper Functions (Recommended)

```typescript
import { getNavigationEmoji, getStatsEmoji } from '../utils/emojis'

// In component
const dashboardIcon = getNavigationEmoji('dashboard') // 📊
const teamsIcon = getStatsEmoji('teams') // ♛
```

### Direct Access

```typescript
import EMOJIS from '../utils/emojis'

// In component
const playerIcon = EMOJIS.navigation.players // 👤
```

## Files Updated

The following files have been updated to use the centralized emoji system:

- ✅ `/src/components/Navigation.tsx` - Navigation icons
- ✅ `/src/components/Dashboard.tsx` - Stats icons and activity emojis
- ✅ `/src/components/Bouts.tsx` - Bout-related emojis
- 📄 `/public/favicon.svg` - App favicon (manual update if needed)

## Benefits

1. **Single Source of Truth**: All emojis in one place
2. **Easy Maintenance**: Change once, updates everywhere
3. **Type Safety**: TypeScript ensures you use valid emoji keys
4. **Consistency**: Prevents emoji mismatches across the app
5. **Documentation**: Clear mapping of what each emoji represents

## Adding New Emojis

To add a new emoji:

1. Add it to the appropriate category in the `EMOJIS` object
2. Update the TypeScript types if adding a new category
3. Create/update helper functions as needed
4. Use the new emoji in your components

## Theme Consistency

All emojis are chosen to maintain a consistent roller derby theme:

- 🛼 Roller skates for players/skating
- ⚡ Lightning for energy/action/bouts
- ♛ Crown for teams/authority
- 🏟️ Stadium for team creation
- 📊 Charts for analytics/stats

This system makes it easy to maintain visual consistency and quickly rebrand if needed!
