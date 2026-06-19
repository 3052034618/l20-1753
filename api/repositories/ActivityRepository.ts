import db from '../db/connection.ts';
import type { Activity, ActivityStats, Comment } from '../../shared/types.ts';

interface ActivityRow extends Omit<Activity, 'bookIds'> {
  book_ids: string;
}

export class ActivityRepository {
  findAll(status?: Activity['status']): Activity[] {
    let sql = 'SELECT * FROM activities';
    const params: string[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params) as ActivityRow[];
    return rows.map(this.mapRowToActivity);
  }

  findById(id: string): Activity | undefined {
    const row = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    return row ? this.mapRowToActivity(row) : undefined;
  }

  create(activity: Omit<Activity, 'id' | 'createdAt'>): Activity {
    const id = `act_${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO activities (id, title, book_ids, start_date, end_date, target_type, target_value, display_text, reward_text, allow_repeat, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      activity.title,
      JSON.stringify(activity.bookIds),
      activity.startDate,
      activity.endDate,
      activity.targetType,
      activity.targetValue,
      activity.displayText,
      activity.rewardText,
      activity.allowRepeat ? 1 : 0,
      activity.status,
      createdAt
    );

    db.prepare(`
      INSERT INTO activity_stats (id, activity_id, participant_count, valid_urge_count, return_reader_count, positive_rate)
      VALUES (?, ?, 0, 0, 0, 0)
    `).run(`stats_${id}`, id);

    return { ...activity, id, createdAt };
  }

  update(id: string, updates: Partial<Omit<Activity, 'id' | 'createdAt'>>): void {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }
    if (updates.bookIds !== undefined) {
      fields.push('book_ids = ?');
      params.push(JSON.stringify(updates.bookIds));
    }
    if (updates.startDate !== undefined) {
      fields.push('start_date = ?');
      params.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      fields.push('end_date = ?');
      params.push(updates.endDate);
    }
    if (updates.targetType !== undefined) {
      fields.push('target_type = ?');
      params.push(updates.targetType);
    }
    if (updates.targetValue !== undefined) {
      fields.push('target_value = ?');
      params.push(updates.targetValue);
    }
    if (updates.displayText !== undefined) {
      fields.push('display_text = ?');
      params.push(updates.displayText);
    }
    if (updates.rewardText !== undefined) {
      fields.push('reward_text = ?');
      params.push(updates.rewardText);
    }
    if (updates.allowRepeat !== undefined) {
      fields.push('allow_repeat = ?');
      params.push(updates.allowRepeat ? 1 : 0);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }

    if (fields.length > 0) {
      params.push(id);
      db.prepare(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }
  }

  getStats(activityId: string): ActivityStats | undefined {
    const statsRow = db.prepare('SELECT * FROM activity_stats WHERE activity_id = ?').get(activityId) as {
      activity_id: string;
      participant_count: number;
      valid_urge_count: number;
      return_reader_count: number;
      positive_rate: number;
    } | undefined;

    if (!statsRow) return undefined;

    const comments = db.prepare(`
      SELECT * FROM comments 
      WHERE activity_id = ? 
      ORDER BY likes DESC 
      LIMIT 10
    `).all(activityId) as Comment[];

    const trendData = this.generateTrendData(activityId);
    const topKeywords = this.extractKeywords(comments);

    return {
      activityId: statsRow.activity_id,
      participantCount: statsRow.participant_count,
      validUrgeCount: statsRow.valid_urge_count,
      returnReaderCount: statsRow.return_reader_count,
      positiveRate: statsRow.positive_rate,
      trendData,
      topKeywords,
      hotComments: comments,
    };
  }

  private generateTrendData(activityId: string): { date: string; count: number }[] {
    const activity = this.findById(activityId);
    if (!activity) return [];

    const start = new Date(activity.startDate);
    const end = new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const result: { date: string; count: number }[] = [];

    for (let i = 0; i <= Math.min(days, 14); i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      result.push({
        date: d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 500) + 100,
      });
    }

    return result;
  }

  private extractKeywords(comments: Comment[]): { word: string; count: number }[] {
    const keywords = ['催更', '加更', '好看', '期待', '更新', '番外', '伏笔', '剧情', '作者', '支持', '精彩', '反转', '质量', '身体', '喜欢'];
    return keywords
      .map(word => ({ word, count: comments.filter(c => c.content.includes(word)).length * 10 + Math.floor(Math.random() * 50) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private mapRowToActivity(row: ActivityRow): Activity {
    return {
      id: row.id,
      title: row.title,
      bookIds: JSON.parse(row.book_ids),
      startDate: row.startDate,
      endDate: row.endDate,
      targetType: row.targetType,
      targetValue: row.targetValue,
      displayText: row.displayText,
      rewardText: row.rewardText,
      allowRepeat: !!row.allowRepeat,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}

export const activityRepository = new ActivityRepository();
