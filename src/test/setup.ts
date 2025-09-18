import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Test data constants to avoid magic numbers and duplication
const TEAM1_ID = '1';
const TEAM2_ID = '2';
const TEAM1_NAME = 'Roller Derby Team 1';
const TEAM2_NAME = 'Roller Derby Team 2';
const TEST_TEAM1_NAME = 'Test Team 1';
const TEST_TEAM2_NAME = 'Test Team 2';
const PLAYER1_ID = '1';
const PLAYER2_ID = '2';
const PLAYER3_ID = '3';
const PLAYER1_NAME = 'Player 1';
const PLAYER2_NAME = 'Player 2';
const PLAYER3_NAME = 'Player 3';
const PLAYER1_DERBY = 'Test Player 1';
const PLAYER2_DERBY = 'Test Player 2';
const PLAYER3_DERBY = 'Test Player 3';
const NUMBER_100 = '100';
const NUMBER_200 = '200';
const NUMBER_300 = '300';

// Additional constants for other test data
const BOUT_1 = '1';
const USER_ID = '1';
const BOUT_DATE = '2024-02-15';
const BOUT_CREATED = new Date().toISOString().split('T')[0];
const TEAM_1_FOUNDING = '2023-12-31';
const HOME_SCORE = 120;
const AWAY_SCORE = 105;
const USER_EMAIL = 'test@example.com';
const SUPABASE_URL = 'https://test.supabase.co';
const SUPABASE_ANON_KEY = 'test-anon-key';

// Factory functions
function createTeam(id: string, name: string, created_at: string, roster: { player_id: string, player_name: string }[]) {
  return { id, name, created_at, roster };
}

function createPlayer(
  id: string,
  derby_name: string,
  preferred_number: string,
  created_at: string,
  player_teams: { number: string, position: string, is_active: boolean, teams: { id: string, name: string } }[]
) {
  return { id, derby_name, preferred_number, created_at, player_teams };
}

type MockBoutTeam = {
  id: string
  name: string
  created_at: string
  logo_url: string | null
}

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

const mockTeams = [
  createTeam(TEAM1_ID, TEAM1_NAME, '2024-01-01', [
    { player_id: PLAYER1_ID, player_name: PLAYER1_NAME },
    { player_id: PLAYER2_ID, player_name: PLAYER2_NAME }
  ]),
  createTeam(TEAM2_ID, TEAM2_NAME, '2024-01-02', [
    { player_id: PLAYER3_ID, player_name: PLAYER3_NAME }
  ])
];

const mockPlayers = [
  createPlayer(
    PLAYER1_ID,
    PLAYER1_DERBY,
    NUMBER_100,
    '2024-01-01',
    [
      {
        number: NUMBER_100,
        position: 'blocker',
        is_active: true,
        teams: { id: TEAM1_ID, name: TEST_TEAM1_NAME }
      }
    ]
  ),
  createPlayer(
    PLAYER2_ID,
    PLAYER2_DERBY,
    NUMBER_200,
    '2024-01-02',
    [
      {
        number: NUMBER_200,
        position: 'jammer',
        is_active: true,
        teams: { id: TEAM2_ID, name: TEST_TEAM2_NAME }
      }
    ]
  ),
  createPlayer(
    PLAYER3_ID,
    PLAYER3_DERBY,
    NUMBER_300,
    '2024-01-03',
    [
      {
        number: NUMBER_300,
        position: 'pivot',
        is_active: false,
        teams: { id: TEAM1_ID, name: TEST_TEAM1_NAME }
      }
    ]
  )
];

const mockBouts = [
  createMockBout(
    BOUT_1,
    BOUT_DATE,
    TEAM1_ID,
    TEAM2_ID,
    HOME_SCORE,
    AWAY_SCORE,
    'completed',
    BOUT_CREATED,
    createMockBoutTeam(TEAM1_ID, TEAM1_NAME, TEAM_1_FOUNDING),
    createMockBoutTeam(TEAM2_ID, TEAM2_NAME, '2024-01-02')
  )
]

// Mock environment variables for tests using vi.stubEnv for better isolation
vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
vi.stubEnv('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY)

// Reusable mock factory functions to eliminate duplication
const createMockAuth = () => ({
  signUp: vi.fn(() => Promise.resolve({ 
    data: { user: { id: USER_ID, email: USER_EMAIL } }, 
    error: null 
  })),
  signInWithPassword: vi.fn(() => Promise.resolve({ 
    data: { user: { id: USER_ID, email: USER_EMAIL } }, 
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
  
  // State tracking for query chain simulation
  interface QueryState {
    data: unknown[]
    selectedFields?: string[]
    filters: Array<{ field: string; value: unknown; operator: string }>
    orderBy?: { field: string; ascending: boolean }
    limitCount?: number
    error: Error | null
    shouldSimulateError?: boolean
    errorType?: 'fetch' | 'network' | 'timeout' | 'permission'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createChainableQuery = (state: QueryState = { data: [...data], filters: [], error: null }): any => {
    const applyFilters = (data: unknown[], filters: QueryState['filters']): unknown[] => {
      return data.filter(item => {
        return filters.every(filter => {
          const itemValue = (item as Record<string, unknown>)[filter.field]
          switch (filter.operator) {
            case 'eq':
              return itemValue === filter.value
            case 'neq':
              return itemValue !== filter.value
            case 'gt':
              return typeof itemValue === 'number' && typeof filter.value === 'number' && itemValue > filter.value
            case 'lt':
              return typeof itemValue === 'number' && typeof filter.value === 'number' && itemValue < filter.value
            default:
              return true
          }
        })
      })
    }

    const applyOrder = (data: unknown[], orderBy?: QueryState['orderBy']): unknown[] => {
      if (!orderBy) return data
      
      return [...data].sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[orderBy.field]
        const bValue = (b as Record<string, unknown>)[orderBy.field]
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return 1
        if (bValue == null) return -1
        
        if (aValue < bValue) return orderBy.ascending ? -1 : 1
        if (aValue > bValue) return orderBy.ascending ? 1 : -1
        return 0
      })
    }

    const applyLimit = (data: unknown[], limit?: number): unknown[] => {
      return limit ? data.slice(0, limit) : data
    }

    const applySelect = (data: unknown[], fields?: string[]): unknown[] => {
      if (!fields || fields.includes('*')) return data
      
      return data.map(item => {
        const selected: Record<string, unknown> = {}
        fields.forEach(field => {
          if (field in (item as Record<string, unknown>)) {
            selected[field] = (item as Record<string, unknown>)[field]
          }
        })
        return selected
      })
    }

    const generateError = (errorType?: string) => {
      switch (errorType) {
        case 'network':
          return new Error('Network error: Failed to connect to database')
        case 'timeout':
          return new Error('Timeout error: Database query timed out')
        case 'permission':
          return new Error('Permission error: Insufficient privileges')
        case 'fetch':
        default:
          return new Error('Database error: Failed to fetch data')
      }
    }

    const executeQuery = (): { data: unknown[]; error: unknown } => {
      // Check for configured errors first
      if (state.error) return { data: [], error: state.error }
      if (state.shouldSimulateError) {
        return { data: [], error: generateError(state.errorType) }
      }
      
      let result = applyFilters(state.data, state.filters)
      result = applyOrder(result, state.orderBy)
      result = applyLimit(result, state.limitCount)
      result = applySelect(result, state.selectedFields)
      
      return { data: result, error: null }
    }

    return {
      select: vi.fn((fields: string = '*') => {
        const fieldArray = fields === '*' ? ['*'] : fields.split(',').map(f => f.trim())
        return createChainableQuery({
          ...state,
          selectedFields: fieldArray
        })
      }),
      eq: vi.fn((field: string, value: unknown) => {
        return createChainableQuery({
          ...state,
          filters: [...state.filters, { field, value, operator: 'eq' }]
        })
      }),
      neq: vi.fn((field: string, value: unknown) => {
        return createChainableQuery({
          ...state,
          filters: [...state.filters, { field, value, operator: 'neq' }]
        })
      }),
      gt: vi.fn((field: string, value: unknown) => {
        return createChainableQuery({
          ...state,
          filters: [...state.filters, { field, value, operator: 'gt' }]
        })
      }),
      lt: vi.fn((field: string, value: unknown) => {
        return createChainableQuery({
          ...state,
          filters: [...state.filters, { field, value, operator: 'lt' }]
        })
      }),
      order: vi.fn((field: string, options?: { ascending?: boolean }) => {
        return createChainableQuery({
          ...state,
          orderBy: { field, ascending: options?.ascending ?? true }
        })
      }),
      limit: vi.fn((count: number) => {
        return createChainableQuery({
          ...state,
          limitCount: count
        })
      }),
      // Enhanced error simulation methods
      simulateError: vi.fn((errorType: 'fetch' | 'network' | 'timeout' | 'permission' = 'fetch') => {
        return createChainableQuery({
          ...state,
          shouldSimulateError: true,
          errorType
        })
      }),
      withError: vi.fn((error: Error | null) => {
        return createChainableQuery({
          ...state,
          error
        })
      }),
      then: vi.fn((onResolve, onReject) => {
        const result = executeQuery()
        if (result.error && onReject) {
          return onReject(result.error)
        }
        return onResolve(result)
      }),
      // Promise-like interface
      catch: vi.fn((onReject) => {
        const result = executeQuery()
        if (result.error) {
          return onReject(result.error)
        }
        return Promise.resolve(result)
      })
    }
  }
  
  return {
    select: vi.fn((fields: string = '*') => {
      const fieldArray = fields === '*' ? ['*'] : fields.split(',').map(f => f.trim())
      return createChainableQuery({ 
        data: [...data], 
        selectedFields: fieldArray, 
        filters: [], 
        error: null 
      })
    }),
    insert: vi.fn((values: unknown) => ({
      select: vi.fn(() => {
        if (Array.isArray(values)) {
          return Promise.resolve({ 
            data: values.map((item, index) => 
              typeof item === 'object' && item !== null 
                ? { id: `new-id-${index}`, ...item as Record<string, unknown> }
                : { id: `new-id-${index}`, value: item }
            ), 
            error: null 
          })
        } else {
          return Promise.resolve({ 
            data: [typeof values === 'object' && values !== null 
              ? { id: 'new-id', ...values as Record<string, unknown> }
              : { id: 'new-id', value: values }
            ], 
            error: null 
          })
        }
      })
    })),
    update: vi.fn((values: unknown) => ({
      eq: vi.fn((field: string, value: unknown) => {
        // Simulate updating matching records
        const updatedData = data.map(item => {
          const itemRecord = item as Record<string, unknown>
          if (itemRecord[field] === value && typeof values === 'object' && values !== null) {
            return { ...itemRecord, ...values as Record<string, unknown> }
          }
          return item
        })
        return Promise.resolve({ data: updatedData, error: null })
      })
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((field: string, value: unknown) => {
        // Simulate deleting matching records
        const remainingData = data.filter(item => 
          (item as Record<string, unknown>)[field] !== value
        )
        return Promise.resolve({ data: remainingData, error: null })
      })
    })),
    eq: vi.fn((field: string, value: unknown) => {
      return createChainableQuery({ 
        data: [...data], 
        filters: [{ field, value, operator: 'eq' }], 
        error: null 
      })
    }),
    order: vi.fn((field: string, options?: { ascending?: boolean }) => {
      return createChainableQuery({ 
        data: [...data], 
        filters: [], 
        orderBy: { field, ascending: options?.ascending ?? true },
        error: null 
      })
    }),
    limit: vi.fn((count: number) => {
      return createChainableQuery({ 
        data: [...data], 
        filters: [], 
        limitCount: count,
        error: null 
      })
    }),
    // Error simulation methods for testing error scenarios
    simulateError: vi.fn((errorType: 'fetch' | 'network' | 'timeout' | 'permission' = 'fetch') => {
      return createChainableQuery({ 
        data: [...data], 
        filters: [], 
        error: null,
        shouldSimulateError: true,
        errorType
      })
    }),
    withError: vi.fn((error: Error | null) => {
      return createChainableQuery({ 
        data: [...data], 
        filters: [], 
        error
      })
    })
  }
})

const createMockSupabaseClient = () => ({
  auth: createMockAuth(),
  from: createMockFrom()
})

// Create a singleton mock Supabase client for all tests
const mockSupabaseClient = createMockSupabaseClient();

// Mock Supabase client for tests
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  isSupabaseConfigured: true,
  requireSupabase: vi.fn(() => mockSupabaseClient)
}))

// Utility function for creating consistent auth mock configurations
export const createMockAuthState = (overrides: Partial<{
  user: { id: string; email: string } | null
  loading: boolean
  session: { access_token: string } | null
  signOut: () => void
}> = {}) => ({
  user: overrides.user ?? { id: USER_ID, email: USER_EMAIL },
  loading: overrides.loading ?? false,
  session: overrides.session ?? { access_token: 'test-token' },
  signOut: overrides.signOut ?? vi.fn()
})