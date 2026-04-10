import { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'
import { isSupabaseConfigured } from '../lib/supabase'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Save error info to state so we can display it to the developer
        this.setState({ errorInfo })
        console.error('Uncaught error:', error, errorInfo)
    }

    renderConfigError() {
        return (
            <div className="error-container">
                <div className="error-content">
                    <h1>🚨 Configuration Error</h1>
                    <p>
                        The Derby Stat Tracker is not properly configured for this environment.
                    </p>
                    <details>
                        <summary>Technical Details</summary>
                        <p>Missing required environment variables for database connection.</p>
                        <ul style={{ textAlign: 'left', marginTop: '10px', marginLeft: '20px' }}>
                            <li>VITE_SUPABASE_URL</li>
                            <li>VITE_SUPABASE_ANON_KEY</li>
                        </ul>
                        <p>Please add the missing environment variables in your <code>.env</code> file.</p>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="retry-button"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    renderGenericError() {
        const { error, errorInfo } = this.state

        return (
            <div className="error-container">
                <div className="error-content">
                    <h1>⚠️ An unexpected error occurred</h1>
                    <p>
                        Something went wrong while running the application. If you're a developer,
                        the details below may help diagnose the issue.
                    </p>
                    <details>
                        <summary>Show error details</summary>
                        <div style={{ textAlign: 'left', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                            {error && <div><strong>Message:</strong> {error.message}</div>}
                            {errorInfo?.componentStack && (
                                <div style={{ marginTop: '10px' }}>
                                    <strong>Component stack:</strong>
                                    <pre style={{ background: '#f6f8fa', padding: '8px', borderRadius: 4 }}>{errorInfo.componentStack}</pre>
                                </div>
                            )}
                        </div>
                    </details>
                    <div style={{ marginTop: '20px' }}>
                        <button onClick={() => window.location.reload()} className="retry-button">Reload</button>
                    </div>
                </div>
            </div>
        )
    }

    public render() {
        if (this.state.hasError) {
            // If Supabase isn't configured, show a clear configuration error.
            if (!isSupabaseConfigured) {
                return this.renderConfigError()
            }

            // Otherwise show the real error details so developers can debug
            return this.renderGenericError()
        }

        return this.props.children
    }
}

export default ErrorBoundary