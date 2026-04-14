import React, { useState } from 'react';
import {
  Shield, Users, BookOpen, MessageSquare, FolderOpen,
  AlertTriangle, Trash2, Ban, CheckCircle, TrendingUp, Activity, Eye,
} from 'lucide-react';
import { messages, sharedFiles } from '../data/mockData';
import { useAdminGroups, useUsers, useDeleteUser } from '../hooks/useQueries';
import { LoadingSpinner, ErrorState } from './ui';

type Tab = 'overview' | 'groups' | 'users' | 'content';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const groupsQuery = useAdminGroups();
  const usersQuery  = useUsers();
  const deleteUser  = useDeleteUser();

  // Backend returns { status, result: GroupChat[] }
  // GroupChat fields: _id, group_name, group_members[], group_admins[], requires_permission
  const groups: any[] = groupsQuery.data?.result ?? [];

  // useUsers still hits mock — swap for real endpoint when available
  const users: any[] = usersQuery.data ?? [];

  const stats = [
    { label: 'Total Users',   value: users.length,   icon: Users,        color: '#FFB800', delta: '+12%' },
    { label: 'Active Groups', value: groups.length,  icon: BookOpen,     color: '#00D4AA', delta: '+3%'  },
    { label: 'Messages Today',value: messages.length, icon: MessageSquare,color: '#7C3AED', delta: '+28%' },
    { label: 'Files Shared',  value: sharedFiles.length, icon: FolderOpen, color: '#F97316', delta: '+7%' },
  ];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview',       icon: Activity  },
    { id: 'groups',   label: 'Groups',         icon: BookOpen  },
    { id: 'users',    label: 'Users',          icon: Users     },
    { id: 'content',  label: 'Content Review', icon: Eye       },
  ];

  // Fixed colors for groups (backend has no coverColor)
  const COLORS = ['#FFB800', '#00D4AA', '#7C3AED', '#EF4444', '#F97316'];
  const getColor = (i: number) => COLORS[i % COLORS.length];

  return (
    <div className="p-8 animate-[slideIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,212,170,0.15)' }}
        >
          <Shield size={20} style={{ color: '#00D4AA' }} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm" style={{ color: '#4A5A70' }}>Platform management & moderation</p>
        </div>
        <div
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA' }}
        >
          <CheckCircle size={12} /> System Healthy
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, delta }) => (
          <div key={label} className="p-5 rounded-2xl" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: color + '15' }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA' }}
              >
                {delta}
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-white">{value}</div>
            <div className="text-xs mt-1" style={{ color: '#4A5A70' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#111827' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === id ? '#1E2A3A' : 'transparent',
              color:      activeTab === id ? '#E8EDF4'  : '#4A5A70',
            }}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Group activity */}
          <div className="rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={15} style={{ color: '#FFB800' }} /> Group Activity
            </h3>
            {groupsQuery.isLoading ? (
              <LoadingSpinner label="Loading groups…" />
            ) : groupsQuery.isError ? (
              <ErrorState message="Failed to load." onRetry={() => groupsQuery.refetch()} />
            ) : (
              <div className="space-y-3">
                {groups.slice(0, 5).map((g: any, i: number) => {
                  const color = getColor(i);
                  const memberCount: number = g.group_members?.length ?? 0;
                  // cap bar at 100% using memberCount * 10 (adjust multiplier as needed)
                  const barWidth = Math.min(memberCount * 10, 100);
                  return (
                    <div key={g._id} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ background: color + '30' }}
                      >
                        <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {g.group_name}
                        </div>
                        <div
                          className="h-1.5 rounded-full mt-1 overflow-hidden"
                          style={{ background: '#2A3A50' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${barWidth}%`, background: color }}
                          />
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: '#4A5A70' }}>
                        {memberCount} members
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reports — static placeholder */}
          <div className="rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={15} style={{ color: '#F97316' }} /> Recent Reports
            </h3>
            <div className="space-y-3">
              {[
                { type: 'Spam',                  group: 'Algorithms & DS', time: '2h ago',  severity: 'low'    },
                { type: 'Inappropriate Content', group: 'Calculus III',    time: '5h ago',  severity: 'medium' },
                { type: 'Off-topic Discussion',  group: 'Quantum Physics', time: '1d ago',  severity: 'low'    },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#111827' }}>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: r.severity === 'medium' ? '#F97316' : '#FFB800' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white">{r.type}</div>
                    <div className="text-xs" style={{ color: '#4A5A70' }}>
                      in {r.group} · {r.time}
                    </div>
                  </div>
                  <button
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Groups tab ────────────────────────────────────────────────────── */}
      {activeTab === 'groups' && (
        groupsQuery.isLoading ? (
          <LoadingSpinner label="Loading groups…" />
        ) : groupsQuery.isError ? (
          <ErrorState message="Failed to load groups." onRetry={() => groupsQuery.refetch()} />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E2A3A' }}>
            <div
              className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider"
              style={{ background: '#111827', color: '#4A5A70' }}
            >
              <div className="col-span-5">Group</div>
              <div className="col-span-3">Members</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Actions</div>
            </div>
            {groups.map((group: any, i: number) => {
              const color = getColor(i);
              const memberCount: number = group.group_members?.length ?? 0;
              const isPrivate: boolean  = group.requires_permission === true;
              return (
                <div
                  key={group._id}
                  className="grid grid-cols-12 gap-4 items-center px-5 py-4"
                  style={{
                    background:  i % 2 === 0 ? '#1A1F2E' : '#161D2A',
                    borderTop: '1px solid #1E2A3A',
                  }}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0"
                      style={{ background: color + '30' }}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {group.group_name}
                    </span>
                  </div>
                  <div className="col-span-3 text-sm" style={{ color: '#6B7A8D' }}>
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </div>
                  <div className="col-span-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-xs"
                      style={{
                        background: isPrivate
                          ? 'rgba(249,115,22,0.1)'
                          : 'rgba(0,212,170,0.1)',
                        color: isPrivate ? '#F97316' : '#00D4AA',
                      }}
                    >
                      {isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  {/* No delete/archive endpoints in your backend — show disabled placeholder */}
                  <div className="col-span-2 flex gap-2">
                    <button
                      disabled
                      title="Not available"
                      className="p-1.5 rounded-lg opacity-30 cursor-not-allowed"
                      style={{ background: '#1E2A3A', color: '#FFB800' }}
                    >
                      <Ban size={12} />
                    </button>
                    <button
                      disabled
                      title="Not available"
                      className="p-1.5 rounded-lg opacity-30 cursor-not-allowed"
                      style={{ background: '#1E2A3A', color: '#EF4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Users tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        usersQuery.isLoading ? (
          <LoadingSpinner label="Loading users…" />
        ) : usersQuery.isError ? (
          <ErrorState message="Failed to load users." onRetry={() => usersQuery.refetch()} />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E2A3A' }}>
            <div
              className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider"
              style={{ background: '#111827', color: '#4A5A70' }}
            >
              <div className="col-span-3">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Department</div>
              <div className="col-span-2">Groups</div>
              <div className="col-span-2">Actions</div>
            </div>
            {users.map((user: any, i: number) => (
              <div
                key={user.id ?? user.userID ?? i}
                className="grid grid-cols-12 gap-4 items-center px-5 py-4"
                style={{
                  background:  i % 2 === 0 ? '#1A1F2E' : '#161D2A',
                  borderTop: '1px solid #1E2A3A',
                }}
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black"
                    style={{ background: '#FFB800' }}
                  >
                    {(user.name ?? user.username ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {user.name ?? user.username}
                  </span>
                </div>
                <div className="col-span-3 text-sm truncate" style={{ color: '#6B7A8D' }}>
                  {user.email ?? '—'}
                </div>
                <div className="col-span-2 text-sm" style={{ color: '#6B7A8D' }}>
                  {user.department ?? '—'}
                </div>
                <div className="col-span-2 text-sm text-white">
                  {user.groupsJoined ?? '—'}
                </div>
                <div className="col-span-2 flex gap-2">
                  <button
                    className="p-1.5 rounded-lg"
                    style={{ background: '#1E2A3A', color: '#FFB800' }}
                  >
                    <Ban size={12} />
                  </button>
                  <button
                    onClick={() => deleteUser.mutate(user.id ?? user.userID)}
                    disabled={deleteUser.isPending}
                    className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: '#1E2A3A', color: '#EF4444' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Content Review tab ────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="rounded-2xl p-5" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
          <h3 className="font-display font-semibold text-white mb-4">Flagged Messages</h3>
          <div className="space-y-3">
            {messages.slice(0, 4).map((msg: any) => (
              <div
                key={msg.id}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: '#111827' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                  style={{ background: '#FFB800' }}
                >
                  {msg.senderAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{msg.senderName}</span>
                    <span className="text-xs" style={{ color: '#4A5A70' }}>
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md text-xs"
                      style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}
                    >
                      Flagged
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#6B7A8D' }}>
                    {msg.type === 'file' ? `Shared file: ${msg.fileName}` : msg.content}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA' }}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
