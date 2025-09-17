import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript (we'll expand this as we build our schema)
export interface Player {
  id: string
  derby_name: string
  preferred_number: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface PlayerTeam {
  id: string
  player_id: string
  team_id: string
  number: string
  position: 'jammer' | 'blocker' | 'pivot'
  is_active: boolean
  joined_date: string
  created_at: string
  updated_at: string
}

export interface Bout {
  id: string
  home_team_id: string
  away_team_id: string
  bout_date: string
  venue: string
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface PlayerStats {
  id: string
  player_id: string
  bout_id: string
  jams_played: number
  lead_jammer: number
  points_scored: number
  penalties: number
  blocks: number
  assists: number
  created_at: string
  updated_at: string
}