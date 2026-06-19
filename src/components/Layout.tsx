import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, PlusCircle, BarChart3, Users, Feather, Sparkles } from 'lucide-react';

const navItems = [
  { path: '/', label: '活动列表', icon: BookOpen },
  { path: '/create', label: '创建活动', icon: PlusCircle },
  { path: '/author', label: '作者协同', icon: Users },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-stone-950/80 backdrop-blur-md border-r border-stone-800 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-glow-amber">
              <Feather className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-amber-400">催更工作台</h1>
              <p className="text-xs text-stone-500">Reader Engagement Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname.startsWith('/activity/'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.path === '/create' && (
                  <Sparkles className="w-4 h-4 ml-auto text-amber-500" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <div className="card-amber p-4 grain-overlay">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800">今日数据</p>
                <p className="text-2xl font-serif font-bold text-amber-700">2,345</p>
                <p className="text-xs text-stone-600">活跃参与人数</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
