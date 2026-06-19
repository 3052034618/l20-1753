import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.ts';
import { TARGET_TYPE_LABELS, type Activity, type Book } from '../../shared/types.ts';
import { BookOpen, Calendar, Target, Type, Gift, Settings, Check, ChevronRight, Search, X, ArrowLeft } from 'lucide-react';

const steps = [
  { id: 1, label: '选择作品', icon: BookOpen },
  { id: 2, label: '活动配置', icon: Settings },
  { id: 3, label: '文案编辑', icon: Type },
  { id: 4, label: '确认发布', icon: Check },
];

const targetTypes = [
  { value: 'comment_streak', label: '连续评论催更', desc: '读者连续多天评论参与活动' },
  { value: 'want_to_read', label: '达到想看数', desc: '作品想看数达到指定目标' },
  { value: 'likes', label: '点赞数达标', desc: '活动相关内容点赞数达到目标' },
];

export default function CreateActivity() {
  const navigate = useNavigate();
  const { books, loading, fetchBooks, createActivity } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);

  const [formData, setFormData] = useState<Partial<Activity>>({
    title: '',
    startDate: '',
    endDate: '',
    targetType: 'comment_streak',
    targetValue: 3,
    displayText: '',
    rewardText: '',
    allowRepeat: false,
    status: 'draft',
  });

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBook = (book: Book) => {
    setSelectedBooks((prev) =>
      prev.find((b) => b.id === book.id)
        ? prev.filter((b) => b.id !== book.id)
        : [...prev, book]
    );
  };

  const handleSubmit = async () => {
    try {
      const activity = await createActivity({
        ...formData,
        bookIds: selectedBooks.map((b) => b.id),
        title: formData.title || `《${selectedBooks[0]?.title || '作品'}》催更活动`,
        status: formData.status,
      } as Omit<Activity, 'id' | 'createdAt'>);
      navigate(`/activity/${activity.id}`);
    } catch (error) {
      console.error('创建活动失败:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedBooks.length > 0;
      case 2:
        return formData.title && formData.startDate && formData.endDate && formData.targetValue;
      case 3:
        return formData.displayText && formData.rewardText;
      default:
        return true;
    }
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-100 mb-2">创建催更活动</h1>
          <p className="text-stone-400">有节奏地调动读者热情，让催更变得透明而温暖</p>
        </div>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-600/20 border border-amber-500/50'
                      : isCompleted
                      ? 'bg-ink-800/20 border border-ink-700/30'
                      : 'bg-stone-800/50 border border-stone-700/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : isCompleted
                        ? 'bg-ink-600 text-white'
                        : 'bg-stone-700 text-stone-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-amber-400' : isCompleted ? 'text-ink-500' : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? 'bg-ink-600' : 'bg-stone-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-8 mb-6 min-h-[500px]">
        {currentStep === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-serif font-semibold text-stone-100 mb-2">
              选择关联作品
            </h2>
            <p className="text-stone-400 mb-6">
              选择本次催更活动关联的作品，可以选择多个作品同时进行活动
            </p>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
              <input
                type="text"
                placeholder="搜索作品名称或作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            {selectedBooks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-4 bg-amber-600/10 rounded-xl border border-amber-600/20">
                <span className="text-sm text-amber-400">已选择：</span>
                {selectedBooks.map((book) => (
                  <span
                    key={book.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm"
                  >
                    {book.cover} {book.title}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBook(book);
                      }}
                      className="ml-1 hover:text-amber-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {loading.books ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                filteredBooks.map((book) => {
                  const isSelected = selectedBooks.find((b) => b.id === book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => toggleBook(book)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-600/10'
                          : 'border-stone-700/50 bg-stone-800/30 hover:border-amber-600/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{book.cover}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-semibold text-stone-100 truncate">
                            {book.title}
                          </h3>
                          <p className="text-sm text-stone-400">{book.author}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="tag tag-pending">{book.category}</span>
                            <span
                              className={`tag ${
                                book.status === 'ongoing' ? 'tag-active' : 'tag-ended'
                              }`}
                            >
                              {book.status === 'ongoing' ? '连载中' : '已完结'}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-slide-up max-w-2xl mx-auto">
            <h2 className="text-xl font-serif font-semibold text-stone-100 mb-2">
              配置活动规则
            </h2>
            <p className="text-stone-400 mb-6">设置活动周期和目标动作</p>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                  <Type className="w-4 h-4" />
                  活动名称
                </label>
                <input
                  type="text"
                  placeholder="例如：《长夜余火》三日催更大挑战"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                    <Calendar className="w-4 h-4" />
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                    <Calendar className="w-4 h-4" />
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-stone-300 font-medium mb-3">
                  <Target className="w-4 h-4" />
                  目标动作类型
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {targetTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          targetType: type.value as Activity['targetType'],
                        })
                      }
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        formData.targetType === type.value
                          ? 'border-amber-500 bg-amber-600/10'
                          : 'border-stone-700/50 bg-stone-800/30 hover:border-amber-600/30'
                      }`}
                    >
                      <h4 className="font-medium text-stone-100 mb-1">{type.label}</h4>
                      <p className="text-xs text-stone-400">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                  <Target className="w-4 h-4" />
                  目标数值
                  <span className="text-stone-500 text-sm font-normal">
                    （{TARGET_TYPE_LABELS[formData.targetType as Activity['targetType']]}）
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) =>
                    setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-stone-800/50 rounded-xl">
                <input
                  type="checkbox"
                  id="allowRepeat"
                  checked={formData.allowRepeat}
                  onChange={(e) => setFormData({ ...formData, allowRepeat: e.target.checked })}
                  className="w-5 h-5 rounded border-stone-600 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <label htmlFor="allowRepeat" className="text-stone-200 font-medium cursor-pointer">
                    允许同一账号重复参与
                  </label>
                  <p className="text-sm text-stone-500">开启后读者可以多次参与活动并累计数据</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-slide-up max-w-2xl mx-auto">
            <h2 className="text-xl font-serif font-semibold text-stone-100 mb-2">
              编辑展示文案
            </h2>
            <p className="text-stone-400 mb-6">撰写吸引读者参与的活动文案和奖励说明</p>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                  <Type className="w-4 h-4" />
                  展示文案
                </label>
                <textarea
                  rows={3}
                  placeholder="例如：连续三天评论催更，解锁作者独家番外！"
                  value={formData.displayText}
                  onChange={(e) => setFormData({ ...formData, displayText: e.target.value })}
                  className="input-field resize-none"
                />
                <div className="mt-3 p-4 bg-amber-50/10 rounded-xl border border-amber-200/20">
                  <p className="text-xs text-amber-300 mb-1">预览效果</p>
                  <div className="card-amber p-4">
                    <p className="font-serif text-lg text-stone-800">
                      {formData.displayText || '活动展示文案将显示在这里'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                  <Gift className="w-4 h-4" />
                  奖励说明
                </label>
                <textarea
                  rows={4}
                  placeholder="详细说明读者参与活动可以获得的奖励..."
                  value={formData.rewardText}
                  onChange={(e) => setFormData({ ...formData, rewardText: e.target.value })}
                  className="input-field resize-none"
                />
                <p className="text-sm text-stone-500 mt-2">
                  建议清晰说明奖励内容、发放时间和领取方式，提升读者参与意愿
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-stone-300 font-medium mb-2">
                  <Settings className="w-4 h-4" />
                  活动状态
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.status === 'draft'
                        ? 'bg-stone-700 text-stone-100'
                        : 'bg-stone-800/50 text-stone-400 hover:bg-stone-700/50'
                    }`}
                  >
                    保存为草稿
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.status === 'active'
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-800/50 text-stone-400 hover:bg-amber-600/30'
                    }`}
                  >
                    立即发布
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-slide-up max-w-2xl mx-auto">
            <h2 className="text-xl font-serif font-semibold text-stone-100 mb-2">
              确认活动信息
            </h2>
            <p className="text-stone-400 mb-6">请确认以下活动配置，确认无误后即可创建</p>

            <div className="space-y-4">
              <div className="card-amber p-6 grain-overlay">
                <h3 className="font-serif text-xl font-bold text-stone-800 mb-4">
                  {formData.title || '活动名称'}
                </h3>
                <div className="space-y-3 text-stone-700">
                  <div className="flex justify-between">
                    <span className="text-stone-500">关联作品</span>
                    <span className="font-medium">
                      {selectedBooks.map((b) => b.title).join('、')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">活动周期</span>
                    <span className="font-medium">
                      {formData.startDate} — {formData.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">目标动作</span>
                    <span className="font-medium">
                      {TARGET_TYPE_LABELS[formData.targetType as Activity['targetType']]} ·{' '}
                      {formData.targetValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">重复参与</span>
                    <span className="font-medium">
                      {formData.allowRepeat ? '允许' : '不允许'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h4 className="font-medium text-amber-400 mb-2">展示文案</h4>
                <p className="text-stone-200">{formData.displayText}</p>
              </div>

              <div className="card p-5">
                <h4 className="font-medium text-amber-400 mb-2">奖励说明</h4>
                <p className="text-stone-200 whitespace-pre-wrap">{formData.rewardText}</p>
              </div>

              <div className="p-4 bg-ink-800/20 border border-ink-700/30 rounded-xl">
                <p className="text-sm text-ink-500">
                  活动将{formData.status === 'active' ? '立即发布上线' : '保存为草稿'}，
                  {formData.status === 'active' && '读者可以立即参与活动。'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="btn-secondary disabled:opacity-30"
        >
          上一步
        </button>
        {currentStep < steps.length ? (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
            disabled={!canProceed()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            下一步
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading.createActivity}
            className="btn-primary flex items-center gap-2"
          >
            {loading.createActivity ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {formData.status === 'active' ? '发布活动' : '保存草稿'}
          </button>
        )}
      </div>
    </div>
  );
}
