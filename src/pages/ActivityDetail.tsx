import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.ts';
import {
  ACTIVITY_STATUS_LABELS,
  TARGET_TYPE_LABELS,
  REPLY_TYPE_LABELS,
} from '../../shared/types.ts';
import type { Comment, CollaborationRequest } from '../../shared/types.ts';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Heart,
  ArrowLeft,
  Play,
  Pause,
  Calendar,
  Target,
  Send,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Clock,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activities,
    activityStats,
    collaborations,
    loading,
    fetchActivities,
    fetchActivityStats,
    fetchCollaborations,
    createCollaboration,
    updateActivity,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview');

  useEffect(() => {
    fetchActivities();
    fetchCollaborations();
    if (id) {
      fetchActivityStats(id);
    }
  }, [fetchActivities, fetchActivityStats, fetchCollaborations, id]);

  const activity = activities.find((a) => a.id === id);
  const stats = id ? activityStats[id] : undefined;
  const activityCollabs = collaborations.filter((c) => c.activityId === id);

  if (!activity) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-400">加载中...</p>
        </div>
      </div>
    );
  }

  const getStatusClass = (status: typeof activity.status) => {
    switch (status) {
      case 'active':
        return 'tag-active';
      case 'draft':
        return 'tag-pending';
      case 'ended':
        return 'tag-ended';
    }
  };

  const getSentimentClass = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return 'tag-positive';
      case 'negative':
        return 'tag-negative';
      case 'neutral':
        return 'tag-neutral';
    }
  };

  const getSentimentLabel = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return '正向';
      case 'negative':
        return '负向';
      case 'neutral':
        return '中性';
    }
  };

  const getSentimentIcon = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-3 h-3 mr-1" />;
      case 'negative':
        return <ThumbsDown className="w-3 h-3 mr-1" />;
      case 'neutral':
        return <HelpCircle className="w-3 h-3 mr-1" />;
    }
  };

  const sentimentData = stats
    ? [
        { name: '正向', value: stats.positiveRate * 100, color: '#10B981' },
        { name: '中性', value: (1 - stats.positiveRate) * 60, color: '#78716C' },
        { name: '负向', value: (1 - stats.positiveRate) * 40, color: '#EF4444' },
      ]
    : [];

  const handleSendCollaboration = async () => {
    if (!stats) return;

    const collabData: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt'> = {
      activityId: activity.id,
      bookId: activity.bookIds[0],
      authorId: 'a1',
      authorName: '作者名称',
      readerExpectations: `读者们对本次催更活动反响热烈，目前已有${stats.participantCount.toLocaleString()}人参与活动，有效催更${stats.validUrgeCount.toLocaleString()}次。读者留言中正面评价占比${(stats.positiveRate * 100).toFixed(0)}%，大家普遍期待作者能加快更新节奏，同时也表达了对作者身体健康的关心。热门关键词包括：${stats.topKeywords.slice(0, 5).map((k) => k.word).join('、')}。`,
    };

    try {
      await createCollaboration(collabData);
      alert('协同请求已发送！');
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  const handleToggleStatus = () => {
    const newStatus = activity.status === 'active' ? 'ended' : 'active';
    updateActivity(activity.id, { status: newStatus });
  };

  const pendingCollab = activityCollabs.find((c) => c.status === 'pending');
  const repliedCollab = activityCollabs.find((c) => c.status === 'replied');

  return (
    <div className="p-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-6 flex items-center gap-2 -ml-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回活动列表
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif font-bold text-stone-100">{activity.title}</h1>
            <span className={`tag ${getStatusClass(activity.status)}`}>
              {activity.status === 'active' && <Play className="w-3 h-3 mr-1" />}
              {activity.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </span>
          </div>
          <p className="text-stone-400 mb-4">{activity.displayText}</p>
          <div className="flex items-center gap-6 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {activity.startDate} — {activity.endDate}
            </span>
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              {TARGET_TYPE_LABELS[activity.targetType]} · {activity.targetValue.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          {!pendingCollab && !repliedCollab && (
            <button
              onClick={handleSendCollaboration}
              disabled={loading.createCollab}
              className="btn-outline flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送协同请求
            </button>
          )}
          {activity.status !== 'draft' && (
            <button onClick={handleToggleStatus} className="btn-secondary">
              {activity.status === 'active' ? '结束活动' : '重新开启'}
            </button>
          )}
        </div>
      </div>

      {repliedCollab && (
        <div className="mb-6 p-5 bg-ink-800/20 border border-ink-700/30 rounded-xl animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-ink-700/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-ink-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-ink-500">作者已回复</h3>
                <span className="tag tag-active">
                  {REPLY_TYPE_LABELS[repliedCollab.replyType!]}
                </span>
                <span className="text-stone-500 text-sm">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {repliedCollab.repliedAt && new Date(repliedCollab.repliedAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="text-stone-300">{repliedCollab.replyNote}</p>
            </div>
          </div>
        </div>
      )}

      {pendingCollab && (
        <div className="mb-6 p-5 bg-amber-600/10 border border-amber-600/30 rounded-xl animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-500 animate-pulse-soft" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-amber-400 mb-2">等待作者回复</h3>
              <p className="text-stone-400 text-sm">
                协同请求已发送，等待作者确认回复。作者可选择"可加更"、"只能发进度说明"或"不参与活动"。
              </p>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card animate-slide-up" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-xs text-ink-500 bg-ink-800/20 px-2 py-1 rounded-full">
                  +12.5%
                </span>
              </div>
              <p className="text-3xl font-serif font-bold text-stone-100 mb-1">
                {stats.participantCount.toLocaleString()}
              </p>
              <p className="text-sm text-stone-500">参与人数</p>
            </div>

            <div className="stat-card animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-ink-800/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-ink-500" />
                </div>
                <span className="text-xs text-ink-500 bg-ink-800/20 px-2 py-1 rounded-full">
                  +8.3%
                </span>
              </div>
              <p className="text-3xl font-serif font-bold text-stone-100 mb-1">
                {stats.validUrgeCount.toLocaleString()}
              </p>
              <p className="text-sm text-stone-500">有效催更数</p>
            </div>

            <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rust-800/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-rust-500" />
                </div>
                <span className="text-xs text-ink-500 bg-ink-800/20 px-2 py-1 rounded-full">
                  +15.2%
                </span>
              </div>
              <p className="text-3xl font-serif font-bold text-stone-100 mb-1">
                {stats.returnReaderCount.toLocaleString()}
              </p>
              <p className="text-sm text-stone-500">回流阅读人数</p>
            </div>

            <div className="stat-card animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-ink-800/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-ink-500" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    stats.positiveRate >= 0.7
                      ? 'text-ink-500 bg-ink-800/20'
                      : stats.positiveRate >= 0.5
                      ? 'text-amber-500 bg-amber-600/20'
                      : 'text-rust-500 bg-rust-800/20'
                  }`}
                >
                  {stats.positiveRate >= 0.7 ? '良好' : stats.positiveRate >= 0.5 ? '一般' : '需关注'}
                </span>
              </div>
              <p className="text-3xl font-serif font-bold text-stone-100 mb-1">
                {(stats.positiveRate * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-stone-500">正向评价率</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              数据概览
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'comments'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              读者留言 ({stats.hotComments.length})
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-6 lg:col-span-2 animate-slide-up">
                <h3 className="font-serif text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  参与趋势
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trendData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#44403C" />
                      <XAxis dataKey="date" stroke="#78716C" fontSize={12} />
                      <YAxis stroke="#78716C" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#292524',
                          border: '1px solid #44403C',
                          borderRadius: '8px',
                          color: '#FAFAF9',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#D97706"
                        strokeWidth={2}
                        fill="url(#colorCount)"
                        name="参与人数"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
                <h3 className="font-serif text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-500" />
                  情感分析
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#292524',
                          border: '1px solid #44403C',
                          borderRadius: '8px',
                          color: '#FAFAF9',
                        }}
                      />
                      <Legend
                        formatter={(value) => <span className="text-stone-300">{value}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-6 lg:col-span-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h3 className="font-serif text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  高频关键词
                </h3>
                <div className="flex flex-wrap gap-3">
                  {stats.topKeywords.map((keyword, index) => (
                    <div
                      key={keyword.word}
                      className="group relative px-4 py-2 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-700/10 border border-amber-600/30 hover:border-amber-500/50 transition-all duration-300 cursor-default"
                      style={{
                        fontSize: `${Math.max(14, 24 - index * 1.5)}px`,
                        fontWeight: index < 3 ? 600 : 400,
                      }}
                    >
                      <span className="text-amber-400">{keyword.word}</span>
                      <span className="ml-2 text-xs text-amber-600 bg-amber-600/20 px-1.5 py-0.5 rounded">
                        {keyword.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="card p-6 animate-slide-up">
              <h3 className="font-serif text-lg font-semibold text-stone-100 mb-6">热门留言</h3>
              <div className="space-y-4">
                {stats.hotComments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-stone-800/30 rounded-xl border border-stone-700/50 hover:border-amber-600/20 transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white font-medium">
                          {comment.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-stone-100">{comment.userName}</p>
                          <p className="text-xs text-stone-500">
                            {new Date(comment.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`tag ${getSentimentClass(comment.sentiment)} flex items-center`}>
                          {getSentimentIcon(comment.sentiment)}
                          {getSentimentLabel(comment.sentiment)}
                        </span>
                        <span className="flex items-center gap-1 text-stone-400 text-sm">
                          <ThumbsUp className="w-4 h-4" />
                          {comment.likes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-200 pl-13 ml-13">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading[`stats_${id}`] && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
