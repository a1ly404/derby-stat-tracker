import React, { useState, useEffect, useRef } from 'react'
import './LiveScoreboardView.css'

export interface LiveScoreboardViewProps {
  connected: boolean
  onBack: () => void
}

const POLL_INTERVAL_MS = 5000
const DEFAULT_SCOREBOARD_URL = 'http://localhost:5001'

const LiveScoreboardView: React.FC<LiveScoreboardViewProps> = ({ onBack }) => {
  const [scoreboardUrl, setScoreboardUrl] = useState(DEFAULT_SCOREBOARD_URL)
  const [connected, setConnected] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [urlInput, setUrlInput] = useState(DEFAULT_SCOREBOARD_URL)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkHealth = async (url: string) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const response = await fetch(`${url}/health`, {
        signal: controller.signal,
        mode: 'cors',
      })
      clearTimeout(timeout)
      setConnected(response.ok)
    } catch {
      setConnected(false)
    } finally {
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    // Run immediately on mount / URL change
    checkHealth(scoreboardUrl)

    intervalRef.current = setInterval(() => {
      checkHealth(scoreboardUrl)
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [scoreboardUrl])

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim().replace(/\/+$/, '')
    if (trimmed) {
      setScoreboardUrl(trimmed)
    }
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyUrl()
    }
  }

  return (
    <div className="live-scoreboard-view">
      {/* Top bar */}
      <div className="lsv-topbar">
        <button className="lsv-back-btn" onClick={onBack}>
          ← Back to mode selection
        </button>

        <div className="lsv-status-badge" data-connected={connected}>
          <span className="lsv-status-dot" />
          <span className="lsv-status-label">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          {lastChecked && (
            <span className="lsv-status-time">
              checked {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Settings bar */}
      <div className="lsv-settings-bar">
        <label className="lsv-settings-label" htmlFor="scoreboard-url">
          📡 Scoreboard API URL
        </label>
        <div className="lsv-url-row">
          <input
            id="scoreboard-url"
            type="url"
            className="lsv-url-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder={DEFAULT_SCOREBOARD_URL}
            spellCheck={false}
          />
          <button
            className="lsv-apply-btn"
            onClick={handleApplyUrl}
            disabled={!urlInput.trim() || urlInput.trim().replace(/\/+$/, '') === scoreboardUrl}
          >
            Apply
          </button>
        </div>
        {scoreboardUrl !== DEFAULT_SCOREBOARD_URL && (
          <p className="lsv-active-url">
            Active: <code>{scoreboardUrl}</code>
          </p>
        )}
      </div>

      {/* Main content area */}
      <div className="lsv-content">
        {connected ? (
          <div className="lsv-placeholder">
            <div className="lsv-placeholder-icon">📊</div>
            <h2 className="lsv-placeholder-title">Live Scoreboard</h2>
            <p className="lsv-placeholder-subtitle">
              Connected to <code>{scoreboardUrl}</code>.<br />
              Live scoreboard data will appear here once the feed integration is complete.
            </p>
          </div>
        ) : (
          <div className="lsv-placeholder">
            <div className="lsv-placeholder-icon lsv-placeholder-icon--pulse">📡</div>
            <h2 className="lsv-placeholder-title">Live scoreboard feed — connecting...</h2>
            <p className="lsv-placeholder-subtitle">
              Attempting to reach <code>{scoreboardUrl}</code>.<br />
              Make sure your CRG scoreboard is running and the URL above is correct.
            </p>
            <p className="lsv-placeholder-hint">
              Retrying every {POLL_INTERVAL_MS / 1000} seconds…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveScoreboardView
