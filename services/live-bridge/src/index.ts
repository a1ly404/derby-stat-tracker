import 'dotenv/config'
import { loadConfig } from './config.js'
import { logger } from './logger.js'
import { ScoreboardClient } from './scoreboard-client.js'
import { SupabaseWriter } from './supabase-writer.js'
import { JamPoller } from './poller.js'

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Load and validate configuration — throws immediately on missing vars so
  // the operator sees a clear error rather than a cryptic runtime crash.
  const config = loadConfig()

  // Override the module-level logger now that we know the desired log level.
  // (The logger reads process.env.LOG_LEVEL dynamically, so setting it here is
  // sufficient — no need to re-create the logger instance.)
  process.env.LOG_LEVEL = config.logLevel

  // -------------------------------------------------------------------------
  // Startup banner
  // -------------------------------------------------------------------------

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  logger.info(' @derby/live-bridge  v0.1.0')
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  logger.info('Starting live-bridge service', {
    scoreboardApiUrl: config.scoreboardApiUrl,
    supabaseUrl: config.supabaseUrl,
    pollIntervalMs: config.pollIntervalMs,
    jamEndDebounceMs: config.jamEndDebounceMs,
    logLevel: config.logLevel,
  })

  // ---------------------------------------------------------------------------
  // Optional bout ID — links this live session to an existing bout record.
  // ---------------------------------------------------------------------------

  const boutId = process.env.BOUT_ID?.trim() || null
  if (boutId) {
    logger.info('Linking live session to bout', { boutId })
  } else {
    logger.info('No BOUT_ID set — live session will not be linked to a bout')
  }

  // -------------------------------------------------------------------------
  // Instantiate services
  // -------------------------------------------------------------------------

  const scoreboardClient = new ScoreboardClient(config.scoreboardApiUrl)
  const supabaseWriter = new SupabaseWriter(config.supabaseUrl, config.supabaseServiceKey)
  const poller = new JamPoller(scoreboardClient, supabaseWriter, config)

  // -------------------------------------------------------------------------
  // Graceful shutdown handler
  //
  // Called on SIGINT (Ctrl-C) and SIGTERM (container stop / process manager).
  // We give the poller a chance to flush the current jam snapshot and mark the
  // live_game row as completed before exiting.
  // -------------------------------------------------------------------------

  let shuttingDown = false

  async function handleShutdown(signal: string): Promise<void> {
    if (shuttingDown) {
      // A second signal (e.g. impatient Ctrl-C) — exit immediately.
      logger.warn(`Received second ${signal} — forcing immediate exit`)
      process.exit(1)
    }

    shuttingDown = true
    logger.info(`Received ${signal} — initiating graceful shutdown…`)

    try {
      await poller.shutdown()
    } catch (err) {
      logger.error('Error during graceful shutdown', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    logger.info('Goodbye.')
    process.exit(0)
  }

  process.on('SIGINT', () => void handleShutdown('SIGINT'))
  process.on('SIGTERM', () => void handleShutdown('SIGTERM'))

  // -------------------------------------------------------------------------
  // Health-check before entering the poll loop
  // -------------------------------------------------------------------------

  logger.info('Checking scoreboard API health before starting poll loop…')
  const health = await scoreboardClient.getHealth()

  if (health.connected) {
    logger.info('Scoreboard API is up and connected to CRG', {
      version: health.version ?? 'unknown',
    })
  } else {
    logger.warn(
      'Scoreboard API responded but reports CRG is not yet connected — ' +
        'will start polling anyway and wait for the scoreboard to come online',
    )
  }

  // -------------------------------------------------------------------------
  // Start polling loop (runs until stop() / shutdown() is called)
  // -------------------------------------------------------------------------

  logger.info('Entering polling loop', {
    pollIntervalMs: config.pollIntervalMs,
  })

  try {
    await poller.start(boutId)
  } catch (err) {
    logger.error('Polling loop terminated with an error', {
      error: err instanceof Error ? err.message : String(err),
    })
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Top-level error boundary
// ---------------------------------------------------------------------------

main().catch((err: unknown) => {
  // Handles errors thrown during config loading or initial setup — before the
  // graceful shutdown handler is registered.
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(`[ERROR] Fatal startup error: ${message}\n`)
  process.exit(1)
})
