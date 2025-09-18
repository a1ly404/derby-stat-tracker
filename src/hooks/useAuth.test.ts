import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('should export useAuth hook', () => {
    expect(typeof useAuth).toBe('function')
  })

  it('should return an object with expected properties', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('session')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('signOut')
    expect(typeof result.current.signOut).toBe('function')
  })

  it('should handle hook initialization without errors', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).not.toThrow()
  })

  it('should return loading as boolean', () => {
    const { result } = renderHook(() => useAuth())

    expect(typeof result.current.loading).toBe('boolean')
  })

  it('should signOut function not throw when called', async () => {
    const { result } = renderHook(() => useAuth())

    await expect(async () => {
      await result.current.signOut()
    }).not.toThrow()
  })
})