import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock data for tests
const mockTeams = [
  {
    id: '1',
    name: 'Roller Derby Team 1',
    created_at: '2024-01-01',
    roster: [
      { player_id: '1', player_name: 'Player 1' },
      { player_id: '2', player_name: 'Player 2' }
    ]
  },
  {
    id: '2',
    name: 'Roller Derby Team 2', 
    created_at: '2024-01-02',
    roster: [
      { player_id: '3', player_name: 'Player 3' }
    ]
  }
]

const mockPlayers = [
  { id: '1', name: 'Player 1', derby_number: '42', created_at: '2024-01-01' },
  { id: '2', name: 'Player 2', derby_number: '13', created_at: '2024-01-02' },
  { id: '3', name: 'Player 3', derby_number: '7', created_at: '2024-01-03' }
]

const mockBouts = [
  {
    id: '1',
    date: '2024-02-15',
    home_team_id: '1',
    away_team_id: '2',
    home_score: 120,
    away_score: 105,
    created_at: '2024-02-15'
  }
]

// Mock environment variables for tests
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}))

// Mock Supabase client for tests
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(() => Promise.resolve({ 
        data: { user: { id: '1', email: 'test@example.com' } }, 
        error: null 
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({ 
        data: { user: { id: '1', email: 'test@example.com' } }, 
        error: null 
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn((table: string) => {
      let data: unknown[] = []
      switch (table) {
        case 'teams':
          data = mockTeams
          break
        case 'players':
          data = mockPlayers
          break
        case 'bouts':
          data = mockBouts
          break
        default:
          data = []
      }
      
      return {
        select: vi.fn(() => Promise.resolve({ data, error: null })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: [{ id: 'new-id', name: 'New Item' }], 
            error: null 
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data, error: null }))
      }
    })
  },
  isSupabaseConfigured: true,
  requireSupabase: vi.fn(() => ({
    auth: {
      signUp: vi.fn(() => Promise.resolve({ 
        data: { user: { id: '1', email: 'test@example.com' } }, 
        error: null 
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({ 
        data: { user: { id: '1', email: 'test@example.com' } }, 
        error: null 
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn((table: string) => {
      let data: unknown[] = []
      switch (table) {
        case 'teams':
          data = mockTeams
          break
        case 'players':
          data = mockPlayers
          break
        case 'bouts':
          data = mockBouts
          break
        default:
          data = []
      }
      
      return {
        select: vi.fn(() => Promise.resolve({ data, error: null })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: [{ id: 'new-id', name: 'New Item' }], 
            error: null 
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data, error: null }))
      }
    })
  }))
}))

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com' },
    loading: false,
    session: { access_token: 'test-token' },
    signOut: vi.fn()
  }))
}))