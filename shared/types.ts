export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: string;
  status: 'ongoing' | 'completed';
}

export interface Activity {
  id: string;
  title: string;
  bookIds: string[];
  startDate: string;
  endDate: string;
  targetType: 'comment_streak' | 'want_to_read' | 'likes';
  targetValue: number;
  displayText: string;
  rewardText: string;
  allowRepeat: boolean;
  status: 'draft' | 'active' | 'ended';
  createdAt: string;
}

export interface ActivityStats {
  activityId: string;
  participantCount: number;
  validUrgeCount: number;
  returnReaderCount: number;
  positiveRate: number;
  trendData: { date: string; count: number }[];
  topKeywords: { word: string; count: number }[];
  hotComments: Comment[];
  sentimentCounts: { positive: number; neutral: number; negative: number };
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  likes: number;
  createdAt: string;
}

export interface CollaborationRequest {
  id: string;
  activityId: string;
  bookId: string;
  authorId: string;
  authorName: string;
  readerExpectations: string;
  status: 'pending' | 'replied';
  replyType?: 'can_update' | 'progress_only' | 'not_participate';
  replyNote?: string;
  createdAt: string;
  repliedAt?: string;
}

export const TARGET_TYPE_LABELS: Record<Activity['targetType'], string> = {
  comment_streak: '连续评论催更',
  want_to_read: '达到想看数',
  likes: '点赞数达标',
};

export const ACTIVITY_STATUS_LABELS: Record<Activity['status'], string> = {
  draft: '草稿',
  active: '进行中',
  ended: '已结束',
};

export const REPLY_TYPE_LABELS: Record<NonNullable<CollaborationRequest['replyType']>, string> = {
  can_update: '可加更',
  progress_only: '只能发进度说明',
  not_participate: '不参与活动',
};
