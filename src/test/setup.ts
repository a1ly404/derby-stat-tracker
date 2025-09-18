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
  { 
    id: '1', 
    derby_name: 'Test Player 1', 
    preferred_number: '100', 
    created_at: '2024-01-01',
    player_teams: [
      {
        number: '100',
        position: 'blocker',
        is_active: true,
        teams: { id: '1', name: 'Test Team 1' }
      }
    ]
  },
  { 
    id: '2', 
    derby_name: 'Test Player 2', 
    preferred_number: '200', 
    created_at: '2024-01-02',
    player_teams: [
      {
        number: '200',
        position: 'jammer',
        is_active: true,
        teams: { id: '2', name: 'Test Team 2' }
      }
    ]
  },
  { 
    id: '3', 
    derby_name: 'Test Player 3', 
    preferred_number: '300', 
    created_at: '2024-01-03',
    player_teams: [
      {
        number: '300',
        position: 'pivot',
        is_active: false,
        teams: { id: '1', name: 'Test Team 1' }
      }
    ]
  }
]

const mockBouts = [
  {
    id: '1',
    date: '2024-02-15',
    home_team_id: '1',
    away_team_id: '2',
    home_score: 120,
    away_score: 105,
    status: 'completed',
    created_at: '2024-02-15',
    home_team: {
      id: '1',
      name: 'Roller Derby Team 1',
      created_at: '2023-12-31',
      logo_url: null
    },
    away_team: {
      id: '2',
      name: 'Roller Derby Team 2',
      created_at: '2024-01-01',
      logo_url: null
    }
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
      
      const createChainableQuery = () => ({
        select: vi.fn(() => createChainableQuery()),
        order: vi.fn(() => createChainableQuery()),
        limit: vi.fn(() => createChainableQuery()),
        eq: vi.fn(() => createChainableQuery()),
        then: vi.fn((onResolve) => onResolve({ data, error: null }))
      })
      
      return {
        select: vi.fn(() => createChainableQuery()),
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
        eq: vi.fn(() => createChainableQuery()),
        order: vi.fn(() => createChainableQuery()),
        limit: vi.fn(() => createChainableQuery())
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
      
      const createChainableQuery = () => ({
        select: vi.fn(() => createChainableQuery()),
        order: vi.fn(() => createChainableQuery()),
        limit: vi.fn(() => createChainableQuery()),
        eq: vi.fn(() => createChainableQuery()),
        then: vi.fn((onResolve) => onResolve({ data, error: null }))
      })
      
      return {
        select: vi.fn(() => createChainableQuery()),
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
        eq: vi.fn(() => createChainableQuery()),
        order: vi.fn(() => createChainableQuery()),
        limit: vi.fn(() => createChainableQuery())
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