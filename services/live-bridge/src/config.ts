import 'dotenv/config';
import type { BridgeConfig } from './types.js';

/**
 * Reads a required environment variable. Throws a clear error if it is absent
 * or blank so the process fails fast with a useful message rather than
 * crashing somewhere deep in the call stack.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Copy .env.example to .env and fill in all required values.`,
    );
  }
  return value.trim();
}

/**
 * Reads an optional integer environment variable, returning `defaultValue`
 * when the variable is absent, blank, or not a valid integer.
 */
function optionalInt(name: string, defaultValue: number, min?: number): number {
  const raw = process.env[name];
  if (!raw || raw.trim() === '') return defaultValue;
  const parsed = parseInt(raw.trim(), 10);
  if (isNaN(parsed)) {
    console.warn(
      `[config] ${name}="${raw}" is not a valid integer — using default ${defaultValue}`,
    );
    return defaultValue;
  }
  if (min !== undefined && parsed < min) {
    console.warn(
      `[config] ${name}=${parsed} is below the minimum allowed value of ${min} — clamping to ${min}`,
    );
    return min;
  }
  return parsed;
}

/**
 * Reads and validates all environment configuration, returning a typed
 * `BridgeConfig` object. Call this once at startup.
 *
 * @throws {Error} if any required variable is missing or invalid.
 */
export function loadConfig(): BridgeConfig {
  const scoreboardApiUrl = requireEnv('SCOREBOARD_API_URL').replace(/\/+$/, '');
  const supabaseUrl = requireEnv('SUPABASE_URL').replace(/\/+$/, '');
  const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_KEY');

  const pollIntervalMs = optionalInt('POLL_INTERVAL_MS', 1000, 200);
  const jamEndDebounceMs = optionalInt('JAM_END_DEBOUNCE_MS', 2000);

  const rawLogLevel = (process.env['LOG_LEVEL'] ?? 'info').toLowerCase().trim();
  const validLogLevels = ['debug', 'info', 'warn', 'error'] as const;
  type LogLevel = (typeof validLogLevels)[number];

  const logLevel: LogLevel = (
    validLogLevels.includes(rawLogLevel as LogLevel) ? rawLogLevel : 'info'
  ) as LogLevel;

  if (!validLogLevels.includes(rawLogLevel as LogLevel)) {
    console.warn(
      `[config] LOG_LEVEL="${rawLogLevel}" is not recognised — defaulting to "info"`,
    );
  }

  return {
    scoreboardApiUrl,
    supabaseUrl,
    supabaseServiceKey,
    pollIntervalMs,
    jamEndDebounceMs,
    logLevel,
  };
}
