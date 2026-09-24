import pg from 'pg';
import {
  BetRequestRecord,
  BetSelectionRecord,
  ActivityLogItem,
  AgentStatus,
  ParsedBetRequest,
} from '../types/index.ts';

const { Pool } = pg;

export class DatabaseService {
  private pool: pg.Pool | null = null;
  private isPostgresAvailable = false;

  // In-memory relational storage fallback for dev/testing when DATABASE_URL is not connected
  private memoryUsers: Array<{ id: string; email: string; name: string; created_at: string }> = [
    {
      id: 'usr-default',
      email: 'user@nicebet.com.lr',
      name: 'NiceBet Member',
      created_at: new Date().toISOString(),
    },
  ];
  private memoryBetRequests: Map<string, BetRequestRecord> = new Map();
  private memoryActivityLogs: ActivityLogItem[] = [];

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString && connectionString.trim().length > 0) {
      try {
        this.pool = new Pool({
          connectionString,
          connectionTimeoutMillis: 3000,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });
      } catch (err) {
        console.warn('[DB] PostgreSQL pool initialization failed, falling back to memory store:', err);
      }
    }
  }

  public async init(): Promise<void> {
    if (this.pool) {
      try {
        const client = await this.pool.connect();
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(64) PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bet_requests (
              id VARCHAR(64) PRIMARY KEY,
              user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
              raw_instructions TEXT NOT NULL,
              stake NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
              currency VARCHAR(8) NOT NULL DEFAULT 'USD',
              status VARCHAR(32) NOT NULL DEFAULT 'READY',
              status_message TEXT,
              total_odds NUMERIC(10, 2),
              potential_return NUMERIC(10, 2),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bet_selections (
              id VARCHAR(64) PRIMARY KEY,
              bet_request_id VARCHAR(64) NOT NULL REFERENCES bet_requests(id) ON DELETE CASCADE,
              event VARCHAR(255) NOT NULL,
              market VARCHAR(255) NOT NULL,
              selection VARCHAR(255) NOT NULL,
              requested_odds NUMERIC(8, 2),
              actual_odds NUMERIC(8, 2),
              status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
              mismatch_reason TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
              id VARCHAR(64) PRIMARY KEY,
              bet_request_id VARCHAR(64) REFERENCES bet_requests(id) ON DELETE CASCADE,
              message TEXT NOT NULL,
              level VARCHAR(16) NOT NULL DEFAULT 'info',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `);
          this.isPostgresAvailable = true;
          console.log('[DB] PostgreSQL connected and schemas verified.');
        } finally {
          client.release();
        }
      } catch (err) {
        console.warn('[DB] Could not connect to PostgreSQL server. Running with in-memory database store.', (err as Error).message);
        this.isPostgresAvailable = false;
      }
    } else {
      console.log('[DB] No DATABASE_URL provided. Operating in-memory repository mode.');
    }
  }

  public async createBetRequest(
    parsed: ParsedBetRequest,
    rawInstructions: string,
    userId = 'usr-default'
  ): Promise<BetRequestRecord> {
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const selections: BetSelectionRecord[] = parsed.bets.map((b, idx) => ({
      id: `sel-${Date.now()}-${idx}`,
      bet_request_id: id,
      event: b.event,
      market: b.market,
      selection: b.selection,
      requested_odds: b.odds,
      status: 'PENDING',
    }));

    const record: BetRequestRecord = {
      id,
      user_id: userId,
      raw_instructions: rawInstructions,
      stake: parsed.stake || 10,
      currency: parsed.currency || 'USD',
      status: 'READY',
      status_message: 'Instructions parsed and ready for browser agent',
      created_at: now,
      updated_at: now,
      selections,
      total_odds: 1,
      potential_return: parsed.stake || 10,
    };

    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO bet_requests (id, user_id, raw_instructions, stake, currency, status, status_message)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [record.id, record.user_id, record.raw_instructions, record.stake, record.currency, record.status, record.status_message]
        );
        for (const sel of selections) {
          await this.pool.query(
            `INSERT INTO bet_selections (id, bet_request_id, event, market, selection, requested_odds, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [sel.id, sel.bet_request_id, sel.event, sel.market, sel.selection, sel.requested_odds || null, sel.status]
          );
        }
      } catch (e) {
        console.error('[DB] Postgres insert error, storing in-memory:', e);
      }
    }

    this.memoryBetRequests.set(id, record);
    await this.addActivityLog(id, `New bet request created with ${selections.length} selection(s)`, 'info');
    return record;
  }

  public async getBetRequest(id: string): Promise<BetRequestRecord | null> {
    if (this.isPostgresAvailable && this.pool) {
      try {
        const reqRes = await this.pool.query(`SELECT * FROM bet_requests WHERE id = $1`, [id]);
        if (reqRes.rows.length > 0) {
          const row = reqRes.rows[0];
          const selRes = await this.pool.query(`SELECT * FROM bet_selections WHERE bet_request_id = $1`, [id]);
          return {
            id: row.id,
            user_id: row.user_id,
            raw_instructions: row.raw_instructions,
            stake: parseFloat(row.stake),
            currency: row.currency,
            status: row.status as AgentStatus,
            status_message: row.status_message,
            created_at: row.created_at?.toISOString?.() || row.created_at,
            updated_at: row.updated_at?.toISOString?.() || row.updated_at,
            total_odds: row.total_odds ? parseFloat(row.total_odds) : undefined,
            potential_return: row.potential_return ? parseFloat(row.potential_return) : undefined,
            selections: selRes.rows.map((r) => ({
              id: r.id,
              bet_request_id: r.bet_request_id,
              event: r.event,
              market: r.market,
              selection: r.selection,
              requested_odds: r.requested_odds ? parseFloat(r.requested_odds) : undefined,
              actual_odds: r.actual_odds ? parseFloat(r.actual_odds) : undefined,
              status: r.status,
              mismatch_reason: r.mismatch_reason,
            })),
          };
        }
      } catch (e) {
        console.error('[DB] Postgres read error, falling back to memory:', e);
      }
    }

    const item = this.memoryBetRequests.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async getAllBetRequests(): Promise<BetRequestRecord[]> {
    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(`SELECT id FROM bet_requests ORDER BY created_at DESC LIMIT 50`);
        const records: BetRequestRecord[] = [];
        for (const row of res.rows) {
          const item = await this.getBetRequest(row.id);
          if (item) records.push(item);
        }
        return records;
      } catch (e) {
        console.error('[DB] Postgres getAll error:', e);
      }
    }
    return Array.from(this.memoryBetRequests.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async updateBetRequestStatus(
    id: string,
    status: AgentStatus,
    statusMessage?: string,
    totalOdds?: number,
    potentialReturn?: number
  ): Promise<void> {
    const record = this.memoryBetRequests.get(id);
    if (record) {
      record.status = status;
      if (statusMessage !== undefined) record.status_message = statusMessage;
      if (totalOdds !== undefined) record.total_odds = totalOdds;
      if (potentialReturn !== undefined) record.potential_return = potentialReturn;
      record.updated_at = new Date().toISOString();
    }

    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query(
          `UPDATE bet_requests
           SET status = $1, status_message = $2, total_odds = $3, potential_return = $4, updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [status, statusMessage || null, totalOdds || null, potentialReturn || null, id]
        );
      } catch (e) {
        console.error('[DB] Postgres updateBetRequestStatus error:', e);
      }
    }
  }

  public async updateSelectionStatus(
    selectionId: string,
    status: BetSelectionRecord['status'],
    actualOdds?: number,
    mismatchReason?: string
  ): Promise<void> {
    for (const req of this.memoryBetRequests.values()) {
      const sel = req.selections.find((s) => s.id === selectionId);
      if (sel) {
        sel.status = status;
        if (actualOdds !== undefined) sel.actual_odds = actualOdds;
        if (mismatchReason !== undefined) sel.mismatch_reason = mismatchReason;
        break;
      }
    }

    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query(
          `UPDATE bet_selections
           SET status = $1, actual_odds = $2, mismatch_reason = $3
           WHERE id = $4`,
          [status, actualOdds || null, mismatchReason || null, selectionId]
        );
      } catch (e) {
        console.error('[DB] Postgres updateSelectionStatus error:', e);
      }
    }
  }

  public async addActivityLog(
    betRequestId: string | undefined,
    message: string,
    level: ActivityLogItem['level'] = 'info'
  ): Promise<ActivityLogItem> {
    const item: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bet_request_id: betRequestId,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      message,
      level,
    };

    this.memoryActivityLogs.unshift(item);
    if (this.memoryActivityLogs.length > 500) {
      this.memoryActivityLogs.pop();
    }

    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO activity_logs (id, bet_request_id, message, level)
           VALUES ($1, $2, $3, $4)`,
          [item.id, item.bet_request_id || null, item.message, item.level]
        );
      } catch (e) {
        // Log failure non-fatal
      }
    }

    return item;
  }

  public async getActivityLogs(betRequestId?: string): Promise<ActivityLogItem[]> {
    if (this.isPostgresAvailable && this.pool) {
      try {
        const query = betRequestId
          ? `SELECT id, bet_request_id, message, level, to_char(created_at, 'HH24:MI:SS') as timestamp
             FROM activity_logs WHERE bet_request_id = $1 ORDER BY created_at DESC LIMIT 100`
          : `SELECT id, bet_request_id, message, level, to_char(created_at, 'HH24:MI:SS') as timestamp
             FROM activity_logs ORDER BY created_at DESC LIMIT 100`;
        const res = await this.pool.query(query, betRequestId ? [betRequestId] : []);
        return res.rows;
      } catch (e) {
        console.error('[DB] Postgres getActivityLogs error:', e);
      }
    }

    if (betRequestId) {
      return this.memoryActivityLogs.filter((l) => l.bet_request_id === betRequestId);
    }
    return this.memoryActivityLogs;
  }
}

export const db = new DatabaseService();
