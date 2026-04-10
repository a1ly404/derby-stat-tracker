/**
 * Structured logger for the live-bridge service.
 *
 * Respects the LOG_LEVEL environment variable.
 * Valid levels (ascending severity): debug < info < warn < error
 *
 * Output format:  [LEVEL] HH:MM:SS message {"key":"value"}
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase().trim()
  if (raw in LEVEL_RANK) return raw as LogLevel
  process.stderr.write(
    `[WARN] Unknown LOG_LEVEL "${process.env.LOG_LEVEL}", defaulting to "info"\n`,
  )
  return 'info'
}

function timestamp(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function formatContext(context?: Record<string, unknown>): string {
  if (context === undefined || context === null) return ''
  try {
    const serialised = JSON.stringify(context)
    // Skip empty objects
    return serialised === '{}' ? '' : ` ${serialised}`
  } catch {
    return ' [unserializable context]'
  }
}

function write(
  level: LogLevel,
  minLevel: LogLevel,
  stream: NodeJS.WriteStream,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) return
  const line = `[${level.toUpperCase().padEnd(5)}] ${timestamp()} ${message}${formatContext(context)}\n`
  stream.write(line)
}

function createLogger() {
  // Re-read LOG_LEVEL on every call so it can be changed at runtime in tests.
  const getMinLevel = (): LogLevel => resolveLevel()

  return {
    debug(message: string, context?: Record<string, unknown>): void {
      write('debug', getMinLevel(), process.stdout, message, context)
    },

    info(message: string, context?: Record<string, unknown>): void {
      write('info', getMinLevel(), process.stdout, message, context)
    },

    warn(message: string, context?: Record<string, unknown>): void {
      write('warn', getMinLevel(), process.stderr, message, context)
    },

    error(message: string, context?: Record<string, unknown>): void {
      write('error', getMinLevel(), process.stderr, message, context)
    },
  }
}

export const logger = createLogger()
