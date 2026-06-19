import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.ts';
import { REPLY_TYPE_LABELS } from '../../shared/types.ts';
import type { CollaborationRequest } from '../../shared/types.ts';
import {
  Users,
  MessageSquare,
  ArrowLeft,
  Clock,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  BookOpen,
  Calendar,
  Feather,
} from 'lucide-react';

const replyOptions = [
  {
    value: 'can_update',
    label: '可加更',
    desc: '我可以安排时间加更内容',
    icon: Check,
    color: 'text-ink-500',
    bgColor: 'bg-ink-800/20',
    borderColor: 'border-ink-700/30',
  },
  {
    value: 'progress_only',
    label: '只能发进度说明',
    desc: '暂时无法加更，可以发布进度说明',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-600/20',
    borderColor: 'border-amber-600/30',
  },
  {
    value: 'not_participate',
    label: '不参与活动',
    desc: '感谢读者热情，本次不参与活动',
    icon: X,
    color: 'text-rust-500',
    bgColor: 'bg-rust-800/20',
    borderColor: 'border-rust-700/30',
  },
] as const;

export default function AuthorCollaboration() {
  const navigate = useNavigate();
  const { collaborations, activities, loading, fetchCollaborations, fetchActivities, replyToCollaboration } =
    useStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [selectedReply, setSelectedReply] = useState<Record<string, CollaborationRequest['replyType']>>({});
  const [replyNote, setReplyNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCollaborations();
    fetchActivities();
  }, [fetchCollaborations, fetchActivities]);

  const filteredCollabs =
    filter === 'all'
      ? collaborations
      : collaborations.filter((c) => c.status === filter);

  const getActivityTitle = (activityId: string) => {
    return activities.find((a) => a.id === activityId)?.title || '未知活动';
  };

  const handleReply = async (collabId: string) => {
    const replyType = selectedReply[collabId];
    if (!replyType) return;

    try {
      await replyToCollaboration(collabId, replyType, replyNote[collabId]);
      await fetchCollaborations();
      setSelectedReply((prev) => {
        const next = { ...prev };
        delete next[collabId];
        return next;
      });
      setReplyNote((prev) => {
        const next = { ...prev };
        delete next[collabId];
        return next;
      });
      setExpandedId(null);
    } catch (error) {
      console.error('回复失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-6 flex items-center gap-2 -ml-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-100 mb-2">作者协同</h1>
          <p className="text-stone-400">
            透明沟通，平衡读者期待与创作节奏。重点不是强催，而是让互动有温度、有节奏。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">待处理</p>
              <p className="text-2xl font-serif font-bold text-amber-400">
                {collaborations.filter((c) => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ink-800/20 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-ink-500" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">已回复</p>
              <p className="text-2xl font-serif font-bold text-stone-100">
                {collaborations.filter((c) => c.status === 'replied').length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ink-800/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-ink-500" />
            </div>
            <div>
              <p className="text-stone-400 text-sm">同意加更</p>
              <p className="text-2xl font-serif font-bold text-stone-100">
                {collaborations.filter((c) => c.replyType === 'can_update').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-semibold text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            协同请求列表
          </h2>
          <div className="flex gap-2">
            {(['all', 'pending', 'replied'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/30'
                }`}
              >
                {f === 'all'
                  ? '全部'
                  : f === 'pending'
                  ? '待处理'
                  : '已回复'}
              </button>
            ))}
          </div>
        </div>

        {loading.collaborations ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredCollabs.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">暂无协同请求</p>
            <p className="text-sm">在活动详情页可以向作者发送协同请求</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCollabs.map((collab, index) => {
              const isExpanded = expandedId === collab.id;
              const activityTitle = getActivityTitle(collab.activityId);

              return (
                <div
                  key={collab.id}
                  className="rounded-xl border border-stone-700/50 overflow-hidden transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="p-5 bg-stone-800/30 hover:bg-stone-800/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : collab.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white text-lg">
                            <Feather className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-stone-100">{collab.authorName}</h3>
                            <p className="text-sm text-stone-400">{activityTitle}</p>
                          </div>
                        </div>
                        <p className="text-sm text-stone-400 line-clamp-2 ml-13">
                          {collab.readerExpectations}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        {collab.status === 'pending' ? (
                          <span className="tag tag-pending flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            待回复
                          </span>
                        ) : (
                          <span
                            className={`tag ${
                              collab.replyType === 'can_update'
                                ? 'tag-active'
                                : collab.replyType === 'progress_only'
                                ? 'tag-pending'
                                : 'tag-ended'
                            } flex items-center`}
                          >
                            {REPLY_TYPE_LABELS[collab.replyType!]}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 ml-13 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(collab.createdAt)}
                      </span>
                      {collab.repliedAt && (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          回复于 {formatDate(collab.repliedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 bg-stone-900/50 border-t border-stone-700/50 animate-slide-up">
                      <div className="mb-6">
                        <h4 className="font-medium text-amber-400 mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          读者期待详情
                        </h4>
                        <div className="card-amber p-5 grain-overlay">
                          <p className="text-stone-800 leading-relaxed">{collab.readerExpectations}</p>
                        </div>
                      </div>

                      {collab.status === 'replied' && collab.replyType && (
                        <div className="mb-6">
                          <h4 className="font-medium text-ink-500 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            已发送的回复
                          </h4>
                          <div className="p-5 bg-ink-800/10 border border-ink-700/30 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`tag ${
                                  collab.replyType === 'can_update'
                                    ? 'tag-active'
                                    : collab.replyType === 'progress_only'
                                    ? 'tag-pending'
                                    : 'tag-ended'
                                }`}
                              >
                                {REPLY_TYPE_LABELS[collab.replyType]}
                              </span>
                            </div>
                            {collab.replyNote && (
                              <p className="text-stone-300">{collab.replyNote}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {collab.status === 'pending' && (
                        <>
                          <h4 className="font-medium text-amber-400 mb-4 flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            选择回复方式
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {replyOptions.map((option) => {
                              const Icon = option.icon;
                              const isSelected = selectedReply[collab.id] === option.value;

                              return (
                                <div
                                  key={option.value}
                                  onClick={() =>
                                    setSelectedReply((prev) => ({
                                      ...prev,
                                      [collab.id]: isSelected ? undefined : option.value,
                                    }))
                                  }
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                    isSelected
                                      ? `border-amber-500 ${option.bgColor}`
                                      : `border-stone-700/50 bg-stone-800/30 hover:border-amber-600/30`
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'bg-amber-600/30' : option.bgColor
                                      }`}
                                    >
                                      <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : option.color}`} />
                                    </div>
                                    <div>
                                      <h5
                                        className={`font-medium mb-1 ${
                                          isSelected ? 'text-amber-400' : 'text-stone-100'
                                        }`}
                                      >
                                        {option.label}
                                      </h5>
                                      <p className="text-xs text-stone-400">{option.desc}</p>
                                    </div>
                                    {isSelected && (
                                      <div className="ml-auto w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mb-6">
                            <label className="block text-stone-300 font-medium mb-2">
                              回复说明（可选）
                            </label>
                            <textarea
                              rows={3}
                              placeholder="可以补充说明具体情况，比如更新计划、身体状况等，让读者更理解您的创作节奏..."
                              value={replyNote[collab.id] || ''}
                              onChange={(e) =>
                                setReplyNote((prev) => ({
                                  ...prev,
                                  [collab.id]: e.target.value,
                                }))
                              }
                              className="input-field resize-none"
                            />
                            <p className="text-xs text-stone-500 mt-2">
                              温馨提示：真诚的沟通能获得读者更多理解与支持。即使无法加更，说明情况也能获得读者的尊重。
                            </p>
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setExpandedId(null)}
                              className="btn-secondary"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleReply(collab.id)}
                              disabled={!selectedReply[collab.id] || loading[`reply_${collab.id}`]}
                              className="btn-primary flex items-center gap-2 disabled:opacity-50"
                            >
                              {loading[`reply_${collab.id}`] ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <Send className="w-5 h-5" />
                              )}
                              发送回复
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
