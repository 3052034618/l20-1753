import db from '../db/connection.ts';
import type { CollaborationRequest } from '../../shared/types.ts';

export class CollaborationRepository {
  findAll(status?: CollaborationRequest['status']): CollaborationRequest[] {
    let sql = 'SELECT * FROM collaboration_requests';
    const params: string[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params) as CollaborationRequest[];
  }

  findById(id: string): CollaborationRequest | undefined {
    return db.prepare('SELECT * FROM collaboration_requests WHERE id = ?').get(id) as CollaborationRequest | undefined;
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
}

export const collaborationRepository = new CollaborationRepository();
