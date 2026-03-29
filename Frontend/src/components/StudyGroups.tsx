import React, { useState } from 'react';
import { Search, Plus, Lock, Users, ChevronRight, Tag, X, BookOpen } from 'lucide-react';
import { studyGroups } from '../data/mockData';
import { StudyGroup } from '../types';
import { ActiveView } from '../types';

interface StudyGroupsProps {
  setActiveView: (v: ActiveView) => void;
  setSelectedGroup: (g: StudyGroup) => void;
}

const StudyGroups: React.FC<StudyGroupsProps> = ({ setActiveView, setSelectedGroup }) => {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', subject: '', description: '', isPrivate: false, maxMembers: 8 });

  const subjects = ['All', ...Array.from(new Set(studyGroups.map(g => g.subject)))];
  const filtered = studyGroups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.subject.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'All' || g.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="p-8 animate-[slideIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Study Groups</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>Find your perfect study partner</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: '#FFB800', color: '#0D0D0D' }}
        >
          <Plus size={15} />
          Create Group
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups, subjects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }}
          />
        </div>
        <div className="flex gap-2">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: filterSubject === s ? '#FFB800' : '#1E2A3A',
                color: filterSubject === s ? '#0D0D0D' : '#6B7A8D',
                border: '1px solid ' + (filterSubject === s ? '#FFB800' : '#2A3A50')
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-3 gap-5">
        {filtered.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onOpen={() => { setSelectedGroup(group); setActiveView('chat'); }}
          />
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1A1F2E', border: '1px solid #2A3A50' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Create Study Group</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: '#4A5A70' }}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Group Name', key: 'name', placeholder: 'e.g. Algorithms Study Circle' },
                { label: 'Subject', key: 'subject', placeholder: 'e.g. Computer Science' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>{label}</label>
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
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
                  placeholder="What will your group focus on?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#111827' }}>
                <div>
                  <div className="text-sm font-medium text-white">Private Group</div>
                  <div className="text-xs" style={{ color: '#4A5A70' }}>Requires approval to join</div>
                </div>
                <button
                  onClick={() => setNewGroup(p => ({ ...p, isPrivate: !p.isPrivate }))}
                  className="w-10 h-5 rounded-full transition-all duration-200 relative"
                  style={{ background: newGroup.isPrivate ? '#FFB800' : '#2A3A50' }}
                >
                  <span className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200"
                    style={{ left: newGroup.isPrivate ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#1E2A3A', color: '#6B7A8D' }}>
                Cancel
              </button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#FFB800', color: '#0D0D0D' }}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GroupCard: React.FC<{ group: StudyGroup; onOpen: () => void }> = ({ group, onOpen }) => {
  const [joined, setJoined] = useState(group.members.some(m => m.id === 'u1'));

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
      {/* Card Header */}
      <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${group.coverColor}30, ${group.coverColor}10)` }}>
        <div className="absolute inset-0 flex items-center px-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: group.coverColor + '30', border: `1.5px solid ${group.coverColor}60` }}>
            <BookOpen size={18} style={{ color: group.coverColor }} />
          </div>
          {group.isPrivate && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.4)', color: '#9CA3AF' }}>
              <Lock size={10} /> Private
            </div>
          )}
          {group.status === 'archived' && (
            <div className="ml-auto px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.4)', color: '#9CA3AF' }}>Archived</div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-white mb-1 leading-tight">{group.name}</h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: '#4A5A70' }}>{group.description}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {group.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs" style={{ background: group.coverColor + '15', color: group.coverColor }}>
              <Tag size={9} />{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {group.members.slice(0, 4).map(m => (
                <div key={m.id} className="w-6 h-6 rounded-lg border border-[#1A1F2E] flex items-center justify-center text-xs font-bold text-black"
                  style={{ background: '#FFB800', fontSize: '8px' }}>
                  {m.avatar}
                </div>
              ))}
            </div>
            <span className="text-xs" style={{ color: '#4A5A70' }}>
              {group.members.length}/{group.maxMembers}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#4A5A70' }}>
            <Users size={11} />
            {group.maxMembers - group.members.length} spots left
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setJoined(!joined)}
            disabled={group.status === 'archived'}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              background: joined ? 'rgba(255,184,0,0.1)' : '#FFB800',
              color: joined ? '#FFB800' : '#0D0D0D',
              border: joined ? '1px solid #FFB800' : 'none',
              opacity: group.status === 'archived' ? 0.5 : 1,
            }}
          >
            {joined ? 'Joined ✓' : 'Join Group'}
          </button>
          <button
            onClick={onOpen}
            className="flex items-center justify-center w-9 h-8 rounded-xl transition-all duration-200"
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
