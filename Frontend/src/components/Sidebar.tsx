import React from 'react';
import { LayoutDashboard, Users, MessageSquare, Calendar, FolderOpen, Shield, LogOut, BookOpen } from 'lucide-react';
import { ActiveView, User } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  currentUser: User;
  onRoleSwitch: () => void;
}

const navItems = [
  { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'groups' as ActiveView, label: 'Study Groups', icon: Users },
  { id: 'chat' as ActiveView, label: 'Group Chat', icon: MessageSquare },
  { id: 'sessions' as ActiveView, label: 'Sessions', icon: Calendar },
  { id: 'files' as ActiveView, label: 'Shared Files', icon: FolderOpen },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, currentUser, onRoleSwitch }) => {
  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0" style={{ background: '#111827', borderRight: '1px solid #1E2A3A' }}>
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B00)' }}>
          <BookOpen size={18} className="text-black" />
        </div>
        <div>
          <div className="font-display font-bold text-white text-base leading-tight">StudySync</div>
          <div className="text-xs" style={{ color: '#4A5A70' }}>Campus Platform</div>
        </div>
      </div>

      <div className="px-3 mb-2">
        <div className="text-xs font-medium uppercase tracking-widest px-3 mb-2" style={{ color: '#4A5A70' }}>Navigation</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive ? 'rgba(255,184,0,0.12)' : 'transparent',
                color: isActive ? '#FFB800' : '#6B7A8D',
                borderLeft: isActive ? '2px solid #FFB800' : '2px solid transparent',
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          );
        })}

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveView('admin')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: activeView === 'admin' ? 'rgba(0,212,170,0.12)' : 'transparent',
              color: activeView === 'admin' ? '#00D4AA' : '#6B7A8D',
              borderLeft: activeView === 'admin' ? '2px solid #00D4AA' : '2px solid transparent',
            }}
          >
            <Shield size={17} />
            Admin Panel
          </button>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 mt-auto" style={{ borderTop: '1px solid #1E2A3A' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2" style={{ background: '#1E2A3A' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
            style={{ background: currentUser.role === 'admin' ? '#00D4AA' : '#FFB800' }}>
            {currentUser.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
            <div className="text-xs capitalize" style={{ color: currentUser.role === 'admin' ? '#00D4AA' : '#FFB800' }}>
              {currentUser.role}
            </div>
          </div>
        </div>
        <button
          onClick={onRoleSwitch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-200 hover:opacity-80"
          style={{ color: '#4A5A70', background: 'transparent' }}
        >
          <LogOut size={13} />
          Switch to {currentUser.role === 'admin' ? 'Student' : 'Admin'} View
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
