import './ErrorBoundary.css'

interface ConfigurationErrorProps {
    error?: string
}

export function ConfigurationError({ error }: ConfigurationErrorProps) {
    return (
        <div className="error-container">
            <div className="error-content">
                <h1>🚨 Configuration Error</h1>
                <p>
                    The Derby Stat Tracker is not properly configured for this environment.
                </p>
                <details>
                    <summary>Technical Details</summary>
                    <p>Missing required environment variables for database connection:</p>
                    <ul style={{ textAlign: 'left', marginTop: '10px', marginLeft: '20px' }}>
                        <li>VITE_SUPABASE_URL</li>
                        <li>VITE_SUPABASE_ANON_KEY</li>
                    </ul>
                    {error && (
                        <p style={{ color: '#e74c3c', marginTop: '10px' }}>
                            Error: {error}
                        </p>
                    )}
                </details>
                <div style={{ marginTop: '30px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        If you're a developer, add these variables to your .env.local file.<br />
                        If you're a user, please contact your administrator.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="retry-button"
                    style={{ marginTop: '20px' }}
                >
                    Retry
                </button>
            </div>
        </div>
    )
}