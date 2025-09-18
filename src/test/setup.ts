import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Test data constants to avoid magic numbers and duplication
const TEST_IDS = {
  TEAM_1: '1',
  TEAM_2: '2',
  PLAYER_1: '1',
  PLAYER_2: '2',
  PLAYER_3: '3',
  BOUT_1: '1',
  USER: '1'
} as const

const TEST_NUMBERS = {
  PLAYER_1_NUMBER: '100',
  PLAYER_2_NUMBER: '200',
  PLAYER_3_NUMBER: '300'
} as const

const TEST_DATES = {
  TEAM_1_CREATED: '2024-01-01',
  TEAM_2_CREATED: '2024-01-02',
  PLAYER_1_CREATED: '2024-01-01',
  PLAYER_2_CREATED: '2024-01-02',
  PLAYER_3_CREATED: '2024-01-03',
  BOUT_DATE: '2024-02-15',
  BOUT_CREATED: '2024-02-15',
  TEAM_1_FOUNDING: '2023-12-31'
} as const

const TEST_NAMES = {
  TEAM_1: 'Roller Derby Team 1',
  TEAM_2: 'Roller Derby Team 2',
  TEST_TEAM_1: 'Test Team 1',
  TEST_TEAM_2: 'Test Team 2',
  PLAYER_1: 'Test Player 1',
  PLAYER_2: 'Test Player 2',
  PLAYER_3: 'Test Player 3',
  ROSTER_PLAYER_1: 'Player 1',
  ROSTER_PLAYER_2: 'Player 2',
  ROSTER_PLAYER_3: 'Player 3'
} as const

const TEST_POSITIONS = {
  BLOCKER: 'blocker',
  JAMMER: 'jammer',
  PIVOT: 'pivot'
} as const

const TEST_SCORES = {
  HOME_SCORE: 120,
  AWAY_SCORE: 105
} as const

const TEST_AUTH = {
  USER_EMAIL: 'test@example.com',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key'
} as const

// Factory functions for creating test data
type MockPlayerTeamAssignment = {
  number: string
  position: string
  is_active: boolean
  teams: { id: string; name: string }
}

type MockBoutTeam = {
  id: string
  name: string
  created_at: string
  logo_url: string | null
}

const createMockTeam = (id: string, name: string, createdAt: string, roster: Array<{ player_id: string; player_name: string }>) => ({
  id,
  name,
  created_at: createdAt,
  roster
})

const createMockPlayerTeamAssignment = (number: string, position: string, isActive: boolean, teamId: string, teamName: string): MockPlayerTeamAssignment => ({
  number,
  position,
  is_active: isActive,
  teams: { id: teamId, name: teamName }
})

const createMockPlayer = (id: string, derbyName: string, preferredNumber: string, createdAt: string, playerTeams: MockPlayerTeamAssignment[]) => ({
  id,
  derby_name: derbyName,
  preferred_number: preferredNumber,
  created_at: createdAt,
  player_teams: playerTeams
})

const createMockBoutTeam = (id: string, name: string, createdAt: string, logoUrl: string | null = null): MockBoutTeam => ({
  id,
  name,
  created_at: createdAt,
  logo_url: logoUrl
})

const createMockBout = (id: string, date: string, homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number, status: string, createdAt: string, homeTeam: MockBoutTeam, awayTeam: MockBoutTeam) => ({
  id,
  date,
  home_team_id: homeTeamId,
  away_team_id: awayTeamId,
  home_score: homeScore,
  away_score: awayScore,
  status,
  created_at: createdAt,
  home_team: homeTeam,
  away_team: awayTeam
})

// Mock data using factory functions and constants
const mockTeams = [
  createMockTeam(
    TEST_IDS.TEAM_1,
    TEST_NAMES.TEAM_1,
    TEST_DATES.TEAM_1_CREATED,
    [
      { player_id: TEST_IDS.PLAYER_1, player_name: TEST_NAMES.ROSTER_PLAYER_1 },
      { player_id: TEST_IDS.PLAYER_2, player_name: TEST_NAMES.ROSTER_PLAYER_2 }
    ]
  ),
  createMockTeam(
    TEST_IDS.TEAM_2,
    TEST_NAMES.TEAM_2,
    TEST_DATES.TEAM_2_CREATED,
    [
      { player_id: TEST_IDS.PLAYER_3, player_name: TEST_NAMES.ROSTER_PLAYER_3 }
    ]
  )
]

const mockPlayers = [
  createMockPlayer(
    TEST_IDS.PLAYER_1,
    TEST_NAMES.PLAYER_1,
    TEST_NUMBERS.PLAYER_1_NUMBER,
    TEST_DATES.PLAYER_1_CREATED,
    [
      createMockPlayerTeamAssignment(
        TEST_NUMBERS.PLAYER_1_NUMBER,
        TEST_POSITIONS.BLOCKER,
        true,
        TEST_IDS.TEAM_1,
        TEST_NAMES.TEST_TEAM_1
      )
    ]
  ),
  createMockPlayer(
    TEST_IDS.PLAYER_2,
    TEST_NAMES.PLAYER_2,
    TEST_NUMBERS.PLAYER_2_NUMBER,
    TEST_DATES.PLAYER_2_CREATED,
    [
      createMockPlayerTeamAssignment(
        TEST_NUMBERS.PLAYER_2_NUMBER,
        TEST_POSITIONS.JAMMER,
        true,
        TEST_IDS.TEAM_2,
        TEST_NAMES.TEST_TEAM_2
      )
    ]
  ),
  createMockPlayer(
    TEST_IDS.PLAYER_3,
    TEST_NAMES.PLAYER_3,
    TEST_NUMBERS.PLAYER_3_NUMBER,
    TEST_DATES.PLAYER_3_CREATED,
    [
      createMockPlayerTeamAssignment(
        TEST_NUMBERS.PLAYER_3_NUMBER,
        TEST_POSITIONS.PIVOT,
        false,
        TEST_IDS.TEAM_1,
        TEST_NAMES.TEST_TEAM_1
      )
    ]
  )
]

const mockBouts = [
  createMockBout(
    TEST_IDS.BOUT_1,
    TEST_DATES.BOUT_DATE,
    TEST_IDS.TEAM_1,
    TEST_IDS.TEAM_2,
    TEST_SCORES.HOME_SCORE,
    TEST_SCORES.AWAY_SCORE,
    'completed',
    TEST_DATES.BOUT_CREATED,
    createMockBoutTeam(TEST_IDS.TEAM_1, TEST_NAMES.TEAM_1, TEST_DATES.TEAM_1_FOUNDING),
    createMockBoutTeam(TEST_IDS.TEAM_2, TEST_NAMES.TEAM_2, TEST_DATES.TEAM_1_CREATED)
  )
]

// Mock environment variables for tests
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: TEST_AUTH.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: TEST_AUTH.SUPABASE_ANON_KEY
  }
}))

// Reusable mock factory functions to eliminate duplication
const createMockAuth = () => ({
  signUp: vi.fn(() => Promise.resolve({ 
    data: { user: { id: TEST_IDS.USER, email: TEST_AUTH.USER_EMAIL } }, 
    error: null 
  })),
  signInWithPassword: vi.fn(() => Promise.resolve({ 
    data: { user: { id: TEST_IDS.USER, email: TEST_AUTH.USER_EMAIL } }, 
    error: null 
  })),
  signOut: vi.fn(() => Promise.resolve({ error: null })),
  getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  }))
})

const createMockFrom = () => vi.fn((table: string) => {
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

const createMockSupabaseClient = () => ({
  auth: createMockAuth(),
  from: createMockFrom()
})

// Mock Supabase client for tests
vi.mock('../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
  isSupabaseConfigured: true,
  requireSupabase: vi.fn(() => createMockSupabaseClient())
}))

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: TEST_IDS.USER, email: TEST_AUTH.USER_EMAIL },
    loading: false,
    session: { access_token: 'test-token' },
    signOut: vi.fn()
  }))
}))