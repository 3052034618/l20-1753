import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.ts';
import { ACTIVITY_STATUS_LABELS, TARGET_TYPE_LABELS } from '../../shared/types.ts';
import type { Activity } from '../../shared/types.ts';
import { Calendar, Users, MessageSquare, TrendingUp, Plus, Filter, Eye, Play, Pause } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { activities, loading, fetchActivities } = useStore();
  const [filter, setFilter] = useState<Activity['status'] | 'all'>('all');

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.status === filter);

  const getStatusClass = (status: Activity['status']) => {
    switch (status) {
      case 'active': return 'tag-active';
      case 'draft': return 'tag-pending';
      case 'ended': return 'tag-ended';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-100 mb-2">活动管理</h1>
          <p className="text-stone-400">管理所有催更活动，查看实时数据与读者反馈</p>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="btn-primary flex items-center gap-2"
        >
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
                {activities.filter(a => a.status === 'active').length}
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
                {activities.filter(a => a.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-stone-100">所有活动</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Activity['status'] | 'all')}
              className="input-field w-auto py-2 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="active">进行中</option>
              <option value="draft">草稿</option>
              <option value="ended">已结束</option>
            </select>
          </div>
        </div>

        {loading.activities ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p className="text-lg mb-2">暂无活动</p>
            <p className="text-sm">点击右上角按钮创建第一个催更活动</p>
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
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-lg font-semibold text-stone-100 group-hover:text-amber-400 transition-colors">
                        {activity.title}
                      </h3>
                      <span className={`tag ${getStatusClass(activity.status)}`}>
                        {activity.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                        {activity.status === 'draft' && <Pause className="w-3 h-3 mr-1" />}
                        {ACTIVITY_STATUS_LABELS[activity.status]}
                      </span>
                    </div>
                    <p className="text-stone-400 text-sm mb-3 line-clamp-2">
                      {activity.displayText}
                    </p>
                    <div className="flex items-center gap-6 text-sm">
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
                  <button className="btn-ghost flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
