import { logger } from './logger.js'
import type { ScoreboardClient } from './scoreboard-client.js'
import type { SupabaseWriter } from './supabase-writer.js'
import type { BridgeConfig, JamKey, LiveState } from './types.js'
import { makeJamKey } from './types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// ---------------------------------------------------------------------------
// JamPoller
// ---------------------------------------------------------------------------

/**
 * Orchestrates the polling loop:
 *
 *  1. Polls `ScoreboardClient.getLive()` every `pollIntervalMs` milliseconds.
 *  2. Tracks the current jam via a `JamKey` ("P{period}J{jam}").
 *  3. When the jam key changes, writes a snapshot of the **completed** jam to
 *     Supabase via `SupabaseWriter.writeJamSnapshot()`.
 *  4. When the scoreboard disconnects, arms a debounce timer that writes the
 *     last known jam snapshot after `jamEndDebounceMs` (in case the connection
 *     does not recover quickly).
 *  5. Exposes `shutdown()` for graceful termination — flushes the current jam
 *     snapshot and marks the live_game row as completed.
 */
export class JamPoller {
  private running = false

  private readonly client: ScoreboardClient
  private readonly writer: SupabaseWriter
  private readonly config: BridgeConfig

  // Persistent state across polls
  private liveGameId: string | null = null
  private lastJamKey: JamKey | null = null
  private lastLiveState: LiveState | null = null
  private wasConnected = false

  // Debounce timer — fires when the scoreboard disconnects mid-jam so we
  // don't lose the last known state if the connection never comes back.
  private debounceHandle: ReturnType<typeof setTimeout> | null = null
  private debounceKey: JamKey | null = null
  private debounceState: LiveState | null = null

  constructor(
    client: ScoreboardClient,
    writer: SupabaseWriter,
    config: BridgeConfig,
  ) {
    this.client = client
    this.writer = writer
    this.config = config
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Starts the polling loop.  Resolves only when `stop()` (or `shutdown()`)
   * has been called and the loop has exited.
   *
   * @param boutId  Optional UUID from the `bouts` table to associate this live
   *                session with.  Pass `null` to start an unlinked session.
   */
  async start(boutId: string | null): Promise<void> {
    if (this.running) {
      logger.warn('JamPoller.start() called while already running — ignoring')
      return
    }

    this.running = true

    // Ensure we have a live_game row before entering the tight poll loop.
    try {
      this.liveGameId = await this.writer.ensureLiveGame(
        boutId,
        this.config.scoreboardApiUrl,
      )
      logger.info('Live game ready', {
        liveGameId: this.liveGameId,
        boutId: boutId ?? '(none)',
        pollIntervalMs: this.config.pollIntervalMs,
        jamEndDebounceMs: this.config.jamEndDebounceMs,
      })
    } catch (err) {
      this.running = false
      logger.error('Failed to initialise live_game row — aborting start', {
        error: errorMessage(err),
      })
      throw err
    }

    // Main loop — runs until this.running is set to false.
    while (this.running) {
      const tickStart = Date.now()

      try {
        await this.tick()
      } catch (err) {
        // Defensive catch: tick() catches its own errors, but if something
        // truly unexpected escapes we log it and keep running rather than
        // crashing the whole process.
        logger.error('Unexpected error in polling tick', { error: errorMessage(err) })
      }

      if (!this.running) break

      // Sleep for the remainder of the poll interval so we maintain a
      // consistent cadence even when the HTTP round-trip takes non-trivial time.
      const elapsed = Date.now() - tickStart
      const waitMs = Math.max(0, this.config.pollIntervalMs - elapsed)
      if (waitMs > 0) {
        await sleep(waitMs)
      }
    }

    logger.info('Polling loop exited cleanly')
  }

  /**
   * Signals the polling loop to stop after the current tick completes.
   * Also cancels any pending debounce timer.
   *
   * Note: call `shutdown()` instead if you also need to flush state and mark
   * the live_game as completed (e.g. on SIGINT/SIGTERM).
   */
  stop(): void {
    if (!this.running) return
    logger.info('JamPoller.stop() called — halting polling loop after current tick')
    this.running = false
    this.clearDebounce()
  }

  /**
   * Performs a full graceful shutdown:
   *  1. Stops the polling loop.
   *  2. Writes a final snapshot for the last known jam (if any).
   *  3. Marks the `live_games` row as `completed`.
   *
   * Await this before calling `process.exit()` to ensure no data is lost.
   */
  async shutdown(): Promise<void> {
    logger.info('Initiating graceful shutdown')
    this.stop()

    // Write the latest state of the current jam so we don't lose it.
    if (this.lastJamKey !== null && this.lastLiveState !== null) {
      logger.info('Flushing final jam snapshot before exit', {
        jamKey: this.lastJamKey,
      })
      await this.flushSnapshot(this.lastJamKey, this.lastLiveState)
    } else {
      logger.debug('No in-flight jam to flush on shutdown')
    }

    // Mark the game row as completed.
    if (this.liveGameId) {
      try {
        await this.writer.completeLiveGame(this.liveGameId)
      } catch (err) {
        // Log but don't rethrow — we're already shutting down; best effort.
        logger.error('Failed to mark live_game as completed during shutdown', {
          liveGameId: this.liveGameId,
          error: errorMessage(err),
        })
      }

      // Trigger post-game digest (best-effort — digestGame logs warnings
      // internally and never throws).
      try {
        await this.writer.digestGame(this.liveGameId)
      } catch (err) {
        logger.warn('Post-game digest failed during shutdown', {
          liveGameId: this.liveGameId,
          error: errorMessage(err),
        })
      }
    }

    logger.info('Graceful shutdown complete')
  }

  // -------------------------------------------------------------------------
  // Polling tick
  // -------------------------------------------------------------------------

  private async tick(): Promise<void> {
    const state = await this.client.getLive()

    // --- Connection state transitions --------------------------------------- //

    if (state.connected && !this.wasConnected) {
      logger.info('Scoreboard reconnected — resuming snapshot capture')
      // Cancel the debounce that was armed on disconnect; the scoreboard is
      // back so we'll keep updating lastLiveState with fresh data instead of
      // flushing stale state.
      this.clearDebounce()
    } else if (!state.connected && this.wasConnected) {
      logger.warn(
        'Scoreboard disconnected — keeping polling loop alive, will retry',
      )
      // Arm the debounce: if the scoreboard does not reconnect within
      // jamEndDebounceMs, write whatever state we last saw so the snapshot
      // is not permanently lost.
      if (this.lastJamKey !== null && this.lastLiveState !== null) {
        this.armDebounce(this.lastJamKey, this.lastLiveState)
      }
    }

    this.wasConnected = state.connected

    // No useful jam data while disconnected — bail out early but don't clear
    // lastLiveState so we can still flush it via the debounce.
    if (!state.connected) return

    // --- Jam key change detection ----------------------------------------- //

    const currentKey = makeJamKey(state.period, state.jam)

    if (currentKey !== this.lastJamKey) {
      logger.info('Jam transition detected', {
        from: this.lastJamKey ?? '(none)',
        to: currentKey ?? '(none)',
        period: state.period,
        jam: state.jam,
      })

      // The previous jam is now complete.  Write its final known state
      // immediately — we cancel any pending debounce first since we already
      // have a definitive transition trigger.
      if (this.lastJamKey !== null && this.lastLiveState !== null) {
        this.clearDebounce()
        await this.flushSnapshot(this.lastJamKey, this.lastLiveState)
      }

      this.lastJamKey = currentKey

      if (currentKey === null) {
        // period/jam are null — scoreboard connected but no active jam yet
        // (e.g. pre-game, between periods).  Nothing further to do this tick.
        logger.debug('Connected but no active jam (period/jam not yet set)', {
          period: state.period,
          jam: state.jam,
        })
      }
    }

    // Always update to the freshest state for the current jam so the next
    // flush (on transition or shutdown) captures the most recent data.
    this.lastLiveState = state
  }

  // -------------------------------------------------------------------------
  // Debounce helpers
  // -------------------------------------------------------------------------

  /**
   * Arms the disconnect debounce timer.  After `jamEndDebounceMs` the snapshot
   * is written via `flushSnapshot()`.  Any previously armed timer is cancelled
   * first so only one timer is live at a time.
   */
  private armDebounce(key: JamKey, state: LiveState): void {
    this.clearDebounce()

    logger.debug('Arming disconnect debounce', {
      jamKey: key,
      debounceMs: this.config.jamEndDebounceMs,
    })

    this.debounceKey = key
    this.debounceState = state

    this.debounceHandle = setTimeout(() => {
      const pendingKey = this.debounceKey
      const pendingState = this.debounceState

      this.debounceHandle = null
      this.debounceKey = null
      this.debounceState = null

      if (pendingKey !== null && pendingState !== null) {
        logger.info('Debounce fired — writing jam snapshot after disconnect', {
          jamKey: pendingKey,
        })
        void this.flushSnapshot(pendingKey, pendingState).catch((err) => {
          logger.error('Debounce-triggered snapshot write failed', {
            jamKey: pendingKey,
            error: errorMessage(err),
          })
        })
      }
    }, this.config.jamEndDebounceMs)
  }

  /** Cancels the debounce timer and clears associated state. */
  private clearDebounce(): void {
    if (this.debounceHandle !== null) {
      clearTimeout(this.debounceHandle)
      this.debounceHandle = null
    }
    this.debounceKey = null
    this.debounceState = null
  }

  // -------------------------------------------------------------------------
  // Snapshot writer
  // -------------------------------------------------------------------------

  /**
   * Delegates to `SupabaseWriter.writeJamSnapshot()`, adding structured
   * logging around the call.  Errors are caught, logged, and swallowed so that
   * a transient Supabase outage does not crash the polling loop.
   */
  private async flushSnapshot(key: JamKey, state: LiveState): Promise<void> {
    if (!this.liveGameId) {
      logger.warn('flushSnapshot called before liveGameId was set — skipping', {
        jamKey: key,
      })
      return
    }

    logger.info('Writing jam snapshot', {
      jamKey: key,
      liveGameId: this.liveGameId,
      period: state.period,
      jam: state.jam,
      team1Score: state.team1?.score ?? null,
      team2Score: state.team2?.score ?? null,
      team1Lead: state.team1?.lead ?? null,
      team2Lead: state.team2?.lead ?? null,
    })

    try {
      await this.writer.writeJamSnapshot(this.liveGameId, state)
      logger.debug('Jam snapshot persisted successfully', {
        jamKey: key,
        liveGameId: this.liveGameId,
      })
    } catch (err) {
      // A single failed write is not fatal for the bridge — the poll loop
      // must keep running so we don't lose future snapshots.
      logger.error('Failed to persist jam snapshot — will continue polling', {
        jamKey: key,
        liveGameId: this.liveGameId,
        error: errorMessage(err),
      })
    }
  }
}
