// ---------------------------------------------------------------------------
// Scoreboard API types
// ---------------------------------------------------------------------------
// These types mirror the Python Pydantic models in derby-scoreboard-api/models.py.
// Every field the API can return is represented here so that raw_state JSONB
// in Supabase captures the full payload without silent data loss.
// ---------------------------------------------------------------------------

/**
 * A single skater position on the track (jammer, pivot, or blocker).
 * Mirrors `SkaterPosition` in models.py.
 */
export interface SkaterPosition {
  name: string | null
  number: string | null
  in_box: boolean
  box_entered_at_ms: number | null
  box_time_remaining_s: number | null
}

/**
 * Full team state as returned by the scoreboard API.
 * Mirrors `TeamState` in models.py.
 */
export interface TeamLiveState {
  name: string | null
  score: number | null
  jam_score: number | null

  // Jammer status flags
  lead: boolean | null
  display_lead: boolean | null
  calloff: boolean | null
  lost: boolean | null
  star_pass: boolean | null

  // Team resources
  timeouts_remaining: number
  official_reviews_remaining: number
  retained_official_review: boolean

  // Full lineup — five named positions
  jammer: SkaterPosition
  pivot: SkaterPosition
  blocker1: SkaterPosition
  blocker2: SkaterPosition
  blocker3: SkaterPosition
}

/**
 * Complete live game state as returned by GET /live.
 * Mirrors `LiveState` in models.py.
 */
export interface LiveState {
  connected: boolean

  // Jam coordinates
  period: number | null
  jam: number | null

  // Clocks
  jam_clock_ms: number | null
  jam_clock: string | null
  period_clock_ms: number | null
  period_clock: string | null

  // Game phase
  jam_running: boolean | null
  in_jam: boolean | null
  game_state: string | null
  in_lineup: boolean

  // Timeout state
  timeout_type: string | null
  timeout_clock_ms: number | null
  timeout_clock: string | null
  timeout_owner: string | null

  // Staleness
  state_age_seconds: number | null

  // Teams
  team1: TeamLiveState | null
  team2: TeamLiveState | null
}

// ---------------------------------------------------------------------------
// Supabase row types
// ---------------------------------------------------------------------------

export interface LiveGameRow {
  id: string
  bout_id: string | null
  scoreboard_source: string
  started_at: string
  ended_at: string | null
  status: 'active' | 'completed'
}

export interface LiveJamSnapshotRow {
  id: string
  live_game_id: string
  period: number
  jam: number

  // Scores
  team1_score: number | null
  team2_score: number | null
  team1_jam_score: number | null
  team2_jam_score: number | null

  // Jammer identity (extracted from SkaterPosition for convenience)
  team1_jammer: string | null
  team2_jammer: string | null

  // Lead flags
  team1_lead: boolean | null
  team2_lead: boolean | null

  // Full API payload — every field the scoreboard sent, stored as JSONB
  raw_state: LiveState

  captured_at: string
}

// ---------------------------------------------------------------------------
// Bridge configuration
// ---------------------------------------------------------------------------

export interface BridgeConfig {
  scoreboardApiUrl: string
  supabaseUrl: string
  supabaseServiceKey: string
  pollIntervalMs: number
  jamEndDebounceMs: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

// ---------------------------------------------------------------------------
// JamKey — uniquely identifies a jam within a session, e.g. "P1J4"
// ---------------------------------------------------------------------------

export type JamKey = string

/**
 * Build a JamKey from a period and jam number.
 * Returns null when either value is null/undefined (scoreboard not yet live).
 */
export function makeJamKey(period: number | null, jam: number | null): JamKey | null {
  if (period == null || jam == null) return null
  return `P${period}J${jam}`
}

// ---------------------------------------------------------------------------
// Helpers — default / sentinel values
// ---------------------------------------------------------------------------

/** A zeroed-out skater position used for defaults and disconnected sentinels. */
export const EMPTY_SKATER: SkaterPosition = {
  name: null,
  number: null,
  in_box: false,
  box_entered_at_ms: null,
  box_time_remaining_s: null,
}

/** A zeroed-out team state used for the disconnected sentinel. */
export const EMPTY_TEAM: TeamLiveState = {
  name: null,
  score: null,
  jam_score: null,
  lead: null,
  display_lead: null,
  calloff: null,
  lost: null,
  star_pass: null,
  timeouts_remaining: 3,
  official_reviews_remaining: 1,
  retained_official_review: false,
  jammer: { ...EMPTY_SKATER },
  pivot: { ...EMPTY_SKATER },
  blocker1: { ...EMPTY_SKATER },
  blocker2: { ...EMPTY_SKATER },
  blocker3: { ...EMPTY_SKATER },
}

/**
 * Disconnected sentinel — returned by the ScoreboardClient whenever the
 * scoreboard API cannot be reached or explicitly reports disconnected.
 */
export const DISCONNECTED_STATE: LiveState = {
  connected: false,
  period: null,
  jam: null,
  jam_clock_ms: null,
  jam_clock: null,
  period_clock_ms: null,
  period_clock: null,
  jam_running: null,
  in_jam: null,
  game_state: null,
  in_lineup: false,
  timeout_type: null,
  timeout_clock_ms: null,
  timeout_clock: null,
  timeout_owner: null,
  state_age_seconds: null,
  team1: null,
  team2: null,
}

/**
 * Extract the jammer's display name from a team state.
 *
 * The scoreboard API returns jammer as a SkaterPosition object, but
 * the live_jam_snapshots table stores just the name string for
 * convenience.  This helper handles both shapes for backward
 * compatibility — if an older API version returned jammer as a bare
 * string, we fall back gracefully.
 */
export function extractJammerName(team: TeamLiveState | null): string | null {
  if (!team) return null

  const j = team.jammer
  if (!j) return null

  // Normal case: jammer is a SkaterPosition object
  if (typeof j === 'object' && 'name' in j) {
    return j.name ?? null
  }

  // Fallback: older API version that returned jammer as a bare string
  if (typeof j === 'string') {
    return j || null
  }

  return null
}
