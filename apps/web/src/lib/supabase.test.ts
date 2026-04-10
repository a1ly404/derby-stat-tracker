import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('supabase.ts', () => {
  beforeEach(() => {
    // Clear all modules before each test
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should export the required functions and variables', async () => {
    const module = await import('../lib/supabase')
    
    expect(typeof module).toBe('object')
    expect('supabase' in module).toBe(true)
    expect('isSupabaseConfigured' in module).toBe(true)
    expect('requireSupabase' in module).toBe(true)
  })

  it('should export isSupabaseConfigured as a boolean', async () => {
    const { isSupabaseConfigured } = await import('../lib/supabase')
    
    expect(typeof isSupabaseConfigured).toBe('boolean')
  })

  it('should export requireSupabase as a function', async () => {
    const { requireSupabase } = await import('../lib/supabase')
    
    expect(typeof requireSupabase).toBe('function')
  })

  it('should have supabase export that is either object or null', async () => {
    const { supabase } = await import('../lib/supabase')
    
    expect(supabase === null || typeof supabase === 'object').toBe(true)
  })

  it('should handle module import without errors', async () => {
    let error = null
    try {
      await import('../lib/supabase')
    } catch (e) {
      error = e
    }
    
    expect(error).toBeNull()
  })
})