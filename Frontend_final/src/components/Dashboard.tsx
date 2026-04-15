import React from 'react';
import { Users, Calendar, TrendingUp, Clock, BookOpen, ChevronRight, Zap, MessageSquare } from 'lucide-react';
import { ActiveView } from '../types';
import { useMyRealGroups, useRealSessions } from '../hooks/useQueries';
import { Skeleton } from './ui';

interface DashboardProps {
  setActiveView: (v: ActiveView) => void;
}

function getTokenUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { name: 'User', department: '', year: '' };
    const p = JSON.parse(atob(token.split('.')[1]));
    return {
      name: p.username || p.name || 'User',
      department: p.department || '',
      year: p.year || '',
    };
  } catch { return { name: 'User', department: '', year: '' }; }
}

const COLORS = ['#FFB800', '#00D4AA', '#7C3AED', '#EF4444', '#F97316', '#10B981'];

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const currentUser = getTokenUser();
  const groupsQuery = useMyRealGroups();
  const sessionsQuery = useRealSessions();

  const myGroups = (groupsQuery.data?.result ?? []).slice(0, 3);
  const upcomingSessions = [...(sessionsQuery.data?.sessions ?? sessionsQuery.data?.result ?? [])]
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const totalGroups = groupsQuery.data?.result?.length ?? 0;
  const totalSessions = (sessionsQuery.data?.sessions ?? sessionsQuery.data?.result ?? []).length;

  const stats = [
    { label: 'Groups Joined',     value: groupsQuery.isLoading  ? '…' : totalGroups,   icon: Users,         color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
    { label: 'Sessions',          value: sessionsQuery.isLoading ? '…' : totalSessions, icon: Calendar,      color: '#00D4AA', bg: 'rgba(0,212,170,0.1)' },
    { label: 'Study Hours',       value: totalSessions * 2,                              icon: TrendingUp,    color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
    { label: 'Messages',          value: '—',                                            icon: MessageSquare, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  ];

  return (
    <div className="p-8 space-y-8 animate-[slideIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} style={{ color: '#FFB800' }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#FFB800' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Welcome back, {currentUser.name.split(' ')[0]} 👋
          </h1>
          {currentUser.department && (
            <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>
              {currentUser.department}{currentUser.year ? ` · Year ${currentUser.year}` : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => setActiveView('groups')}
          className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ background: '#FFB800', color: '#0D0D0D' }}
        >
          <BookOpen size={15} /> Find Study Groups
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

      <div className="grid grid-cols-2 gap-6">
        {/* My Groups */}
        <div className="rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-base">My Groups</h2>
            <button onClick={() => setActiveView('groups')} className="text-xs flex items-center gap-1" style={{ color: '#FFB800' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {groupsQuery.isLoading ? (
            <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : myGroups.length === 0 ? (
            <div className="py-8 text-center">
              <Users size={28} className="mx-auto mb-2" style={{ color: '#2A3A50' }} />
              <p className="text-xs" style={{ color: '#4A5A70' }}>No groups yet. Join one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myGroups.map((group: any, idx: number) => (
                <div key={group._id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: '#111827' }}
                  onClick={() => setActiveView('chat')}
                >
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-black"
                    style={{ background: COLORS[idx % COLORS.length] }}>
                    {group.group_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{group.group_name}</div>
                    <div className="text-xs" style={{ color: '#4A5A70' }}>{group.group_members?.length ?? 0} members</div>
                  </div>
                  {group.requires_permission && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>Private</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-base">Upcoming Sessions</h2>
            <button onClick={() => setActiveView('sessions')} className="text-xs flex items-center gap-1" style={{ color: '#00D4AA' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {sessionsQuery.isLoading ? (
            <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : upcomingSessions.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar size={28} className="mx-auto mb-2" style={{ color: '#2A3A50' }} />
              <p className="text-xs" style={{ color: '#4A5A70' }}>No upcoming sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session: any) => {
                const d = new Date(session.date || session.scheduled_at || Date.now());
                return (
                  <div key={session._id ?? session.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#111827' }}>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,212,170,0.1)' }}>
                      <span className="text-xs font-medium leading-none" style={{ color: '#00D4AA' }}>
                        {d.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-base font-bold leading-none text-white">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{session.title ?? session.name ?? 'Session'}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} style={{ color: '#4A5A70' }} />
                        <span className="text-xs" style={{ color: '#4A5A70' }}>
                          {session.time ?? ''}{session.duration ? ` · ${session.duration}min` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
