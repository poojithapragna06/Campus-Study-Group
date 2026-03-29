import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Wifi, Users, Plus, X, Video } from 'lucide-react';
import { sessions as initialSessions, studyGroups, currentUser } from '../data/mockData';
import { StudySession } from '../types';

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>(initialSessions);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', groupId: '', date: '', time: '', duration: 60, location: '', isOnline: false, description: '' });

  const myGroups = studyGroups.filter(g => g.members.some(m => m.id === currentUser.id));
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcoming = sorted.filter(s => new Date(s.date) >= new Date());
  const past = sorted.filter(s => new Date(s.date) < new Date());

  const getGroupName = (id: string) => studyGroups.find(g => g.id === id)?.name || 'Unknown';
  const getGroupColor = (id: string) => studyGroups.find(g => g.id === id)?.coverColor || '#FFB800';

  const handleCreate = () => {
    const newSession: StudySession = {
      id: 's' + Date.now(), ...form, attendees: [currentUser.id], maxAttendees: 10,
    };
    setSessions(p => [...p, newSession]);
    setShowCreate(false);
    setForm({ title: '', groupId: '', date: '', time: '', duration: 60, location: '', isOnline: false, description: '' });
  };

  return (
    <div className="p-8 animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Study Sessions</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>Schedule and manage your sessions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#00D4AA', color: '#0D0D0D' }}>
          <Plus size={15} /> Schedule Session
        </button>
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-white text-lg mb-4">Upcoming Sessions</h2>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="p-8 text-center rounded-2xl" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
              <p style={{ color: '#4A5A70' }}>No upcoming sessions. Schedule one!</p>
            </div>
          ) : upcoming.map(session => <SessionCard key={session.id} session={session} getGroupName={getGroupName} getGroupColor={getGroupColor} />)}
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="font-display font-semibold mb-4" style={{ color: '#4A5A70' }}>Past Sessions</h2>
          <div className="space-y-3 opacity-60">
            {past.map(session => <SessionCard key={session.id} session={session} getGroupName={getGroupName} getGroupColor={getGroupColor} past />)}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#1A1F2E', border: '1px solid #2A3A50' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Schedule Session</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: '#4A5A70' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Session Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Midterm Review Session"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Study Group</label>
                <select value={form.groupId} onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }}>
                  <option value="">Select a group</option>
                  {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Duration (minutes)</label>
                <input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#111827' }}>
                <span className="text-sm font-medium text-white">Online Session</span>
                <button onClick={() => setForm(p => ({ ...p, isOnline: !p.isOnline }))}
                  className="w-10 h-5 rounded-full transition-all duration-200 relative" style={{ background: form.isOnline ? '#00D4AA' : '#2A3A50' }}>
                  <span className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200" style={{ left: form.isOnline ? '22px' : '2px' }} />
                </button>
              </div>
              {!form.isOnline && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>Location</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Library Room 3B"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#1E2A3A', color: '#6B7A8D' }}>Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#00D4AA', color: '#0D0D0D' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SessionCard: React.FC<{ session: StudySession; getGroupName: (id: string) => string; getGroupColor: (id: string) => string; past?: boolean }> = ({ session, getGroupName, getGroupColor, past }) => {
  const [rsvp, setRsvp] = useState(session.attendees.includes('u1'));
  const d = new Date(session.date);
  const color = getGroupColor(session.groupId);

  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl transition-all duration-200" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
      {/* Date Block */}
      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: color + '15', border: `1.5px solid ${color}40` }}>
        <span className="text-xs font-medium" style={{ color }}>{d.toLocaleString('default', { month: 'short' })}</span>
        <span className="text-2xl font-display font-bold text-white leading-none">{d.getDate()}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-white">{session.title}</span>
          <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: color + '20', color }}>{getGroupName(session.groupId)}</span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: '#4A5A70' }}>
          <span className="flex items-center gap-1"><Clock size={11} />{session.time} · {session.duration}min</span>
          <span className="flex items-center gap-1">
            {session.isOnline ? <><Video size={11} /> Online</> : <><MapPin size={11} />{session.location}</>}
          </span>
          <span className="flex items-center gap-1"><Users size={11} />{session.attendees.length}/{session.maxAttendees} attending</span>
        </div>
      </div>

      {!past && (
        <button onClick={() => setRsvp(!rsvp)} className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex-shrink-0"
          style={{ background: rsvp ? 'rgba(0,212,170,0.1)' : '#00D4AA', color: rsvp ? '#00D4AA' : '#0D0D0D', border: rsvp ? '1px solid #00D4AA' : 'none' }}>
          {rsvp ? 'RSVP\'d ✓' : 'RSVP'}
        </button>
      )}
    </div>
  );
};

export default Sessions;
