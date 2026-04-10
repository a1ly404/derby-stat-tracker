/**
 * Centralized emoji configuration for Derby Stat Tracker
 * 
 * This file contains all emojis used throughout the application.
 * To change any emoji, simply update the value here and it will
 * be reflected everywhere the emoji is used.
 */

export const EMOJIS = {
  // Navigation Icons
  navigation: {
    dashboard: '📊',
    players: '🏃‍♀️‍➡️', 
    bouts: '⚡',
    teams: '🏟️',
    settings: '⚙️',
  },

  // Dashboard Stats Icons
  stats: {
    teams: '🏟️',      // Stadium for teams
    players: '🏃‍♀️‍➡️',   // Women Running for players
    bouts: '⚡',     // Lightning for bouts/energy
    activeUsers: '✅', // Check mark for active status
    analytics: '📊', // Chart for analytics/stats
  },

  // Activity Types
  activity: {
    playerAdded: '🏃‍♀️‍➡️', // Running person with arrow (player joining)
    teamAdded: '🏟️',    // Stadium for new team
    boutScheduled: '⚡', // Lightning for bout scheduled
  },

  // Bout Management
  bout: {
    empty: '⚡',      // Lightning for empty state
    date: '📅',      // Calendar for date
    venue: '📍',     // Location pin for venue
    notes: '📝',     // Memo for notes
  },

  // General UI
  ui: {
    success: '✅',   // Check mark for success states
    loading: '⏳',   // Hourglass for loading (if needed)
    error: '❌',     // X mark for errors (if needed)
    warning: '⚠️',   // Warning triangle (if needed)
  },

  // App Branding
  brand: {
    favicon: '🛼',   // Roller skate for app favicon
    app: '🛼',       // Main app icon
  }
} as const

// Type for emoji keys to ensure type safety
export type EmojiKey = keyof typeof EMOJIS
export type NavigationEmojiKey = keyof typeof EMOJIS.navigation
export type StatsEmojiKey = keyof typeof EMOJIS.stats
export type ActivityEmojiKey = keyof typeof EMOJIS.activity
export type BoutEmojiKey = keyof typeof EMOJIS.bout
export type UIEmojiKey = keyof typeof EMOJIS.ui
export type BrandEmojiKey = keyof typeof EMOJIS.brand

/**
 * Helper function to get navigation emoji
 */
export const getNavigationEmoji = (key: NavigationEmojiKey): string => {
  return EMOJIS.navigation[key]
}

/**
 * Helper function to get stats emoji  
 */
export const getStatsEmoji = (key: StatsEmojiKey): string => {
  return EMOJIS.stats[key]
}

/**
 * Helper function to get activity emoji
 */
export const getActivityEmoji = (key: ActivityEmojiKey): string => {
  return EMOJIS.activity[key]
}

/**
 * Helper function to get bout emoji
 */
export const getBoutEmoji = (key: BoutEmojiKey): string => {
  return EMOJIS.bout[key]
}

/**
 * Helper function to get UI emoji
 */
export const getUIEmoji = (key: UIEmojiKey): string => {
  return EMOJIS.ui[key]
}

/**
 * Helper function to get brand emoji
 */
export const getBrandEmoji = (key: BrandEmojiKey): string => {
  return EMOJIS.brand[key]
}

/**
 * Direct access to all emojis - use when you need the full object
 */
export default EMOJIS