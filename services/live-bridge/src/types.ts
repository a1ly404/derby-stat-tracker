// ---------------------------------------------------------------------------
// Scoreboard API types
// ---------------------------------------------------------------------------

export interface TeamLiveState {
  name: string
  score: number
  jam_score: number
  jammer: string | null
  lead: boolean
  lost_lead: boolean
  called_off: boolean
}

export interface LiveState {
  connected: boolean
  period: number | null
  jam: number | null
  jam_clock: string | null
  period_clock: string | null
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
  team1_score: number | null
  team2_score: number | null
  team1_jam_score: number | null
  team2_jam_score: number | null
  team1_jammer: string | null
  team2_jammer: string | null
  team1_lead: boolean | null
  team2_lead: boolean | null
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
