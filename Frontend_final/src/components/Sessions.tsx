import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, X, Video, Trash2 } from 'lucide-react';
import {
  useRealSessions,
  useCreateRealSession,
  useRsvpRealSession,
  useDeleteRealSession,
  useMyRealGroups,
} from '../hooks/useQueries';
import { LoadingRows, ErrorState, MutationButton } from './ui';

// Helpers to get current userId from JWT
function getCurrentUserId(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.Uid);
  } catch {
    return '';
  }
}

interface RealSession {
  _id: string;
  title: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  isOnline: boolean;
  description: string;
  attendees: string[];
  maxAttendees: number;
}

interface RealGroup {
  _id: string;
  group_name: string;
  group_members: string[];
  group_admins: string[];
}

const SESSION_COLORS = ['#FFB800', '#00D4AA', '#7C3AED', '#EF4444', '#F97316', '#10B981', '#3B82F6'];

const Sessions: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', groupId: '', date: '', time: '', duration: 60,
    location: '', isOnline: false, description: '', maxAttendees: 20,
  });

  const currentUserId = getCurrentUserId();

  // Fetch real data
  const { data: sessionsRes, isLoading, isError, refetch } = useRealSessions();
  const { data: groupsRes } = useMyRealGroups();
  const createSession = useCreateRealSession();
  const rsvpSession = useRsvpRealSession();
  const deleteSession = useDeleteRealSession();

  const sessions: RealSession[] = sessionsRes?.sessions ?? [];
  const myGroups: RealGroup[] = groupsRes?.result ?? [];

  // Sort and categorize
  const now = new Date();
  const sorted = [...sessions].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`);
    const db = new Date(`${b.date}T${b.time}`);
    return da.getTime() - db.getTime();
  });
  const upcoming = sorted.filter(s => new Date(`${s.date}T${s.time}`) >= now);
  const past = sorted.filter(s => new Date(`${s.date}T${s.time}`) < now);

  const getGroupName = (id: string) => myGroups.find(g => g._id === id)?.group_name ?? 'Unknown Group';
  const getGroupColor = (id: string) => {
    const idx = myGroups.findIndex(g => g._id === id);
    return SESSION_COLORS[Math.abs(idx) % SESSION_COLORS.length];
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.groupId || !form.date || !form.time) return;
    createSession.mutate(
      {
        title: form.title.trim(),
        groupId: form.groupId,
        date: form.date,
        time: form.time,
        duration: form.duration,
        location: form.location,
        isOnline: form.isOnline,
        description: form.description,
        maxAttendees: form.maxAttendees,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ title: '', groupId: '', date: '', time: '', duration: 60, location: '', isOnline: false, description: '', maxAttendees: 20 });
        },
      }
    );
  };

  const handleRsvp = (sessionId: string) => {
    rsvpSession.mutate(sessionId);
  };

  const handleDelete = (sessionId: string) => {
    deleteSession.mutate(sessionId);
  };

  return (
    <div className="p-8 animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-3xl text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Study Sessions</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>Schedule and manage your sessions</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90"
          style={{ background: '#00D4AA', color: '#0D0D0D' }}>
          <Plus size={15} /> Schedule Session
        </button>
      </div>

      {isLoading ? (
        <LoadingRows count={4} />
      ) : isError ? (
        <ErrorState message="Failed to load sessions." onRetry={() => refetch()} />
      ) : (
        <>
          {/* Upcoming */}
          <div className="mb-8">
            <h2 className="font-semibold text-white text-lg mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Upcoming Sessions
            </h2>
            {upcoming.length === 0 ? (
              <div className="p-8 text-center rounded-2xl" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                <Calendar size={28} className="mx-auto mb-3" style={{ color: '#2A3A50' }} />
                <p style={{ color: '#4A5A70' }}>No upcoming sessions. Schedule one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(s => (
                  <SessionCard key={s._id} session={s} currentUserId={currentUserId}
                    getGroupName={getGroupName} getGroupColor={getGroupColor}
                    onRsvp={() => handleRsvp(s._id)}
                    onDelete={() => handleDelete(s._id)}
                    rsvpPending={rsvpSession.isPending && rsvpSession.variables === s._id}
                    deletePending={deleteSession.isPending && deleteSession.variables === s._id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4" style={{ color: '#4A5A70', fontFamily: "'DM Sans', sans-serif" }}>Past Sessions</h2>
              <div className="space-y-3 opacity-60">
                {past.map(s => (
                  <SessionCard key={s._id} session={s} currentUserId={currentUserId}
                    getGroupName={getGroupName} getGroupColor={getGroupColor} past />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Create Session Modal ──────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#1A1F2E', border: '1px solid #2A3A50' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Schedule Session</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: '#4A5A70' }}><X size={18} /></button>
            </div>

            {createSession.isError && (
              <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                Failed to schedule session. Please try again.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>SESSION TITLE</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Midterm Review Session"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>STUDY GROUP</label>
                <select value={form.groupId} onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }}>
                  <option value="">Select a group</option>
                  {myGroups.map(g => <option key={g._id} value={g._id}>{g.group_name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>DATE</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>TIME</label>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>DURATION (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>MAX ATTENDEES</label>
                  <input type="number" value={form.maxAttendees} onChange={e => setForm(p => ({ ...p, maxAttendees: +e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#111827' }}>
                <span className="text-sm font-medium text-white">Online Session</span>
                <button onClick={() => setForm(p => ({ ...p, isOnline: !p.isOnline }))}
                  className="w-10 h-5 rounded-full transition-all duration-200 relative"
                  style={{ background: form.isOnline ? '#00D4AA' : '#2A3A50' }}>
                  <span className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200"
                    style={{ left: form.isOnline ? '22px' : '2px' }} />
                </button>
              </div>

              {!form.isOnline && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>LOCATION</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Library Room 3B"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>DESCRIPTION (optional)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What will you cover?"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#1E2A3A', color: '#6B7A8D' }}>Cancel</button>
              <MutationButton isPending={createSession.isPending} label="Schedule" pendingLabel="Scheduling…"
                onClick={handleCreate}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: '#00D4AA', color: '#0D0D0D',
                  opacity: (!form.title.trim() || !form.groupId || !form.date || !form.time || createSession.isPending) ? 0.5 : 1,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────
interface SessionCardProps {
  session: RealSession;
  currentUserId: string;
  getGroupName: (id: string) => string;
  getGroupColor: (id: string) => string;
  onRsvp?: () => void;
  onDelete?: () => void;
  rsvpPending?: boolean;
  deletePending?: boolean;
  past?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session, currentUserId, getGroupName, getGroupColor, onRsvp, onDelete, rsvpPending, deletePending, past,
}) => {
  const isRsvpd = session.attendees.includes(currentUserId);
  const isCreator = session.createdBy === currentUserId;
  const color = getGroupColor(session.groupId);

  let d: Date;
  try {
    d = new Date(`${session.date}T${session.time}`);
  } catch {
    d = new Date(session.date);
  }

  const displayGroupName = session.groupName || getGroupName(session.groupId);

  return (
    <div className="flex items-center gap-5 p-5 rounded-2xl" style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
      {/* Date badge */}
      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: color + '15', border: `1.5px solid ${color}40` }}>
        <span className="text-xs font-medium" style={{ color }}>
          {d.toLocaleString('default', { month: 'short' })}
        </span>
        <span className="text-2xl font-bold text-white leading-none">{d.getDate()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>{session.title}</span>
          <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: color + '20', color }}>{displayGroupName}</span>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: '#4A5A70' }}>
          <span className="flex items-center gap-1"><Clock size={11} />{session.time} · {session.duration}min</span>
          <span className="flex items-center gap-1">
            {session.isOnline ? <><Video size={11} /> Online</> : <><MapPin size={11} />{session.location || 'TBD'}</>}
          </span>
          <span className="flex items-center gap-1"><Users size={11} />{session.attendees.length}/{session.maxAttendees}</span>
        </div>
        {session.description && (
          <div className="text-xs mt-1.5 truncate" style={{ color: '#4A5A70' }}>{session.description}</div>
        )}
      </div>

      {/* Actions */}
      {!past && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <MutationButton
            isPending={!!rsvpPending}
            label={isRsvpd ? 'RSVPed ✓' : 'RSVP'}
            pendingLabel="..."
            onClick={onRsvp}
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{
              background: isRsvpd ? 'rgba(0,212,170,0.1)' : '#00D4AA',
              color: isRsvpd ? '#00D4AA' : '#0D0D0D',
              border: isRsvpd ? '1px solid #00D4AA' : 'none',
            }}
          />
          {isCreator && (
            <button
              onClick={onDelete}
              disabled={deletePending}
              title="Delete session"
              className="p-2 rounded-xl hover:opacity-75 transition-opacity"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171', opacity: deletePending ? 0.5 : 1 }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Sessions;
