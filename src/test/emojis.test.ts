import { describe, it, expect } from 'vitest'
import { 
    getNavigationEmoji, 
    getStatsEmoji, 
    getActivityEmoji,
    getBoutEmoji,
    getUIEmoji, 
    getBrandEmoji, 
    EMOJIS 
} from '../utils/emojis'

describe('Emojis Utility', () => {
    it('navigation emoji functions work', () => {
        expect(typeof getNavigationEmoji('dashboard')).toBe('string')
        expect(getNavigationEmoji('dashboard')).toBeTruthy()
        expect(typeof getNavigationEmoji('bouts')).toBe('string')
        expect(typeof getNavigationEmoji('teams')).toBe('string')
        expect(typeof getNavigationEmoji('settings')).toBe('string')
    })

    it('stats emoji functions work', () => {
        expect(typeof getStatsEmoji('teams')).toBe('string')
        expect(typeof getStatsEmoji('bouts')).toBe('string')
        expect(typeof getStatsEmoji('activeUsers')).toBe('string')
        expect(typeof getStatsEmoji('analytics')).toBe('string')
    })

    it('activity emoji functions work', () => {
        expect(typeof getActivityEmoji('teamAdded')).toBe('string')
        expect(typeof getActivityEmoji('boutScheduled')).toBe('string')
    })

    it('bout emoji functions work', () => {
        expect(typeof getBoutEmoji('empty')).toBe('string')
        expect(typeof getBoutEmoji('venue')).toBe('string')
        expect(typeof getBoutEmoji('notes')).toBe('string')
    })

    it('UI emoji functions work', () => {
        expect(typeof getUIEmoji('success')).toBe('string')
        expect(typeof getUIEmoji('loading')).toBe('string')
        expect(typeof getUIEmoji('error')).toBe('string')
        expect(typeof getUIEmoji('warning')).toBe('string')
    })

    it('brand emoji functions work', () => {
        expect(typeof getBrandEmoji('favicon')).toBe('string')
        expect(typeof getBrandEmoji('app')).toBe('string')
    })

    it('exports EMOJIS object with all categories', () => {
        expect(EMOJIS).toHaveProperty('navigation')
        expect(EMOJIS).toHaveProperty('stats')
        expect(EMOJIS).toHaveProperty('activity')
        expect(EMOJIS).toHaveProperty('bout')
        expect(EMOJIS).toHaveProperty('ui')
        expect(EMOJIS).toHaveProperty('brand')
        
        expect(EMOJIS.navigation).toHaveProperty('dashboard')
        expect(EMOJIS.stats).toHaveProperty('teams')
        expect(EMOJIS.brand).toHaveProperty('app')
    })
})