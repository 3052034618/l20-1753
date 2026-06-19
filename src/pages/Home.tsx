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
  LayoutDashboard,
  LayoutList,
  ArrowUpDown,
} from 'lucide-react';

type StatusFilter = Activity['status'] | 'all';
type TargetFilter = Activity['targetType'] | 'all';
type ViewMode = 'cards' | 'dashboard';
type SortKey = 'participantCount' | 'validUrgeCount' | 'returnReaderCount' | 'negativeRate';

export default function Home() {
  const navigate = useNavigate();
  const { activities, books, activityStats, loading, fetchActivities, fetchBooks, fetchActivityStats } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  );
  const [targetFilter, setTargetFilter] = useState<TargetFilter>(
    (searchParams.get('target') as TargetFilter) || 'all'
  );
  const [bookFilter, setBookFilter] = useState<string>(searchParams.get('book') || 'all');
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'cards'
  );
  const [sortKey, setSortKey] = useState<SortKey>('participantCount');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetchActivities();
    fetchBooks();
  }, [fetchActivities, fetchBooks]);

  useEffect(() => {
    if (viewMode === 'dashboard' && activities.length > 0) {
      activities.forEach((a) => {
        if (!activityStats[a.id]) {
          fetchActivityStats(a.id);
        }
      });
    }
  }, [viewMode, activities, activityStats, fetchActivityStats]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (targetFilter !== 'all') params.target = targetFilter;
    if (bookFilter !== 'all') params.book = bookFilter;
    if (viewMode !== 'cards') params.view = viewMode;
    const next = new URLSearchParams(params);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [statusFilter, targetFilter, bookFilter, viewMode, searchParams, setSearchParams]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (targetFilter !== 'all' && a.targetType !== targetFilter) return false;
      if (bookFilter !== 'all' && !a.bookIds?.includes(bookFilter)) return false;
      return true;
    });
  }, [activities, statusFilter, targetFilter, bookFilter]);

  const dashboardRows = useMemo(() => {
    return filteredActivities.map((a) => {
      const stats = activityStats[a.id];
      const negativeRate = stats
        ? stats.sentimentCounts.negative / Math.max(stats.hotComments.length, 1)
        : 0;
      return {
        activity: a,
        participantCount: stats?.participantCount ?? 0,
        validUrgeCount: stats?.validUrgeCount ?? 0,
        returnReaderCount: stats?.returnReaderCount ?? 0,
        negativeRate,
        positiveRate: stats?.positiveRate ?? 0,
      };
    }).sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDesc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [filteredActivities, activityStats, sortKey, sortDesc]);

  const getStatusClass = (status: Activity['status']) => {
    switch (status) {
      case 'active': return 'tag-active';
      case 'draft': return 'tag-pending';
      case 'ended': return 'tag-ended';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getBookTitle = (bookId: string) =>
    books.find((b) => b.id === bookId)?.title || '未知作品';

  const resetFilters = () => {
    setStatusFilter('all');
    setTargetFilter('all');
    setBookFilter('all');
  };
  const hasActiveFilter = statusFilter !== 'all' || targetFilter !== 'all' || bookFilter !== 'all';

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const SortHeader = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
      onClick={() => toggleSort(sortField)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === sortField ? 'text-amber-400' : 'text-stone-600'}`} />
      </div>
    </th>
  );

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
                <option key={b.id} value={b.id}>{b.title}</option>
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
                <option key={t} value={t}>{TARGET_TYPE_LABELS[t]}</option>
              ))}
            </select>
            {hasActiveFilter && (
              <button onClick={resetFilters} className="btn-ghost py-2 px-3 flex items-center gap-1 text-sm" title="重置筛选">
                <X className="w-4 h-4" />重置
              </button>
            )}
            {hasActiveFilter && (
              <span className="text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 px-2 py-1 rounded">
                已筛选：{filteredActivities.length} / {activities.length}
              </span>
            )}
            <div className="border-l border-stone-700 pl-3 flex gap-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-amber-600/20 text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
                title="卡片视图"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'dashboard' ? 'bg-amber-600/20 text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
                title="运营看板"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading.activities ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p className="text-lg mb-2">{hasActiveFilter ? '没有符合筛选条件的活动' : '暂无活动'}</p>
            <p className="text-sm">
              {hasActiveFilter ? (
                <>试试 <button onClick={resetFilters} className="text-amber-400 underline">重置筛选</button></>
              ) : (
                '点击右上角按钮创建第一个催更活动'
              )}
            </p>
          </div>
        ) : viewMode === 'dashboard' ? (
          <div className="animate-slide-up">
            <div className="mb-4 p-4 bg-amber-600/5 border border-amber-600/20 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span className="font-medium">运营看板</span>
                <span className="text-stone-500">— 一眼对比各活动核心指标，快速判断哪些值得继续推</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-700/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">活动名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">关联作品</th>
                    <SortHeader label="参与人数" sortField="participantCount" />
                    <SortHeader label="有效催更" sortField="validUrgeCount" />
                    <SortHeader label="回流阅读" sortField="returnReaderCount" />
                    <SortHeader label="负向占比" sortField="negativeRate" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">正向率</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-stone-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {dashboardRows.map((row) => {
                    const a = row.activity;
                    const stats = activityStats[a.id];
                    const isLoading = loading[`stats_${a.id}`];
                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-stone-800/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/activity/${a.id}`)}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-stone-100">{a.title}</p>
                            <p className="text-xs text-stone-500 mt-0.5">{a.displayText && a.displayText.length > 30 ? a.displayText.slice(0, 30) + '…' : a.displayText}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`tag ${getStatusClass(a.status)}`}>
                            {a.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                            {a.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
                            {ACTIVITY_STATUS_LABELS[a.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-stone-400">
                          {a.bookIds?.map(getBookTitle).join('、') || '—'}
                        </td>
                        <td className="px-4 py-4">
                          {isLoading ? (
                            <div className="animate-pulse w-12 h-4 bg-stone-700 rounded" />
                          ) : (
                            <span className="font-medium text-stone-100">{row.participantCount.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isLoading ? (
                            <div className="animate-pulse w-12 h-4 bg-stone-700 rounded" />
                          ) : (
                            <span className="font-medium text-stone-100">{row.validUrgeCount.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isLoading ? (
                            <div className="animate-pulse w-12 h-4 bg-stone-700 rounded" />
                          ) : (
                            <span className="font-medium text-stone-100">{row.returnReaderCount.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isLoading ? (
                            <div className="animate-pulse w-12 h-4 bg-stone-700 rounded" />
                          ) : (
                            <span className={`font-medium ${row.negativeRate > 0.3 ? 'text-red-400' : row.negativeRate > 0.15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {(row.negativeRate * 100).toFixed(0)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isLoading ? (
                            <div className="animate-pulse w-12 h-4 bg-stone-700 rounded" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    row.positiveRate >= 0.7 ? 'bg-emerald-500' : row.positiveRate >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${row.positiveRate * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-stone-400">{(row.positiveRate * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/activity/${a.id}`); }}
                            className="btn-ghost py-1 px-2 text-xs"
                          >
                            <Eye className="w-3 h-3 inline mr-1" />详情
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {dashboardRows.some((r) => loading[`stats_${r.activity.id}`]) && (
              <div className="mt-4 text-center text-sm text-stone-500">
                <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full inline mr-2" />
                正在加载统计数据...
              </div>
            )}
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
                      <span className={`tag flex items-center gap-1 text-xs ${activity.allowRepeat ? 'tag-active' : 'tag-ended'}`}>
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
                      <span className="text-stone-500">目标: {activity.targetValue?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <button className="btn-ghost flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                    <Eye className="w-4 h-4" />查看详情
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
