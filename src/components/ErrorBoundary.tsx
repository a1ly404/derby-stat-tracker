import { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
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
                            <p>Please contact your administrator to configure the application.</p>
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

        return this.props.children
    }
}

export default ErrorBoundary