import db from '../db/connection.ts';
import type { CollaborationRequest } from '../../shared/types.ts';

interface CollaborationRow {
  id: string;
  activity_id: string;
  book_id: string;
  author_id: string;
  author_name: string;
  reader_expectations: string;
  status: string;
  reply_type: string | null;
  reply_note: string | null;
  created_at: string;
  replied_at: string | null;
}

export class CollaborationRepository {
  findAll(status?: CollaborationRequest['status']): CollaborationRequest[] {
    let sql = 'SELECT * FROM collaboration_requests';
    const params: string[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params) as CollaborationRow[];
    return rows.map(this.mapRowToCollaboration);
  }

  findById(id: string): CollaborationRequest | undefined {
    const row = db.prepare('SELECT * FROM collaboration_requests WHERE id = ?').get(id) as CollaborationRow | undefined;
    return row ? this.mapRowToCollaboration(row) : undefined;
  }

  findByActivityId(activityId: string): CollaborationRequest[] {
    const rows = db.prepare('SELECT * FROM collaboration_requests WHERE activity_id = ? ORDER BY created_at DESC').all(activityId) as CollaborationRow[];
    return rows.map(this.mapRowToCollaboration);
  }

  create(request: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt'>): CollaborationRequest {
    const id = `col_${Date.now()}`;
    const status: CollaborationRequest['status'] = 'pending';
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO collaboration_requests (id, activity_id, book_id, author_id, author_name, reader_expectations, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      request.activityId,
      request.bookId,
      request.authorId,
      request.authorName,
      request.readerExpectations,
      status,
      createdAt
    );

    return { ...request, id, status, createdAt };
  }

  reply(id: string, replyType: CollaborationRequest['replyType'], replyNote?: string): void {
    db.prepare(`
      UPDATE collaboration_requests
      SET status = 'replied', reply_type = ?, reply_note = ?, replied_at = ?
      WHERE id = ?
    `).run(replyType, replyNote || null, new Date().toISOString(), id);
  }

  update(id: string, updates: Partial<Omit<CollaborationRequest, 'id'>>): void {
    const setClauses: string[] = [];
    const params: (string | number | boolean | null)[] = [];

    if (updates.readerExpectations !== undefined) {
      setClauses.push('reader_expectations = ?');
      params.push(updates.readerExpectations);
    }
    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      params.push(updates.status);
    }
    if (updates.replyType !== undefined) {
      setClauses.push('reply_type = ?');
      params.push(updates.replyType);
    }
    if (updates.replyNote !== undefined) {
      setClauses.push('reply_note = ?');
      params.push(updates.replyNote ?? null);
    }

    if (setClauses.length === 0) return;

    params.push(id);
    db.prepare(`UPDATE collaboration_requests SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  }

  private mapRowToCollaboration(row: CollaborationRow): CollaborationRequest {
    return {
      id: row.id,
      activityId: row.activity_id,
      bookId: row.book_id,
      authorId: row.author_id,
      authorName: row.author_name,
      readerExpectations: row.reader_expectations,
      status: row.status as CollaborationRequest['status'],
      replyType: (row.reply_type as CollaborationRequest['replyType']) || undefined,
      replyNote: row.reply_note || undefined,
      createdAt: row.created_at,
      repliedAt: row.replied_at || undefined,
    };
  }
}

export const collaborationRepository = new CollaborationRepository();
