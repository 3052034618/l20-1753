import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.ts';
import {
  ACTIVITY_STATUS_LABELS,
  TARGET_TYPE_LABELS,
  REPLY_TYPE_LABELS,
} from '../../shared/types.ts';
import type { Comment, CollaborationRequest, Activity } from '../../shared/types.ts';
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
  X,
  Edit3,
  Search,
  Sparkles,
  BookOpen,
  Tag,
  AlertCircle,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Timer,
  LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type SentimentFilter = Comment['sentiment'] | 'all';
type TimeRange = 'all' | 1 | 3 | 7;
type StatusFilter = Activity['status'] | 'all';
type TargetFilter = Activity['targetType'] | 'all';

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const {
    activities,
    activityStats,
    collaborations,
    books,
    loading,
    fetchActivities,
    fetchActivityStats,
    fetchCollaborations,
    fetchBooks,
    createCollaboration,
    updateCollaboration,
    updateActivity,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [showExpectationDialog, setShowExpectationDialog] = useState(false);
  const [expectationDraft, setExpectationDraft] = useState('');
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(
    (Number(urlParams.get('days')) as TimeRange) || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (urlParams.get('f_status') as StatusFilter) || 'all'
  );
  const [targetFilter, setTargetFilter] = useState<TargetFilter>(
    (urlParams.get('f_target') as TargetFilter) || 'all'
  );
  const [bookFilter, setBookFilter] = useState<string>(urlParams.get('f_book') || 'all');

  const syncUrlParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (timeRange !== 'all') params.days = String(timeRange);
    if (statusFilter !== 'all') params.f_status = statusFilter;
    if (targetFilter !== 'all') params.f_target = targetFilter;
    if (bookFilter !== 'all') params.f_book = bookFilter;
    const next = new URLSearchParams(params);
    if (next.toString() !== urlParams.toString()) {
      setUrlParams(next, { replace: true });
    }
  }, [timeRange, statusFilter, targetFilter, bookFilter, urlParams, setUrlParams]);

  useEffect(() => {
    syncUrlParams();
  }, [syncUrlParams]);

  useEffect(() => {
    fetchActivities();
    fetchCollaborations();
    fetchBooks();
  }, [fetchActivities, fetchCollaborations, fetchBooks]);

  useEffect(() => {
    if (id) {
      fetchActivityStats(id, timeRange === 'all' ? undefined : timeRange);
    }
  }, [id, timeRange, fetchActivityStats]);

  const activity = activities.find((a) => a.id === id);
  const stats = id ? activityStats[id] : undefined;
  const activityCollabs = collaborations.filter((c) => c.activityId === id);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (targetFilter !== 'all' && a.targetType !== targetFilter) return false;
      if (bookFilter !== 'all' && !a.bookIds?.includes(bookFilter)) return false;
      return true;
    });
  }, [activities, statusFilter, targetFilter, bookFilter]);

  const currentActivityIndex = filteredActivities.findIndex((a) => a.id === id);
  const prevActivity = currentActivityIndex > 0 ? filteredActivities[currentActivityIndex - 1] : null;
  const nextActivity = currentActivityIndex < filteredActivities.length - 1 ? filteredActivities[currentActivityIndex + 1] : null;

  const filteredComments = useMemo(() => {
    if (!stats) return [] as Comment[];
    return stats.hotComments.filter((c) => {
      if (sentimentFilter !== 'all' && c.sentiment !== sentimentFilter) return false;
      if (activeKeyword && !c.content.includes(activeKeyword)) return false;
      return true;
    });
  }, [stats, sentimentFilter, activeKeyword]);

  const sentimentCounts = useMemo(() => {
    if (!stats)
      return { all: 0, positive: 0, neutral: 0, negative: 0 };
    return {
      all: stats.hotComments.length,
      positive: stats.hotComments.filter((c) => c.sentiment === 'positive').length,
      neutral: stats.hotComments.filter((c) => c.sentiment === 'neutral').length,
      negative: stats.hotComments.filter((c) => c.sentiment === 'negative').length,
    };
  }, [stats]);

  const getBookTitle = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.title || '未知作品';
  };

  const getAuthorForBook = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return { authorId: 'a1', authorName: '作者' };
    if (book.author.includes('乌贼')) return { authorId: 'a1', authorName: book.author };
    if (book.author.includes('狐尾')) return { authorId: 'a2', authorName: book.author };
    if (book.author.includes('辰东')) return { authorId: 'a3', authorName: book.author };
    return { authorId: 'a1', authorName: book.author };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setActiveKeyword(null);
    setSentimentFilter('all');
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTargetFilter('all');
    setBookFilter('all');
  };
  const hasActiveFilter = statusFilter !== 'all' || targetFilter !== 'all' || bookFilter !== 'all';

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
      case 'active': return 'tag-active';
      case 'draft': return 'tag-pending';
      case 'ended': return 'tag-ended';
    }
  };

  const getSentimentClass = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'tag-positive';
      case 'negative': return 'tag-negative';
      case 'neutral': return 'tag-neutral';
    }
  };

  const getSentimentLabel = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive': return '正向';
      case 'negative': return '负向';
      case 'neutral': return '中性';
    }
  };

  const getSentimentIcon = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-3 h-3 mr-1" />;
      case 'negative': return <ThumbsDown className="w-3 h-3 mr-1" />;
      case 'neutral': return <HelpCircle className="w-3 h-3 mr-1" />;
    }
  };

  const getFrontHintText = (replyType: CollaborationRequest['replyType']) => {
    switch (replyType) {
      case 'can_update': return '作者已确认可加更，敬请期待！';
      case 'progress_only': return '作者将发布进度说明，感谢理解与支持';
      case 'not_participate': return '作者暂不参与本次活动，感谢读者理解';
      default: return '';
    }
  };

  const sentimentData = stats
    ? [
        { name: '正向', value: stats.sentimentCounts.positive, color: '#10B981' },
        { name: '中性', value: stats.sentimentCounts.neutral, color: '#78716C' },
        { name: '负向', value: stats.sentimentCounts.negative, color: '#EF4444' },
      ]
    : [];

  const generateExpectationSummary = (): string => {
    if (!stats) return '';
    const { participantCount, validUrgeCount, positiveRate, topKeywords, hotComments } = stats;
    const top3Keywords = topKeywords.slice(0, 3).map((k) => k.word);
    const representativeComments = hotComments
      .slice(0, 3)
      .map((c) => `「${c.content.length > 30 ? c.content.slice(0, 30) + '…' : c.content}」`)
      .join('；');
    const positiveComments = hotComments.filter((c) => c.sentiment === 'positive').length;
    const concernWords = topKeywords
      .filter((k) => ['身体', '质量', '剧情', '伏笔'].includes(k.word))
      .map((k) => k.word);
    let summary = `读者们对本次催更活动反响热烈，目前已有${participantCount.toLocaleString()}人参与活动，有效催更${validUrgeCount.toLocaleString()}次。读者留言中正面评价占比${(
      positiveRate * 100
    ).toFixed(0)}%，${positiveComments > 0 ? `共${positiveComments}条留言明确表达支持与鼓励，` : ''}`;
    if (top3Keywords.length) {
      summary += `大家最关心的话题集中在「${top3Keywords.join('」、「')}」。`;
    }
    if (representativeComments) {
      summary += `\n\n典型读者声音：${representativeComments}。`;
    }
    if (concernWords.length) {
      summary += `\n\n读者也在留言中反复提到：${concernWords.join('、')}等方面，希望作者能在创作节奏中兼顾质量与健康。`;
    }
    summary += `\n\n请您根据自身创作节奏，选择合适的方式回应读者期待，感谢您的配合！`;
    return summary;
  };

  const openExpectationDialog = (existing?: CollaborationRequest) => {
    if (existing) {
      setExpectationDraft(existing.readerExpectations);
      setEditingCollabId(existing.id);
    } else {
      setExpectationDraft(generateExpectationSummary());
      setEditingCollabId(null);
    }
    setShowExpectationDialog(true);
  };

  const handleSendExpectation = async () => {
    if (!expectationDraft.trim() || !activity) return;
    try {
      if (editingCollabId) {
        await updateCollaboration(editingCollabId, {
          readerExpectations: expectationDraft,
          status: 'pending',
        });
      } else {
        const bookId = activity.bookIds[0];
        const authorInfo = getAuthorForBook(bookId);
        await createCollaboration({
          activityId: activity.id,
          bookId,
          authorId: authorInfo.authorId,
          authorName: authorInfo.authorName,
          readerExpectations: expectationDraft,
        });
      }
      await fetchCollaborations();
      setShowExpectationDialog(false);
      setEditingCollabId(null);
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
  const latestCollab = activityCollabs[0];

  const highlightContent = (content: string, keyword: string | null) => {
    if (!keyword) return content;
    const idx = content.indexOf(keyword);
    if (idx < 0) return content;
    return (
      <>
        {content.slice(0, idx)}
        <mark className="bg-amber-500/40 text-amber-100 px-0.5 rounded">{keyword}</mark>
        {content.slice(idx + keyword.length)}
      </>
    );
  };

  return (
    <div className="p-8 animate-fade-in">
      <button onClick={() => navigate('/')} className="btn-ghost mb-4 flex items-center gap-2 -ml-4">
        <ArrowLeft className="w-4 h-4" />
        返回活动列表
      </button>

      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-stone-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">活动切换</span>
            </div>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="input-field w-auto py-1.5 text-sm"
            >
              <option value="all">全部作品</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="input-field w-auto py-1.5 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="active">进行中</option>
              <option value="draft">草稿</option>
              <option value="ended">已结束</option>
            </select>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
              className="input-field w-auto py-1.5 text-sm"
            >
              <option value="all">全部目标动作</option>
              {(Object.keys(TARGET_TYPE_LABELS) as Activity['targetType'][]).map((t) => (
                <option key={t} value={t}>{TARGET_TYPE_LABELS[t]}</option>
              ))}
            </select>
            {hasActiveFilter && (
              <button onClick={resetFilters} className="btn-ghost py-1 px-2 text-xs">
                <X className="w-3 h-3 inline mr-1" />重置
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">
              {currentActivityIndex + 1} / {filteredActivities.length}
            </span>
            <button
              onClick={() => prevActivity && navigate(`/activity/${prevActivity.id}`)}
              disabled={!prevActivity}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextActivity && navigate(`/activity/${nextActivity.id}`)}
              disabled={!nextActivity}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-serif font-bold text-stone-100">{activity.title}</h1>
            <span className={`tag ${getStatusClass(activity.status)}`}>
              {activity.status === 'active' && <Play className="w-3 h-3 mr-1" />}
              {activity.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </span>
          </div>
          <p className="text-stone-400 mb-4">{activity.displayText}</p>
          <div className="flex items-center gap-6 text-sm text-stone-500 flex-wrap">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(activity.startDate)} — {formatDate(activity.endDate)}
            </span>
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              {TARGET_TYPE_LABELS[activity.targetType]} · {(activity.targetValue ?? 0).toLocaleString()}
            </span>
            {activity.bookIds && activity.bookIds.length > 0 && (
              <span className="text-stone-400">
                关联作品：{activity.bookIds.map((bid) => getBookTitle(bid)).join('、')}
              </span>
            )}
          </div>
          {activity.rewardText && (
            <div className="mt-2 text-sm text-stone-400">奖励说明：{activity.rewardText}</div>
          )}
          {activity.allowRepeat !== undefined && (
            <div className="mt-1 text-sm text-stone-500">
              重复参与：{activity.allowRepeat ? '允许' : '不允许'}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {!pendingCollab && (
            <button
              onClick={() => openExpectationDialog(latestCollab && latestCollab.status === 'replied' ? latestCollab : undefined)}
              disabled={loading.createCollab || loading.updateCollab}
              className="btn-outline flex items-center gap-2"
            >
              {latestCollab ? (
                <><Edit3 className="w-4 h-4" />重发读者期待</>
              ) : (
                <><Send className="w-4 h-4" />发送协同请求</>
              )}
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
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-medium text-ink-500">作者已回复</h3>
                <span className="tag tag-active">{REPLY_TYPE_LABELS[repliedCollab.replyType!]}</span>
                <span className="text-stone-500 text-sm">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {repliedCollab.repliedAt && new Date(repliedCollab.repliedAt).toLocaleString('zh-CN')}
                </span>
                <button
                  onClick={() => openExpectationDialog(repliedCollab)}
                  className="btn-ghost py-1 px-2 text-xs ml-auto"
                >
                  <Edit3 className="w-3 h-3 inline mr-1" />
                  重新整理并发送
                </button>
              </div>
              <p className="text-stone-300">{repliedCollab.replyNote}</p>
              <div className="mt-3 p-3 bg-amber-600/10 border border-amber-600/20 rounded-lg">
                <p className="text-sm text-amber-400">
                  前台提示：{getFrontHintText(repliedCollab.replyType)}
                </p>
              </div>
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
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-medium text-amber-400">等待作者回复</h3>
                <button
                  onClick={() => openExpectationDialog(pendingCollab)}
                  className="btn-ghost py-1 px-2 text-xs ml-auto"
                >
                  <Edit3 className="w-3 h-3 inline mr-1" />
                  更新读者期待
                </button>
              </div>
              <p className="text-stone-400 text-sm">
                已向<strong>{pendingCollab.authorName}</strong>发送协同请求，等待确认回复。
              </p>
              <div className="mt-3 p-3 bg-stone-800/50 rounded-lg border border-stone-700/30">
                <p className="text-xs text-stone-500 mb-1">已发送的读者期待：</p>
                <p className="text-sm text-stone-300 whitespace-pre-wrap">{pendingCollab.readerExpectations}</p>
              </div>
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

          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex gap-2">
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
                读者反应分析 ({stats.hotComments.length})
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-stone-400" />
              {(['all', 1, 3, 7] as TimeRange[]).map((range) => (
                <button
                  key={String(range)}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/30'
                  }`}
                >
                  {range === 'all' ? '全部' : `近${range}天`}
                </button>
              ))}
            </div>
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
                      <Area type="monotone" dataKey="count" stroke="#D97706" strokeWidth={2} fill="url(#colorCount)" name="参与人数" />
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
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403C', borderRadius: '8px', color: '#FAFAF9' }} />
                      <Legend formatter={(value) => <span className="text-stone-300">{value}</span>} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-6 lg:col-span-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h3 className="font-serif text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  高频关键词
                  <span className="text-sm font-normal text-stone-500 ml-2">点击关键词可筛选下方留言</span>
                </h3>
                {stats.topKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {stats.topKeywords.map((keyword, index) => {
                      const isActive = activeKeyword === keyword.word;
                      return (
                        <button
                          key={keyword.word}
                          onClick={() => {
                            setActiveKeyword(isActive ? null : keyword.word);
                            if (!isActive) setActiveTab('comments');
                          }}
                          className={`group relative px-4 py-2 rounded-xl border transition-all duration-300 ${
                            isActive
                              ? 'bg-amber-600/40 border-amber-400 ring-2 ring-amber-500/50'
                              : 'bg-gradient-to-br from-amber-600/20 to-amber-700/10 border-amber-600/30 hover:border-amber-500/50 cursor-pointer'
                          }`}
                          style={{ fontSize: `${Math.max(14, 24 - index * 1.5)}px`, fontWeight: index < 3 ? 600 : 400 }}
                        >
                          <span className={isActive ? 'text-amber-100' : 'text-amber-400'}>{keyword.word}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isActive ? 'text-amber-100 bg-amber-400/30' : 'text-amber-600 bg-amber-600/20'}`}>
                            {keyword.count}
                          </span>
                        </button>
                      );
                    })}
                    {activeKeyword && (
                      <button
                        onClick={() => setActiveKeyword(null)}
                        className="px-3 py-2 rounded-xl bg-stone-700/50 text-stone-300 hover:bg-stone-700 text-sm border border-stone-600/50"
                      >
                        清除关键词筛选 <X className="w-3 h-3 inline ml-1" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-stone-500 text-sm">暂无关键词数据，等待读者留言</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slide-up">
              <div className="lg:col-span-3">
                <div className="card p-6 h-full">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h3 className="font-serif text-lg font-semibold text-stone-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      读者反应分析
                      {activeKeyword && (
                        <span className="text-sm font-normal px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30 ml-1">
                          关键词：{activeKeyword}
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      {(['all', 'positive', 'neutral', 'negative'] as SentimentFilter[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSentimentFilter(s)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                            sentimentFilter === s
                              ? s === 'positive'
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                : s === 'negative'
                                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                : s === 'neutral'
                                ? 'bg-stone-600/30 text-stone-200 border border-stone-500/30'
                                : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/30'
                          }`}
                        >
                          {s === 'all' ? '全部' : s === 'positive' ? '正向' : s === 'neutral' ? '中性' : '负向'}
                          <span className="ml-1 text-xs opacity-80">
                            {s === 'all' ? sentimentCounts.all : s === 'positive' ? sentimentCounts.positive : s === 'neutral' ? sentimentCounts.neutral : sentimentCounts.negative}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredComments.length > 0 ? (
                    <div className="space-y-4">
                      {filteredComments.map((comment, index) => (
                        <div
                          key={comment.id}
                          className="p-4 bg-stone-800/30 rounded-xl border border-stone-700/50 hover:border-amber-600/20 transition-all animate-slide-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white font-medium">
                                {comment.userName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-stone-100">{comment.userName || '匿名'}</p>
                                <p className="text-xs text-stone-500">
                                  {comment.createdAt ? new Date(comment.createdAt).toLocaleString('zh-CN') : ''}
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
                                {(comment.likes ?? 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-stone-200 ml-[52px] leading-relaxed">
                            {highlightContent(comment.content, activeKeyword)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-stone-500">
                      {stats.hotComments.length === 0 ? (
                        <>
                          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="text-lg mb-1">暂无留言数据</p>
                          <p className="text-sm">
                            {timeRange !== 'all'
                              ? `近${timeRange}天暂无留言，试试切换到「全部」`
                              : '等读者陆续参与催更活动后再来分析'}
                          </p>
                        </>
                      ) : (
                        <>
                          <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="text-lg mb-1">没有匹配的留言</p>
                          <p className="text-sm">
                            试试选择
                            <button onClick={() => { setSentimentFilter('all'); setActiveKeyword(null); }} className="text-amber-400 underline mx-1">
                              全部留言
                            </button>
                            看看
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-5">
                  <h4 className="font-serif text-base font-semibold text-stone-100 mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    相关关键词
                  </h4>
                  {stats.topKeywords.length > 0 ? (
                    <div className="space-y-2">
                      {stats.topKeywords.map((kw) => {
                        const hitCount = stats.hotComments.filter((c) => c.content.includes(kw.word)).length;
                        const isActive = activeKeyword === kw.word;
                        return (
                          <button
                            key={kw.word}
                            onClick={() => setActiveKeyword(isActive ? null : kw.word)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive ? 'bg-amber-600/30 border border-amber-500/40' : 'bg-stone-800/30 border border-stone-700/40 hover:border-amber-600/30'
                            }`}
                          >
                            <span className={isActive ? 'text-amber-300' : 'text-stone-300'}>{kw.word}</span>
                            <span className="flex items-center gap-2">
                              <span className={`text-xs ${isActive ? 'text-amber-400/80' : 'text-stone-500'}`}>
                                {hitCount}条留言
                              </span>
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-600'}`} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">暂无关键词</p>
                  )}
                </div>

                <div className="card p-5">
                  <h4 className="font-serif text-base font-semibold text-stone-100 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    快速洞察
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-stone-800/30 border border-stone-700/40">
                      <p className="text-stone-400 mb-1">整体态度</p>
                      <p className="text-stone-200">
                        {stats.positiveRate >= 0.7
                          ? '整体氛围积极，读者对本书充满热情'
                          : stats.positiveRate >= 0.5
                          ? '态度分化，建议关注负向声音'
                          : '负向评价较多，建议及时回应安抚'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-800/30 border border-stone-700/40">
                      <p className="text-stone-400 mb-1">期待方向</p>
                      <p className="text-stone-200">
                        {stats.topKeywords.slice(0, 3).map((k) => k.word).join('／') || '暂无明显共识'}
                      </p>
                    </div>
                    {latestCollab && latestCollab.status === 'replied' && latestCollab.replyType && (
                      <div className="p-3 rounded-lg bg-amber-600/10 border border-amber-600/20">
                        <p className="text-stone-400 mb-1">当前前台提示</p>
                        <p className="text-amber-300">{getFrontHintText(latestCollab.replyType)}</p>
                      </div>
                    )}
                  </div>
                </div>
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

      {showExpectationDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-serif font-semibold text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  {editingCollabId ? '更新读者期待摘要' : '整理并发送读者期待'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {editingCollabId
                    ? '重新发送后，旧的回复记录将被清除，请求回到干净的待回复状态'
                    : '已基于真实留言自动生成摘要，您可编辑确认后发送给作者'}
                </p>
              </div>
              <button onClick={() => setShowExpectationDialog(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setExpectationDraft(generateExpectationSummary())}
                className="btn-outline py-1.5 px-3 text-sm"
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                重新生成摘要
              </button>
              <button onClick={() => setExpectationDraft('')} className="btn-ghost py-1.5 px-3 text-sm">
                清空
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-stone-300 font-medium mb-2">读者期待摘要</label>
              <textarea
                rows={10}
                value={expectationDraft}
                onChange={(e) => setExpectationDraft(e.target.value)}
                className="input-field resize-none leading-relaxed"
                placeholder="请输入希望作者了解的读者期待..."
              />
              <div className="flex justify-between mt-2 text-xs text-stone-500">
                <span>{expectationDraft.length} 字</span>
                <span>建议包含：参与概况 · 典型留言 · 关键词 · 关切与期待</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-700/50">
              <button onClick={() => setShowExpectationDialog(false)} className="btn-secondary">取消</button>
              <button
                onClick={handleSendExpectation}
                disabled={
                  !expectationDraft.trim() ||
                  loading.createCollab ||
                  (editingCollabId && loading[`updateCollab_${editingCollabId}`])
                }
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {editingCollabId ? '更新并重新发送' : '发送给作者'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
