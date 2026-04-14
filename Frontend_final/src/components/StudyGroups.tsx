import React, { useState } from 'react';
import { Search, Plus, Lock, Users, ChevronRight, Tag, X, BookOpen } from 'lucide-react';
import { currentUser } from '../data/mockData';
import { ActiveView } from '../types';
import { useMyRealGroups, useJoinGroup, useSearchGroups } from '../hooks/useQueries';
import { LoadingGrid, ErrorState, MutationButton } from './ui';
import { RealGroupChat } from '../types';
interface StudyGroupsProps {
  setActiveView: (v: ActiveView) => void;
 setSelectedGroup: (g: RealGroupChat | null) => void;
}

// Fixed color palette by index since backend has no coverColor
const COLORS = ['#FFB800', '#00D4AA', '#7C3AED', '#EF4444', '#F97316', '#10B981'];
const getColor = (index: number) => COLORS[index % COLORS.length];

const StudyGroups: React.FC<StudyGroupsProps> = ({ setActiveView, setSelectedGroup }) => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    subject: '',
    description: '',
    isPrivate: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data: groupsRes, isLoading, isError, refetch } = useMyRealGroups();
  const groupSearch = useSearchGroups(search);

  const groups: any[] = groupsRes?.result ?? [];

  // Use real search results when query >= 2 chars, else show all groups
  const displayGroups: any[] =
    search.length >= 2
      ? (groupSearch.data?.result
          ? Array.isArray(groupSearch.data.result)
            ? groupSearch.data.result
            : [groupSearch.data.result]
          : [])
      : groups;

  const handleCreate = async () => {
    if (!newGroup.name || !newGroup.subject) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await fetch('http://localhost:5000/api/groups/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem('token')}`},
        body: JSON.stringify({
          group_name: newGroup.name,
           subject: newGroup.subject,
           description: newGroup.description,
          requires_permission: newGroup.isPrivate,
        }),
      });
      if (!res.ok) throw new Error('Failed to create group');
      await refetch();
      setShowCreateModal(false);
      setNewGroup({ name: '', subject: '', description: '', isPrivate: false });
    } catch {
      setCreateError('Failed to create group. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="p-8 animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Study Groups</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>
            Find your perfect study partner
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#FFB800', color: '#0D0D0D' }}
        >
          <Plus size={15} /> Create Group
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: '#4A5A70' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups by name…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingGrid count={6} />
      ) : isError ? (
        <ErrorState message="Failed to load study groups." onRetry={() => refetch()} />
      ) : displayGroups.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}
        >
          <BookOpen size={32} style={{ color: '#4A5A70' }} className="mb-3" />
          <p className="text-sm" style={{ color: '#4A5A70' }}>
            {search.length >= 2 ? `No groups found for "${search}"` : 'No groups yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {displayGroups.map((group: any, index: number) => (
            <GroupCard
              key={group._id}
              group={group}
              color={getColor(index)}
              onOpen={() => {
                setSelectedGroup(group as RealGroupChat);
                setActiveView('chat');
              }}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#1A1F2E', border: '1px solid #2A3A50' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="font-display text-xl font-bold text-white"
              >
                Create Study Group
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: '#4A5A70' }}>
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div
                className="mb-4 px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
              >
                {createError}
              </div>
            )}

            <div className="space-y-4">
              {[
                { label: 'Group Name', key: 'name', placeholder: 'e.g. Algorithms Study Circle' },
                { label: 'Subject', key: 'subject', placeholder: 'e.g. Computer Science' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: '#6B7A8D' }}
                  >
                    {label}
                  </label>
                  <input
                    value={(newGroup as any)[key]}
                    onChange={e => setNewGroup(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }}
                  />
                </div>
              ))}

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: '#6B7A8D' }}
                >
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
                  placeholder="What will your group focus on?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }}
                />
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#111827' }}
              >
                <div>
                  <div className="text-sm font-medium text-white">Private Group</div>
                  <div className="text-xs" style={{ color: '#4A5A70' }}>
                    Requires approval to join
                  </div>
                </div>
                <button
                  onClick={() => setNewGroup(p => ({ ...p, isPrivate: !p.isPrivate }))}
                  className="w-10 h-5 rounded-full transition-all duration-200 relative"
                  style={{ background: newGroup.isPrivate ? '#FFB800' : '#2A3A50' }}
                >
                  <span
                    className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200"
                    style={{ left: newGroup.isPrivate ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#1E2A3A', color: '#6B7A8D' }}
              >
                Cancel
              </button>
              <MutationButton
                isPending={createLoading}
                label="Create Group"
                pendingLabel="Creating…"
                onClick={handleCreate}
                disabled={!newGroup.name || !newGroup.subject}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: '#FFB800',
                  color: '#0D0D0D',
                  opacity: !newGroup.name || !newGroup.subject ? 0.5 : 1,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── GroupCard ────────────────────────────────────────────────────────────────

const GroupCard: React.FC<{ group: any; color: string; onOpen: () => void }> = ({
  group,
  color,
  onOpen,
}) => {
  const joinGroup = useJoinGroup();

  // Backend stores member IDs as strings in group_members array
  const isJoined: boolean = Array.isArray(group.group_members)
    ? group.group_members.includes(currentUser.id)
    : false;

  const memberCount: number = group.group_members?.length ?? 0;
  const isPrivate: boolean = group.requires_permission === true;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}
    >
      {/* Card header strip */}
      <div
        className="h-20 relative"
        style={{
          background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        }}
      >
        <div className="absolute inset-0 flex items-center px-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: color + '30', border: `1.5px solid ${color}60` }}
          >
            <BookOpen size={18} style={{ color }} />
          </div>
          {isPrivate && (
            <div
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{ background: 'rgba(0,0,0,0.4)', color: '#9CA3AF' }}
            >
              <Lock size={10} /> Private
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        {/* group_name from backend */}
        <h3 className="font-display font-semibold text-white mb-1 leading-tight">
          {group.group_name}
        </h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: '#4A5A70' }}>
          {group.group_description ?? 'No description provided.'}
        </p>

        {/* member count */}
        <div className="flex items-center gap-1.5 mb-4">
          <Users size={12} style={{ color: '#4A5A70' }} />
          <span className="text-xs" style={{ color: '#4A5A70' }}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => joinGroup.mutate(group._id)}
            disabled={joinGroup.isPending || isJoined}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: isJoined ? 'rgba(255,184,0,0.1)' : '#FFB800',
              color: isJoined ? '#FFB800' : '#0D0D0D',
              border: isJoined ? '1px solid #FFB800' : 'none',
              opacity: joinGroup.isPending ? 0.7 : 1,
            }}
          >
            {joinGroup.isPending ? 'Joining...' : isJoined ? 'Joined \u2713' : 'Join Group'}
          </button>
          <button
            onClick={onOpen}
            className="flex items-center justify-center w-9 h-8 rounded-xl"
            style={{ background: '#1E2A3A', color: '#6B7A8D', border: '1px solid #2A3A50' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
