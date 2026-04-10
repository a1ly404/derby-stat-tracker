import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger.js'
import type { LiveGameRow, LiveJamSnapshotRow, LiveState } from './types.js'

// ---------------------------------------------------------------------------
// SupabaseWriter
//
// Uses an untyped SupabaseClient (no generated Database generic) and applies
// explicit TypeScript casts on query results. This keeps the file
// self-contained — no Supabase CLI or type-generation step required — while
// still giving us full type safety on the values we read and write.
// ---------------------------------------------------------------------------

export class SupabaseWriter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly client: SupabaseClient<any>

  constructor(supabaseUrl: string, serviceKey: string) {
    if (!supabaseUrl || !serviceKey) {
      throw new Error('SupabaseWriter requires both supabaseUrl and serviceKey')
    }
    this.client = createClient(supabaseUrl, serviceKey, {
      auth: {
        // Service-role key — disable session persistence, we don't need auth.
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // -------------------------------------------------------------------------
  // ensureLiveGame
  // -------------------------------------------------------------------------

  /**
   * Finds an existing *active* `live_games` row for the given
   * `scoreboardSource`, or inserts a new one if none exists.
   *
   * Matching on `scoreboard_source` means that restarting the bridge mid-bout
   * will resume the same live-game record rather than opening a duplicate.
   *
   * @returns The UUID of the active live_game row.
   */
  async ensureLiveGame(
    boutId: string | null,
    scoreboardSource: string,
  ): Promise<string> {
    logger.debug('ensureLiveGame called', { boutId, scoreboardSource })

    // 1. Try to find an existing active game for this source.
    const { data: existing, error: selectError } = await this.client
      .from('live_games')
      .select('id')
      .eq('scoreboard_source', scoreboardSource)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: Pick<LiveGameRow, 'id'> | null; error: { message: string; code: string } | null }

    if (selectError) {
      logger.error('Failed to query live_games', {
        message: selectError.message,
        code: selectError.code,
      })
      throw new Error(`Supabase select live_games failed: ${selectError.message}`)
    }

    if (existing) {
      logger.info('Resuming existing live_game', { liveGameId: existing.id })
      return existing.id
    }

    // 2. No active row found — insert a new one.
    const insert: Omit<LiveGameRow, 'id' | 'started_at'> = {
      scoreboard_source: scoreboardSource,
      bout_id: boutId,
      ended_at: null,
      status: 'active',
    }

    const { data: inserted, error: insertError } = await this.client
      .from('live_games')
      .insert(insert)
      .select('id')
      .single() as { data: Pick<LiveGameRow, 'id'> | null; error: { message: string; code: string } | null }

    if (insertError || !inserted) {
      logger.error('Failed to insert live_games row', {
        message: insertError?.message,
        code: insertError?.code,
      })
      throw new Error(
        `Supabase insert live_games failed: ${insertError?.message ?? 'no data returned'}`,
      )
    }

    logger.info('Created new live_game', { liveGameId: inserted.id, boutId })
    return inserted.id
  }

  // -------------------------------------------------------------------------
  // writeJamSnapshot
  // -------------------------------------------------------------------------

  /**
   * Upserts a `live_jam_snapshots` row for the given live game and live state.
   *
   * The unique constraint `(live_game_id, period, jam)` is used as the upsert
   * key — re-writing the same jam (e.g. after a bridge restart) simply
   * overwrites the existing row with fresher data.
   *
   * Does nothing if `period` or `jam` is null in the live state (scoreboard
   * not yet tracking a jam).
   */
  async writeJamSnapshot(liveGameId: string, liveState: LiveState): Promise<void> {
    const { period, jam } = liveState

    if (period == null || jam == null) {
      logger.debug('writeJamSnapshot skipped — period/jam not yet available', {
        liveGameId,
        period,
        jam,
      })
      return
    }

    const row: Omit<LiveJamSnapshotRow, 'id' | 'captured_at'> = {
      live_game_id: liveGameId,
      period,
      jam,
      team1_score: liveState.team1?.score ?? null,
      team2_score: liveState.team2?.score ?? null,
      team1_jam_score: liveState.team1?.jam_score ?? null,
      team2_jam_score: liveState.team2?.jam_score ?? null,
      team1_jammer: liveState.team1?.jammer ?? null,
      team2_jammer: liveState.team2?.jammer ?? null,
      team1_lead: liveState.team1?.lead ?? null,
      team2_lead: liveState.team2?.lead ?? null,
      raw_state: liveState,
    }

    const { error } = await this.client
      .from('live_jam_snapshots')
      .upsert(row, {
        onConflict: 'live_game_id,period,jam',
        ignoreDuplicates: false, // always overwrite with latest state
      }) as { error: { message: string; code: string } | null }

    if (error) {
      logger.error('Failed to upsert live_jam_snapshots', {
        liveGameId,
        period,
        jam,
        message: error.message,
        code: error.code,
      })
      throw new Error(`Supabase upsert live_jam_snapshots failed: ${error.message}`)
    }

    logger.debug('Jam snapshot written', { liveGameId, period, jam })
  }

  // -------------------------------------------------------------------------
  // completeLiveGame
  // -------------------------------------------------------------------------

  /**
   * Marks a `live_games` row as completed by setting `ended_at` and flipping
   * `status` to `'completed'`. Safe to call multiple times — subsequent calls
   * on an already-completed game are a no-op from the DB's perspective.
   */
  async completeLiveGame(liveGameId: string): Promise<void> {
    logger.info('Marking live_game as completed', { liveGameId })

    const update: Pick<LiveGameRow, 'ended_at' | 'status'> = {
      ended_at: new Date().toISOString(),
      status: 'completed',
    }

    const { error } = await this.client
      .from('live_games')
      .update(update)
      .eq('id', liveGameId) as { error: { message: string; code: string } | null }

    if (error) {
      logger.error('Failed to complete live_game', {
        liveGameId,
        message: error.message,
        code: error.code,
      })
      throw new Error(`Supabase update live_games (complete) failed: ${error.message}`)
    }

    logger.info('live_game marked completed', { liveGameId })
  }
}
