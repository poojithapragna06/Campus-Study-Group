import React from 'react';
import { Users, Calendar, FolderOpen, TrendingUp, Clock, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { studyGroups, sessions, currentUser, messages } from '../data/mockData';
import { ActiveView } from '../types';

interface DashboardProps {
  setActiveView: (v: ActiveView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const myGroups = studyGroups.filter(g => g.members.some(m => m.id === currentUser.id)).slice(0, 3);
  const upcomingSessions = sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);

  const stats = [
    { label: 'Groups Joined', value: '4', icon: Users, color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
    { label: 'Sessions Attended', value: '12', icon: Calendar, color: '#00D4AA', bg: 'rgba(0,212,170,0.1)' },
    { label: 'Files Shared', value: '8', icon: FolderOpen, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    { label: 'Study Hours', value: '34', icon: TrendingUp, color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  ];

  const recentMessages = messages.slice(-3).reverse();

  return (
    <div className="p-8 space-y-8 animate-[slideIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} style={{ color: '#FFB800' }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#FFB800' }}>Good afternoon</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Welcome back, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>
            {currentUser.department} · Year {currentUser.year}
          </p>
        </div>
        <button
          onClick={() => setActiveView('groups')}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
          style={{ background: '#FFB800', color: '#0D0D0D' }}
        >
          <BookOpen size={15} />
          Find Study Groups
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={17} style={{ color }} />
              </div>
              <span className="text-xs" style={{ color: '#4A5A70' }}>This semester</span>
            </div>
            <div className="text-3xl font-display font-bold text-white">{value}</div>
            <div className="text-xs mt-1" style={{ color: '#4A5A70' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* My Groups */}
        <div className="col-span-1 rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-base">My Groups</h2>
            <button onClick={() => setActiveView('groups')} className="text-xs flex items-center gap-1" style={{ color: '#FFB800' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {myGroups.map(group => (
              <div key={group.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:opacity-80"
                style={{ background: '#111827' }}
                onClick={() => setActiveView('groups')}
              >
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: group.coverColor + '30', border: `1.5px solid ${group.coverColor}50` }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: group.coverColor }} />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{group.name}</div>
                  <div className="text-xs" style={{ color: '#4A5A70' }}>{group.members.length} members</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="col-span-1 rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-base">Upcoming Sessions</h2>
            <button onClick={() => setActiveView('sessions')} className="text-xs flex items-center gap-1" style={{ color: '#00D4AA' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingSessions.map(session => {
              const d = new Date(session.date);
              const month = d.toLocaleString('default', { month: 'short' });
              const day = d.getDate();
              return (
                <div key={session.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#111827' }}>
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(0,212,170,0.1)' }}>
                    <span className="text-xs font-medium leading-none" style={{ color: '#00D4AA' }}>{month}</span>
                    <span className="text-base font-bold leading-none text-white">{day}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{session.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} style={{ color: '#4A5A70' }} />
                      <span className="text-xs" style={{ color: '#4A5A70' }}>{session.time} · {session.duration}min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-base">Recent Chat</h2>
            <button onClick={() => setActiveView('chat')} className="text-xs flex items-center gap-1" style={{ color: '#7C3AED' }}>
              Open chat <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {recentMessages.map(msg => (
              <div key={msg.id} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: '#111827' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                  style={{ background: '#FFB800' }}>
                  {msg.senderAvatar}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white">{msg.senderName}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: '#4A5A70' }}>
                    {msg.type === 'file' ? `📎 ${msg.fileName}` : msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
