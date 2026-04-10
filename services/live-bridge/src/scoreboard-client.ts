import { logger } from './logger.js'
import { DISCONNECTED_STATE } from './types.js'
import type { LiveState } from './types.js'

export interface HealthResponse {
  connected: boolean
  version?: string
}

// ---------------------------------------------------------------------------
// ScoreboardClient
// ---------------------------------------------------------------------------

export class ScoreboardClient {
  private readonly baseUrl: string

  /**
   * @param baseUrl  Base URL of the scoreboard API, e.g. "http://localhost:5001".
   *                 Trailing slashes are stripped by the caller (config.ts), but
   *                 we strip again defensively here.
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Fetch the current live state from the scoreboard API.
   *
   * - Returns the parsed `LiveState` on success (2xx).
   * - Returns a disconnected sentinel when the API responds with a non-2xx
   *   status (e.g. 503 Service Unavailable, which the Python service emits
   *   when CRG is not connected).
   * - Returns a disconnected sentinel on any network / parse error, logging a
   *   warning so the caller is never forced to handle exceptions.
   */
  async getLive(): Promise<LiveState> {
    const url = `${this.baseUrl}/live`

    let response: Response
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
        headers: { Accept: 'application/json' },
      })
    } catch (err) {
      logger.warn('ScoreboardClient: network error fetching /live — scoreboard unreachable', {
        url,
        error: errorMessage(err),
      })
      return DISCONNECTED_STATE
    }

    // The Python service returns 503 + { "connected": false } when CRG is
    // disconnected. Treat any non-2xx as a disconnected state so the bridge
    // keeps running without throwing.
    if (!response.ok) {
      logger.warn('ScoreboardClient: non-2xx response from /live', {
        url,
        status: response.status,
        statusText: response.statusText,
      })

      // Attempt to parse the body anyway; it might still contain useful fields.
      try {
        const body = (await response.json()) as Partial<LiveState>
        if (typeof body.connected === 'boolean') {
          return {
            ...DISCONNECTED_STATE,
            ...body,
            connected: false, // force false regardless of body value
          }
        }
      } catch {
        // Body was not JSON — just return the sentinel.
      }

      return DISCONNECTED_STATE
    }

    let data: unknown
    try {
      data = await response.json()
    } catch (err) {
      logger.warn('ScoreboardClient: failed to parse JSON from /live', {
        url,
        error: errorMessage(err),
      })
      return DISCONNECTED_STATE
    }

    if (!isLiveState(data)) {
      logger.warn('ScoreboardClient: /live response does not match expected shape', {
        url,
        received: JSON.stringify(data).slice(0, 200),
      })
      return DISCONNECTED_STATE
    }

    return data
  }

  /**
   * Fetch the health/connection status of the scoreboard API.
   *
   * The `/health` endpoint always returns HTTP 200 regardless of whether the
   * underlying CRG WebSocket is connected — the `connected` field in the body
   * tells us that.
   *
   * Returns `{ connected: false }` on any error so callers can branch on the
   * field without needing try/catch.
   */
  async getHealth(): Promise<HealthResponse> {
    const url = `${this.baseUrl}/health`

    let response: Response
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
        headers: { Accept: 'application/json' },
      })
    } catch (err) {
      logger.warn('ScoreboardClient: network error fetching /health', {
        url,
        error: errorMessage(err),
      })
      return { connected: false }
    }

    if (!response.ok) {
      logger.warn('ScoreboardClient: non-2xx response from /health', {
        url,
        status: response.status,
      })
      return { connected: false }
    }

    let data: unknown
    try {
      data = await response.json()
    } catch (err) {
      logger.warn('ScoreboardClient: failed to parse JSON from /health', {
        url,
        error: errorMessage(err),
      })
      return { connected: false }
    }

    if (!isHealthResponse(data)) {
      logger.warn('ScoreboardClient: /health response does not match expected shape', {
        url,
        received: JSON.stringify(data).slice(0, 200),
      })
      return { connected: false }
    }

    return data
  }
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isLiveState(value: unknown): value is LiveState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v['connected'] === 'boolean'
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v['connected'] === 'boolean' &&
    (v['version'] === undefined || typeof v['version'] === 'string')
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
