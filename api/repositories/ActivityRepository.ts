import db from '../db/connection.ts';
import type { Activity, ActivityStats, Comment } from '../../shared/types.ts';

interface ActivityRow {
  id: string;
  title: string;
  book_ids: string;
  start_date: string;
  end_date: string;
  target_type: string;
  target_value: number;
  display_text: string;
  reward_text: string;
  allow_repeat: number;
  status: string;
  created_at: string;
}

interface CommentRow {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  content: string;
  sentiment: string;
  likes: number;
  created_at: string;
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
      id: string;
      activity_id: string;
      participant_count: number;
      valid_urge_count: number;
      return_reader_count: number;
      positive_rate: number;
    } | undefined;

    if (!statsRow) return undefined;

    const commentRows = db.prepare(`
      SELECT * FROM comments
      WHERE activity_id = ?
      ORDER BY likes DESC
      LIMIT 10
    `).all(activityId) as CommentRow[];

    const comments = commentRows.map(this.mapRowToComment);

    const allCommentRows = db.prepare(
      'SELECT sentiment FROM comments WHERE activity_id = ?'
    ).all(activityId) as { sentiment: string }[];

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const row of allCommentRows) {
      if (row.sentiment === 'positive') sentimentCounts.positive++;
      else if (row.sentiment === 'neutral') sentimentCounts.neutral++;
      else if (row.sentiment === 'negative') sentimentCounts.negative++;
    }

    const totalComments = allCommentRows.length;
    const computedPositiveRate = totalComments > 0
      ? sentimentCounts.positive / totalComments
      : statsRow.positive_rate;

    const trendData = this.generateTrendData(activityId, statsRow.participant_count);
    const topKeywords = this.extractKeywords(activityId);

    return {
      activityId: statsRow.activity_id,
      participantCount: statsRow.participant_count,
      validUrgeCount: statsRow.valid_urge_count,
      returnReaderCount: statsRow.return_reader_count,
      positiveRate: computedPositiveRate,
      trendData,
      topKeywords,
      hotComments: comments,
      sentimentCounts,
    };
  }

  private generateTrendData(activityId: string, participantCount: number): { date: string; count: number }[] {
    const activity = this.findById(activityId);
    if (!activity) return [];

    const start = new Date(activity.startDate);
    if (isNaN(start.getTime())) return [];

    const end = activity.status === 'ended' ? new Date(activity.endDate) : new Date();
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const numDays = Math.min(totalDays + 1, 15);

    if (numDays <= 0) return [];

    const seed = activityId.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0);
    const avgCount = Math.max(10, Math.floor(participantCount / Math.max(numDays, 1)));

    const result: { date: string; count: number }[] = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const variation = ((Math.abs(seed) * (i + 1) * 7 + i * 13) % 60) - 30;
      const count = Math.max(5, avgCount + variation);
      result.push({
        date: d.toISOString().split('T')[0],
        count,
      });
    }

    return result;
  }

  private extractKeywords(activityId: string): { word: string; count: number }[] {
    const allCommentRows = db.prepare(
      'SELECT content FROM comments WHERE activity_id = ?'
    ).all(activityId) as { content: string }[];

    const keywords = ['催更', '加更', '好看', '期待', '更新', '番外', '伏笔', '剧情', '作者', '支持', '精彩', '反转', '质量', '身体', '喜欢'];
    return keywords
      .map(word => {
        const count = allCommentRows.filter(c => c.content.includes(word)).length;
        return { word, count: count * 10 };
      })
      .filter(k => k.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private mapRowToActivity(row: ActivityRow): Activity {
    return {
      id: row.id,
      title: row.title,
      bookIds: JSON.parse(row.book_ids),
      startDate: row.start_date,
      endDate: row.end_date,
      targetType: row.target_type as Activity['targetType'],
      targetValue: row.target_value,
      displayText: row.display_text,
      rewardText: row.reward_text,
      allowRepeat: !!row.allow_repeat,
      status: row.status as Activity['status'],
      createdAt: row.created_at,
    };
  }

  private mapRowToComment(row: CommentRow): Comment {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      content: row.content,
      sentiment: row.sentiment as Comment['sentiment'],
      likes: row.likes,
      createdAt: row.created_at,
    };
  }
}

export const activityRepository = new ActivityRepository();
