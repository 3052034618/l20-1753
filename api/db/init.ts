import db from './connection.ts';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ongoing', 'completed'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      book_ids TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('comment_streak', 'want_to_read', 'likes')),
      target_value INTEGER NOT NULL,
      display_text TEXT NOT NULL,
      reward_text TEXT NOT NULL,
      allow_repeat INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'ended')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_stats (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      participant_count INTEGER NOT NULL DEFAULT 0,
      valid_urge_count INTEGER NOT NULL DEFAULT 0,
      return_reader_count INTEGER NOT NULL DEFAULT 0,
      positive_rate REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      sentiment TEXT NOT NULL CHECK(sentiment IN ('positive', 'neutral', 'negative')),
      likes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaboration_requests (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      reader_expectations TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'replied')),
      reply_type TEXT CHECK(reply_type IN ('can_update', 'progress_only', 'not_participate')),
      reply_note TEXT,
      created_at TEXT NOT NULL,
      replied_at TEXT,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL
    );
  `);
}

export function seedMockData() {
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number };
  if (bookCount.count > 0) return;

  const books = [
    { id: 'b1', title: '长夜余火', author: '爱潜水的乌贼', cover: '📚', category: '玄幻', status: 'ongoing' as const },
    { id: 'b2', title: '诡秘之主', author: '爱潜水的乌贼', cover: '📖', category: '玄幻', status: 'completed' as const },
    { id: 'b3', title: '道诡异仙', author: '狐尾的笔', cover: '📕', category: '仙侠', status: 'ongoing' as const },
    { id: 'b4', title: '深空彼岸', author: '辰东', cover: '📗', category: '都市', status: 'ongoing' as const },
    { id: 'b5', title: '斗破苍穹', author: '天蚕土豆', cover: '📘', category: '玄幻', status: 'completed' as const },
    { id: 'b6', title: '全职高手', author: '蝴蝶蓝', cover: '📙', category: '游戏', status: 'completed' as const },
    { id: 'b7', title: '轮回乐园', author: '那一只蚊子', cover: '📓', category: '科幻', status: 'ongoing' as const },
    { id: 'b8', title: '我的师兄实在太稳健了', author: '言归正传', cover: '📔', category: '仙侠', status: 'completed' as const },
    { id: 'b9', title: '万相之王', author: '天蚕土豆', cover: '📒', category: '玄幻', status: 'ongoing' as const },
    { id: 'b10', title: '一念永恒', author: '耳根', cover: '📃', category: '仙侠', status: 'completed' as const },
  ];

  const insertBook = db.prepare('INSERT INTO books (id, title, author, cover, category, status) VALUES (?, ?, ?, ?, ?, ?)');
  for (const book of books) {
    insertBook.run(book.id, book.title, book.author, book.cover, book.category, book.status);
  }

  const authors = [
    { id: 'a1', name: '爱潜水的乌贼', avatar: '✒️' },
    { id: 'a2', name: '狐尾的笔', avatar: '🖋️' },
    { id: 'a3', name: '辰东', avatar: '🖊️' },
  ];

  const insertAuthor = db.prepare('INSERT INTO authors (id, name, avatar) VALUES (?, ?, ?)');
  for (const author of authors) {
    insertAuthor.run(author.id, author.name, author.avatar);
  }

  const now = new Date();
  const activities = [
    {
      id: 'act1',
      title: '《长夜余火》三日催更大挑战',
      bookIds: ['b1'],
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetType: 'comment_streak' as const,
      targetValue: 3,
      displayText: '连续三天评论催更，解锁作者番外！',
      rewardText: '参与即可获得阅读券，完成挑战解锁独家番外章节',
      allowRepeat: false,
      status: 'active' as const,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act2',
      title: '《道诡异仙》万想看加更计划',
      bookIds: ['b3'],
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetType: 'want_to_read' as const,
      targetValue: 10000,
      displayText: '想看数破万，作者加更番外！',
      rewardText: '达成目标后全平台用户可免费阅读番外',
      allowRepeat: true,
      status: 'active' as const,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act3',
      title: '《深空彼岸》点赞催更活动',
      bookIds: ['b4'],
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetType: 'likes' as const,
      targetValue: 50000,
      displayText: '点赞催更，让作者看到你的热情！',
      rewardText: '参与用户可获得专属徽章',
      allowRepeat: true,
      status: 'ended' as const,
      createdAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const insertActivity = db.prepare(
    'INSERT INTO activities (id, title, book_ids, start_date, end_date, target_type, target_value, display_text, reward_text, allow_repeat, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const activity of activities) {
    insertActivity.run(
      activity.id,
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
      activity.createdAt
    );

    const insertStats = db.prepare(
      'INSERT INTO activity_stats (id, activity_id, participant_count, valid_urge_count, return_reader_count, positive_rate) VALUES (?, ?, ?, ?, ?, ?)'
    );

    if (activity.id === 'act1') {
      insertStats.run('s1', 'act1', 2345, 8976, 1234, 0.78);
    } else if (activity.id === 'act2') {
      insertStats.run('s2', 'act2', 5678, 15432, 3456, 0.85);
    } else {
      insertStats.run('s3', 'act3', 8901, 67890, 5678, 0.62);
    }
  }

  const comments = [
    { id: 'c1', activityId: 'act1', userId: 'u1', userName: '书虫小明', content: '太好看了！求作者大大更新！', sentiment: 'positive' as const, likes: 156, createdAt: '2026-06-18T10:30:00Z' },
    { id: 'c2', activityId: 'act1', userId: 'u2', userName: '夜读人', content: '每天都在等更新，已经第三遍刷前面的剧情了', sentiment: 'positive' as const, likes: 234, createdAt: '2026-06-18T14:20:00Z' },
    { id: 'c3', activityId: 'act1', userId: 'u3', userName: '追更狂魔', content: '更新太慢了，能不能快点', sentiment: 'negative' as const, likes: 45, createdAt: '2026-06-18T16:45:00Z' },
    { id: 'c4', activityId: 'act1', userId: 'u4', userName: '佛系读者', content: '质量最重要，不催更，慢慢写', sentiment: 'neutral' as const, likes: 89, createdAt: '2026-06-18T20:15:00Z' },
    { id: 'c5', activityId: 'act1', userId: 'u5', userName: '老粉一枚', content: '从《诡秘之主》追到现在，乌贼大大加油！', sentiment: 'positive' as const, likes: 312, createdAt: '2026-06-19T09:00:00Z' },
    { id: 'c6', activityId: 'act1', userId: 'u6', userName: '书友001', content: '上次的伏笔什么时候回收？好期待', sentiment: 'positive' as const, likes: 178, createdAt: '2026-06-19T11:30:00Z' },
    { id: 'c7', activityId: 'act1', userId: 'u7', userName: '等更人', content: '建议作者先把身体养好，更新慢没关系', sentiment: 'positive' as const, likes: 267, createdAt: '2026-06-19T15:45:00Z' },
    { id: 'c8', activityId: 'act1', userId: 'u8', userName: '新人读者', content: '刚入坑，太精彩了！', sentiment: 'positive' as const, likes: 123, createdAt: '2026-06-19T18:20:00Z' },
    { id: 'c9', activityId: 'act2', userId: 'u9', userName: '仙侠迷', content: '道诡异仙YYDS！想看更多李火旺的故事', sentiment: 'positive' as const, likes: 445, createdAt: '2026-06-17T08:00:00Z' },
    { id: 'c10', activityId: 'act2', userId: 'u10', userName: '脑洞大开', content: '这个剧情反转太绝了，求加更！', sentiment: 'positive' as const, likes: 389, createdAt: '2026-06-17T12:30:00Z' },
    { id: 'c11', activityId: 'act2', userId: 'u11', userName: '读者A', content: '想看番外！想看小师妹的故事', sentiment: 'positive' as const, likes: 512, createdAt: '2026-06-17T16:00:00Z' },
    { id: 'c12', activityId: 'act2', userId: 'u12', userName: '催更小能手', content: '已经分享给群友了，大家一起来点想看！', sentiment: 'positive' as const, likes: 298, createdAt: '2026-06-18T10:00:00Z' },
  ];

  const insertComment = db.prepare(
    'INSERT INTO comments (id, activity_id, user_id, user_name, content, sentiment, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const comment of comments) {
    insertComment.run(
      comment.id,
      comment.activityId,
      comment.userId,
      comment.userName,
      comment.content,
      comment.sentiment,
      comment.likes,
      comment.createdAt
    );
  }

  const collaborations = [
    {
      id: 'col1',
      activityId: 'act1',
      bookId: 'b1',
      authorId: 'a1',
      authorName: '爱潜水的乌贼',
      readerExpectations: '读者们非常期待《长夜余火》的更新，很多人表示在反复刷前面的章节等待新内容。大家特别关心之前埋下的伏笔何时回收，同时也表达了对您身体健康的关心，希望您能在保证质量的前提下更新。目前已有2345人参与催更活动，留言中正面评价占比78%。',
      status: 'pending' as const,
      createdAt: '2026-06-19T09:00:00Z',
    },
    {
      id: 'col2',
      activityId: 'act2',
      bookId: 'b3',
      authorId: 'a2',
      authorName: '狐尾的笔',
      readerExpectations: '《道诡异仙》的读者热情高涨，想看数即将突破一万大关。大家纷纷表示想看李火旺的番外故事，尤其是小师妹相关的剧情。读者们很认可您的剧情设计，期待能看到更多精彩的反转。目前正面评价占比85%，活动效果非常好。',
      status: 'replied' as const,
      replyType: 'can_update' as const,
      replyNote: '感谢读者们的支持！我会努力创作，争取本周加更一章番外。',
      createdAt: '2026-06-18T14:00:00Z',
      repliedAt: '2026-06-18T18:30:00Z',
    },
    {
      id: 'col3',
      activityId: 'act3',
      bookId: 'b4',
      authorId: 'a3',
      authorName: '辰东',
      readerExpectations: '《深空彼岸》的点赞催更活动已经结束，共获得67890次点赞。读者们的反馈比较分化，一部分读者希望加快更新节奏，另一部分读者表示理解创作需要时间。整体正面评价占比62%，建议在合适的时候与读者沟通更新计划。',
      status: 'replied' as const,
      replyType: 'progress_only' as const,
      replyNote: '感谢大家的支持，近期身体状况欠佳，我会发布一篇进度说明和后续更新计划。',
      createdAt: '2026-06-15T10:00:00Z',
      repliedAt: '2026-06-16T09:00:00Z',
    },
  ];

  const insertCollab = db.prepare(
    'INSERT INTO collaboration_requests (id, activity_id, book_id, author_id, author_name, reader_expectations, status, reply_type, reply_note, created_at, replied_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const collab of collaborations) {
    insertCollab.run(
      collab.id,
      collab.activityId,
      collab.bookId,
      collab.authorId,
      collab.authorName,
      collab.readerExpectations,
      collab.status,
      collab.replyType || null,
      collab.replyNote || null,
      collab.createdAt,
      collab.repliedAt || null
    );
  }
}
