import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.ts';
import { ACTIVITY_STATUS_LABELS, TARGET_TYPE_LABELS } from '../../shared/types.ts';
import type { Activity } from '../../shared/types.ts';
import {
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  Filter,
  Eye,
  Play,
  Pause,
  BookOpen,
  Gift,
  RefreshCw,
  X,
} from 'lucide-react';

type StatusFilter = Activity['status'] | 'all';
type TargetFilter = Activity['targetType'] | 'all';

export default function Home() {
  const navigate = useNavigate();
  const { activities, books, loading, fetchActivities, fetchBooks } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  );
  const [targetFilter, setTargetFilter] = useState<TargetFilter>(
    (searchParams.get('target') as TargetFilter) || 'all'
  );
  const [bookFilter, setBookFilter] = useState<string>(searchParams.get('book') || 'all');

  useEffect(() => {
    fetchActivities();
    fetchBooks();
  }, [fetchActivities, fetchBooks]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (targetFilter !== 'all') params.target = targetFilter;
    if (bookFilter !== 'all') params.book = bookFilter;
    const next = new URLSearchParams(params);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [statusFilter, targetFilter, bookFilter, searchParams, setSearchParams]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (targetFilter !== 'all' && a.targetType !== targetFilter) return false;
      if (bookFilter !== 'all' && !a.bookIds?.includes(bookFilter)) return false;
      return true;
    });
  }, [activities, statusFilter, targetFilter, bookFilter]);

  const getStatusClass = (status: Activity['status']) => {
    switch (status) {
      case 'active':
        return 'tag-active';
      case 'draft':
        return 'tag-pending';
      case 'ended':
        return 'tag-ended';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getBookTitle = (bookId: string) =>
    books.find((b) => b.id === bookId)?.title || '未知作品';

  const resetFilters = () => {
    setStatusFilter('all');
    setTargetFilter('all');
    setBookFilter('all');
  };

  const hasActiveFilter = statusFilter !== 'all' || targetFilter !== 'all' || bookFilter !== 'all';

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-100 mb-2">活动管理</h1>
          <p className="text-stone-400">管理所有催更活动，查看实时数据与读者反馈</p>
        </div>
        <button onClick={() => navigate('/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          创建新活动
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">进行中活动</p>
              <p className="text-2xl font-serif font-bold text-amber-400">
                {activities.filter((a) => a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ink-800/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-ink-500" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">总参与人数</p>
              <p className="text-2xl font-serif font-bold text-stone-100">16,924</p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rust-800/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-rust-500" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">今日催更数</p>
              <p className="text-2xl font-serif font-bold text-stone-100">3,456</p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">草稿活动</p>
              <p className="text-2xl font-serif font-bold text-stone-100">
                {activities.filter((a) => a.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-serif font-semibold text-stone-100">所有活动</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-stone-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm">组合筛选</span>
            </div>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="input-field w-auto py-2 text-sm"
            >
              <option value="all">全部作品</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="input-field w-auto py-2 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="active">进行中</option>
              <option value="draft">草稿</option>
              <option value="ended">已结束</option>
            </select>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
              className="input-field w-auto py-2 text-sm"
            >
              <option value="all">全部目标动作</option>
              {(Object.keys(TARGET_TYPE_LABELS) as Activity['targetType'][]).map((t) => (
                <option key={t} value={t}>
                  {TARGET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="btn-ghost py-2 px-3 flex items-center gap-1 text-sm"
                title="重置筛选"
              >
                <X className="w-4 h-4" />
                重置
              </button>
            )}
            {hasActiveFilter && (
              <span className="text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 px-2 py-1 rounded">
                已筛选：{filteredActivities.length} / {activities.length}
              </span>
            )}
          </div>
        </div>

        {loading.activities ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p className="text-lg mb-2">
              {hasActiveFilter ? '没有符合筛选条件的活动' : '暂无活动'}
            </p>
            <p className="text-sm">
              {hasActiveFilter ? (
                <>
                  试试 <button onClick={resetFilters} className="text-amber-400 underline">重置筛选</button>
                </>
              ) : (
                '点击右上角按钮创建第一个催更活动'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="group p-5 bg-stone-800/50 rounded-xl border border-stone-700/50 hover:border-amber-600/30 transition-all duration-300 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/activity/${activity.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-serif text-lg font-semibold text-stone-100 group-hover:text-amber-400 transition-colors">
                        {activity.title}
                      </h3>
                      <span className={`tag ${getStatusClass(activity.status)}`}>
                        {activity.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                        {activity.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
                        {ACTIVITY_STATUS_LABELS[activity.status]}
                      </span>
                      <span
                        className={`tag flex items-center gap-1 text-xs ${
                          activity.allowRepeat ? 'tag-active' : 'tag-ended'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {activity.allowRepeat ? '允许重复参与' : '不允许重复'}
                      </span>
                    </div>
                    <p className="text-stone-400 text-sm mb-3 line-clamp-2">
                      {activity.displayText || '（未设置展示文案）'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {activity.bookIds && activity.bookIds.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-stone-400">
                            <span className="text-stone-500">关联作品：</span>
                            {activity.bookIds.map(getBookTitle).join('、')}
                          </span>
                        </div>
                      )}
                      {activity.rewardText && (
                        <div className="flex items-start gap-2 text-sm">
                          <Gift className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-stone-400 line-clamp-2">
                            <span className="text-stone-500">奖励说明：</span>
                            {activity.rewardText}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm flex-wrap">
                      <span className="flex items-center gap-2 text-stone-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(activity.startDate)} — {formatDate(activity.endDate)}
                      </span>
                      <span className="flex items-center gap-2 text-stone-500">
                        <MessageSquare className="w-4 h-4" />
                        {TARGET_TYPE_LABELS[activity.targetType]}
                      </span>
                      <span className="text-stone-500">
                        目标: {activity.targetValue?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  <button className="btn-ghost flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
