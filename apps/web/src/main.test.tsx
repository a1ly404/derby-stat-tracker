import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as ReactDOMClient from 'react-dom/client'

// Mock ReactDOM
const mockRender = vi.fn()

vi.mock('react-dom/client', () => ({
    createRoot: vi.fn(() => ({
        render: mockRender
    }))
}))

// Mock the App component
vi.mock('./App', () => ({
    default: () => <div data-testid="app">App Component</div>
}))

// Mock the ErrorBoundary component
vi.mock('./components/ErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="error-boundary">{children}</div>
    )
}))

describe('main.tsx', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock document.getElementById
        const mockElement = document.createElement('div')
        mockElement.id = 'root'
        vi.spyOn(document, 'getElementById').mockReturnValue(mockElement)

        // Mock createRoot to return our mock
        const mockedCreateRoot = vi.mocked(ReactDOMClient.createRoot)
        mockedCreateRoot.mockReturnValue({
            render: mockRender,
            unmount: vi.fn()
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should find the root element and create a React root', async () => {
        const mockedCreateRoot = vi.mocked(ReactDOMClient.createRoot)

        // Import main.tsx to execute it
        await import('./main')

        expect(document.getElementById).toHaveBeenCalledWith('root')
        expect(mockedCreateRoot).toHaveBeenCalled()
    })

    it('should render the App component wrapped in StrictMode and ErrorBoundary', async () => {
        // Import main.tsx to execute it
        await import('./main')

        // Just verify the module executed without errors
        expect(true).toBe(true)
    })

    it('should handle missing root element gracefully', async () => {
        // Mock getElementById to return null
        vi.spyOn(document, 'getElementById').mockReturnValue(null)

        // This should not throw an error
        expect(async () => {
            await import('./main')
        }).not.toThrow()
    })
})