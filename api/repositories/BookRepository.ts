import db from '../db/connection.ts';
import type { Book } from '../../shared/types.ts';

export class BookRepository {
  findAll(search?: string, category?: string): Book[] {
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params: string[] = [];

    if (search) {
      sql += ' AND (title LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY title';
    return db.prepare(sql).all(...params) as Book[];
  }

  findById(id: string): Book | undefined {
    return db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
  }

  findByIds(ids: string[]): Book[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return db.prepare(`SELECT * FROM books WHERE id IN (${placeholders})`).all(...ids) as Book[];
  }

  getCategories(): string[] {
    const rows = db.prepare('SELECT DISTINCT category FROM books ORDER BY category').all() as { category: string }[];
    return rows.map(r => r.category);
  }
}

export const bookRepository = new BookRepository();
