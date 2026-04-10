// Shared types for the Derby Stat Tracker application
import { Player } from '../lib/supabase'

export type ActiveView =
  | 'dashboard'
  | 'players'
  | 'teams'
  | 'bouts'
  | 'settings'
  | 'live-track'
  | 'mode-select'
  | 'live-scoreboard'

export interface ExtendedPlayer extends Player {
  position?: string
  team_number?: string
  is_active?: boolean
  team_id?: string
}
