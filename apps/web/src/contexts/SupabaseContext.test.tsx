import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SupabaseProvider, SupabaseContext } from './SupabaseContext'
import React from 'react'

describe('SupabaseContext', () => {
    it('should export SupabaseContext', () => {
        expect(SupabaseContext).toBeDefined()
        expect(typeof SupabaseContext).toBe('object')
    })

    it('should export SupabaseProvider component', () => {
        expect(SupabaseProvider).toBeDefined()
        expect(typeof SupabaseProvider).toBe('function')
    })

    it('should render SupabaseProvider without crashing', () => {
        const TestChild = () => <div>Test Child</div>

        expect(() => {
            render(
                <SupabaseProvider>
                    <TestChild />
                </SupabaseProvider>
            )
        }).not.toThrow()
    })

    it('should render children when wrapped with SupabaseProvider', () => {
        const TestChild = () => <div data-testid="test-child">Test Child</div>

        const { getByTestId } = render(
            <SupabaseProvider>
                <TestChild />
            </SupabaseProvider>
        )

        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    it('should provide context value to children', () => {
        const TestChild = () => {
            const context = React.useContext(SupabaseContext)
            return <div data-testid="context-test">{context ? 'Context exists' : 'No context'}</div>
        }

        const { getByTestId } = render(
            <SupabaseProvider>
                <TestChild />
            </SupabaseProvider>
        )

        expect(getByTestId('context-test')).toBeInTheDocument()
    })
})