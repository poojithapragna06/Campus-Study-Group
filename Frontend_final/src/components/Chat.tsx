import  { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Paperclip, Search, Users, Lock, BookOpen,
  RefreshCw, LogOut, ShieldCheck, Trash2, Plus, X, UserPlus,
} from 'lucide-react';
import { useMyRealGroups, useRealGroupChat, useJoinRequests, useAcceptJoinRequest } from '../hooks/useQueries';
import { useCreateRealGroup, useDeleteRealGroup } from '../hooks/useQueries';
import { Skeleton } from './ui';
import { format } from 'date-fns';

// Get current user ID from JWT token
function getCurrentUserId(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.Uid);
  } catch { return ''; }
}

// ─── Types matching MongoDB GroupChat model ───────────────────────────────────
interface RealGroup {
  _id: string;
  group_name: string;
  group_members: string[];  // array of userId strings
  group_admins: string[];
  requires_permission: boolean;
}

interface RealMessage {
  _id?: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'file';
  fileName?: string;
}

const COLORS = ['#FFB800', '#00D4AA', '#7C3AED', '#EF4444', '#F97316', '#10B981'];
const getColor = (i: number) => COLORS[i % COLORS.length];

// ─── Inline Toast ─────────────────────────────────────────────────────────────
interface ToastState { message: string; type: 'success' | 'error' | 'info' }
const Toast: React.FC<{ toast: ToastState | null }> = ({ toast }) => {
  if (!toast) return null;
  const s = {
    success: { bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.3)', color: '#00D4AA' },
    error:   { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#F87171' },
    info:    { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.3)', color: '#FFB800' },
  }[toast.type];
  return (
    <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, minWidth: 240 }}>
      {toast.message}
    </div>
  );
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
interface ChatProps {
  selectedGroup: RealGroup | null;
  setSelectedGroup: (g: RealGroup | null) => void;
}

const Chat: React.FC<ChatProps> = ({ selectedGroup, setSelectedGroup }) => {
  const [input, setInput]                   = useState('');
  const [sending, setSending]               = useState(false);
  const [sidebarSearch, setSidebarSearch]   = useState('');
  const [toast, setToast]                   = useState<ToastState | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName]     = useState('');
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentUserId = getCurrentUserId();

  const { data: groupsRes, refetch: refetchGroups } = useMyRealGroups();
  const allGroups: RealGroup[] = groupsRes?.result ?? [];

  const filteredSidebar = sidebarSearch.length >= 1
    ? allGroups.filter(g => g.group_name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : allGroups;

  const activeGroup: RealGroup | null = selectedGroup ?? allGroups[0] ?? null;
  const activeIndex  = allGroups.findIndex(g => g._id === activeGroup?._id);
  const activeColor  = getColor(activeIndex >= 0 ? activeIndex : 0);
  const isAdmin      = activeGroup?.group_admins?.includes(currentUserId) ?? false;

  // GET /api/groups/chat { group_id } → { result: Message[], status: 'ok' }
  const {
    data: chatRes,
    isLoading: msgsLoading,
    isFetching,
    refetch: refetchChat,
  } = useRealGroupChat(activeGroup?._id ?? '');
  const msgs: RealMessage[] = useMemo(() => chatRes?.result ?? [], [chatRes]);

  const createGroup = useCreateRealGroup();
  const deleteGroup = useDeleteRealGroup();
  const acceptJoinReq = useAcceptJoinRequest();

  const reqQuery = useJoinRequests(isAdmin ? activeGroup._id : '');
  const joinRequests = reqQuery.data?.result ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  // Your controller has no HTTP send endpoint — messages go via socket.
  // Replace '/api/groups/message' with your actual endpoint when ready.
  const handleSend = async () => {
    if (!input.trim() || !activeGroup || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/groups/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ group_id: activeGroup._id, content: input.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d?.error ?? 'Failed to send.', 'error');
        return;
      }
      setInput('');
      refetchChat();
    } catch {
      showToast('Failed to send.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeGroup) return;
    
    setIsUploading(true);
    showToast(`Uploading ${file.name}…`, 'info');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      // 1. Upload to universal upload endpoint
      const uploadRes = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // No Content-Type so browser sets boundary
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      
      const fileUrl = uploadData.url;
      const fileName = uploadData.fileName;

      // 2. Post as a file message
      const msgRes = await fetch('http://localhost:5000/api/groups/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          group_id: activeGroup._id, 
          content: `[FILE] ${fileName}`,
          fetchables: [fileUrl]
        }),
      });
      
      if (!msgRes.ok) throw new Error('Failed to send file message');
      
      showToast('File uploaded automatically', 'success');
      refetchChat();
    } catch {
      showToast('Failed to upload file.', 'error');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Create group ──────────────────────────────────────────────────────────
  // POST /api/groups/create-group → { status: 'success', result: GroupChat }
  // Controller auto-sets userId as first admin + member
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroup.mutate(
      { group_name: newGroupName.trim(), requires_permission: newGroupPrivate },
      {
        onSuccess: (data) => {
          if (data?.status !== 'success') {
            showToast(data?.error ?? 'Failed to create.', 'error');
            return;
          }
          showToast(`"${newGroupName}" created!`, 'success');
          setShowCreateModal(false);
          setNewGroupName('');
          setNewGroupPrivate(false);
          if (data.result) setSelectedGroup(data.result);
        },
        onError: () => showToast('Failed to create group.', 'error'),
      }
    );
  };

  // ── Delete group — admin only ─────────────────────────────────────────────
  // POST /api/groups/delete-group { groupChatId }
  // Backend checks group_admins.includes(userId)
  const handleDeleteGroup = () => {
    if (!activeGroup || !isAdmin) return;
    deleteGroup.mutate(activeGroup._id, {
      onSuccess: (data) => {
        if (data?.status !== 'successful') {
          showToast(data?.error ?? 'Failed to delete.', 'error');
          return;
        }
        showToast('Group deleted.', 'info');
        setSelectedGroup(allGroups.find(g => g._id !== activeGroup._id) ?? null);
      },
      onError: () => showToast('Failed to delete group.', 'error'),
    });
  };

  // ── Leave group ────────────────────────────────────────────────────────
  const handleLeaveGroup = async () => {
    if (!activeGroup) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/groups/leave', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupChatId: activeGroup._id }),
      });
      if (!res.ok) throw new Error();
      showToast(`Left "${activeGroup.group_name}".`, 'info');
      setSelectedGroup(allGroups.find(g => g._id !== activeGroup._id) ?? null);
      refetchGroups();
    } catch {
      showToast('Failed to leave group.', 'error');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="flex h-screen overflow-hidden animate-[slideIn_0.3s_ease-out]">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="w-64 flex flex-col flex-shrink-0"
          style={{ background: '#111827', borderRight: '1px solid #1E2A3A' }}>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-white">Messages</h2>
              <button onClick={() => setShowCreateModal(true)} title="Create group"
                className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800' }}>
                <Plus size={14} />
              </button>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
              <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Search groups…" className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
            </div>
          </div>

          <div className="px-3 mb-1">
            <span className="text-xs font-medium uppercase tracking-widest px-2" style={{ color: '#4A5A70' }}>
              My Groups
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
            {filteredSidebar.length === 0 ? (
              <p className="text-xs px-3 py-4" style={{ color: '#4A5A70' }}>No groups found.</p>
            ) : filteredSidebar.map((group, index) => {
              const color    = getColor(index);
              const isActive = activeGroup?._id === group._id;
              const count    = group.group_members?.length ?? 0;
              return (
                <button key={group._id} onClick={() => setSelectedGroup(group)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                  style={{ background: isActive ? 'rgba(255,184,0,0.08)' : 'transparent', borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent' }}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: color + '20' }}>
                    <BookOpen size={14} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-white truncate">{group.group_name}</span>
                      {group.requires_permission && <Lock size={9} style={{ color: '#4A5A70' }} />}
                    </div>
                    <div className="text-xs" style={{ color: '#4A5A70' }}>{count} {count === 1 ? 'member' : 'members'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat area ─────────────────────────────────────────────────── */}
        {!activeGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: '#4A5A70' }}>
            <BookOpen size={36} style={{ color: '#2A3A50' }} />
            <p className="text-sm">Select a group to start chatting</p>
            <button onClick={() => setShowCreateModal(true)}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-medium"
              style={{ background: '#FFB800', color: '#0D0D0D' }}>
              Create your first group
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: '#1A1F2E', borderBottom: '1px solid #1E2A3A' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: activeColor + '25' }}>
                  <BookOpen size={16} style={{ color: activeColor }} />
                </div>
                <div>
                  <div className="font-display font-semibold text-white text-sm">{activeGroup.group_name}</div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4A5A70' }}>
                    <Users size={10} />
                    {activeGroup.group_members?.length ?? 0} members
                    {activeGroup.requires_permission && <><Lock size={9} /> Private</>}
                    {isAdmin && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA' }}>
                        <ShieldCheck size={9} /> Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isFetching && !msgsLoading && (
                  <RefreshCw size={13} className="animate-spin" style={{ color: '#4A5A70' }} />
                )}
                {/* Member avatars — userId strings, not objects */}
                <div className="flex -space-x-1">
                  {(activeGroup.group_members ?? []).slice(0, 4).map((uid, i) => (
                    <div key={uid} title={uid}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-black border-2"
                      style={{ background: getColor(i), borderColor: '#1A1F2E', fontSize: '8px' }}>
                      {uid.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Admin Requests button */}
                {isAdmin && activeGroup.requires_permission && (
                  <button onClick={() => setShowRequestsModal(true)} title="Join Requests"
                    className="p-2 rounded-xl flex items-center gap-1 hover:opacity-75 relative transition-opacity"
                    style={{ background: 'rgba(0,212,170,0.08)', color: '#00D4AA' }}>
                    <UserPlus size={14} />
                    {joinRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{ background: '#00D4AA' }}>
                        {joinRequests.length}
                      </span>
                    )}
                  </button>
                )}

                {/* Leave (non-admins) */}
                {!isAdmin && (
                  <button onClick={handleLeaveGroup} title="Leave group"
                    className="p-2 rounded-xl hover:opacity-75 transition-opacity"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171' }}>
                    <LogOut size={14} />
                  </button>
                )}

                {/* Delete (admins only) */}
                {isAdmin && (
                  <button onClick={handleDeleteGroup} disabled={deleteGroup.isPending}
                    title="Delete group"
                    className="p-2 rounded-xl hover:opacity-75 transition-opacity"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171', opacity: deleteGroup.isPending ? 0.5 : 1 }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-1">
              {msgsLoading ? (
                <div className="space-y-4 pt-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                      <Skeleton className="w-8 h-8 flex-shrink-0 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className={`h-10 ${i % 2 === 0 ? 'w-48' : 'w-36'} rounded-2xl`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : msgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                  <BookOpen size={28} style={{ color: '#4A5A70' }} />
                  <p className="text-sm" style={{ color: '#4A5A70' }}>No messages yet. Say hi!</p>
                </div>
              ) : msgs.map((msg, i) => {
                const isMine      = String(msg.senderId) === currentUserId || String((msg as any).sender_id) === currentUserId;
                const prevMsg     = msgs[i - 1];
                const showHeader  = !prevMsg || prevMsg.senderId !== msg.senderId;
                // senderName may not be stored — fallback to last 4 chars of senderId
                const displayName = msg.senderName ?? `User …${msg.senderId?.slice(-4)}`;
                const initials    = displayName.slice(0, 2).toUpperCase();
                let time = '';
                try { time = format(new Date(msg.timestamp), 'h:mm a'); } catch {}

                return (
                  <div key={msg._id ?? `${msg.senderId}-${i}`}
                    className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                    {showHeader ? (
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-black self-start"
                        style={{ background: isMine ? '#FFB800' : '#00D4AA' }}>
                        {initials}
                      </div>
                    ) : <div className="w-8 flex-shrink-0" />}

                    <div className={`max-w-xs flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-medium text-white">{isMine ? 'You' : displayName}</span>
                          {time && <span className="text-xs" style={{ color: '#4A5A70' }}>{time}</span>}
                        </div>
                      )}
                      {msg.content.startsWith('[FILE] ') || msg.type === 'file' ? (() => {
                        const fileUrl = (msg as any).fetchables?.[0] ?? '#';
                        const fileName = msg.content.replace('[FILE] ', '') || msg.fileName || 'File';
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                        
                        return (
                          <div className="flex flex-col gap-2 p-3 rounded-2xl" style={{ background: isMine ? 'rgba(255,184,0,0.15)' : '#1E2A3A', border: `1px solid ${isMine ? '#FFB80040' : '#2A3A50'}` }}>
                            {isImage && fileUrl !== '#' && (
                              <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-xl object-contain max-h-48" />
                            )}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FFB80020' }}>
                                <Paperclip size={14} style={{ color: '#FFB800' }} />
                              </div>
                              <div className="text-xs font-medium text-white break-all">{fileName}</div>
                            </div>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              download={fileName}
                              className="mt-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                              style={{ background: isMine ? '#FFB800' : '#2A3A50', color: isMine ? '#0D0D0D' : '#FFF', textDecoration: 'none' }}
                            >
                              Download / Open
                            </a>
                          </div>
                        );
                      })() : (
                        <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                          style={{ background: isMine ? '#FFB800' : '#1E2A3A', color: isMine ? '#0D0D0D' : '#E8EDF4' }}>
                          {msg.content}
                          {(msg as any).fetchables?.length > 0 && !msg.content.startsWith('[FILE]') && (
                             <div className="mt-2 space-y-1">
                               {(msg as any).fetchables.map((url: string, idx: number) => (
                                 <a key={idx} href={url} target="_blank" rel="noreferrer" className="block text-xs underline opacity-80" style={{ color: isMine ? '#000' : '#FFB800' }}>Attached Link {idx+1}</a>
                               ))}
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 flex-shrink-0" style={{ background: '#1A1F2E', borderTop: '1px solid #1E2A3A' }}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#111827', border: '1px solid #2A3A50' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-shrink-0 hover:opacity-70 transition-opacity" style={{ color: isUploading ? '#6B7A8D' : '#4A5A70' }}
                >
                  <Paperclip size={17} />
                </button>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                disabled={isUploading}
                placeholder={isUploading ? 'Uploading file…' : `Message #${activeGroup?.group_name?.toLowerCase().replace(/ /g, '-') || 'general'}…`}
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#E8EDF4' }} />
                <button onClick={handleSend} disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                  style={{ background: input.trim() && !sending ? '#FFB800' : '#2A3A50', color: input.trim() && !sending ? '#0D0D0D' : '#4A5A70' }}>
                  {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Group Modal ────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#1A1F2E', border: '1px solid #2A3A50' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-white">Create Group</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: '#4A5A70' }}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7A8D' }}>GROUP NAME</label>
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Algorithms Study Circle"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#111827', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#111827' }}>
                <div>
                  <div className="text-sm font-medium text-white">Private Group</div>
                  <div className="text-xs" style={{ color: '#4A5A70' }}>Members need admin approval</div>
                </div>
                <button onClick={() => setNewGroupPrivate(p => !p)}
                  className="w-10 h-5 rounded-full transition-all duration-200 relative"
                  style={{ background: newGroupPrivate ? '#FFB800' : '#2A3A50' }}>
                  <span className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200"
                    style={{ left: newGroupPrivate ? '22px' : '2px' }} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#1E2A3A', color: '#6B7A8D' }}>Cancel</button>
              <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || createGroup.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity"
                style={{ background: '#FFB800', color: '#0D0D0D', opacity: !newGroupName.trim() || createGroup.isPending ? 0.5 : 1 }}>
                {createGroup.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Join Requests Modal ── */}
      {showRequestsModal && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
            style={{ background: '#111827', border: '1px solid #1E2A3A', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between p-4" style={{ background: '#1A1F2E', borderBottom: '1px solid #1E2A3A' }}>
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <UserPlus size={16} style={{ color: '#00D4AA' }} />
                Join Requests
              </h3>
              <button onClick={() => setShowRequestsModal(false)}
                className="p-1 rounded-lg hover:opacity-70 transition-opacity" style={{ color: '#6B7A8D', background: '#1E2A3A' }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {reqQuery.isLoading ? (
                <p className="text-center text-xs" style={{ color: '#4A5A70' }}>Loading requests...</p>
              ) : joinRequests.length === 0 ? (
                <p className="text-center text-xs" style={{ color: '#4A5A70' }}>No pending join requests.</p>
              ) : (
                joinRequests.map((req: any) => (
                  <div key={req._id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#1A1F2E', border: '1px solid #2A3A50' }}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {req.username} <span className="text-xs font-normal" style={{ color: '#4A5A70' }}>({req.requester_id})</span>
                      </div>
                      <div className="text-[10px]" style={{ color: '#6B7A8D' }}>Wants to join the group</div>
                    </div>
                    <button
                      onClick={() => {
                        acceptJoinReq.mutate({ groupId: activeGroup._id, requesterId: req.requester_id }, {
                          onSuccess: () => {
                            showToast(`Accepted ${req.username}`, 'success');
                            refetchGroups();
                          },
                          onError: () => showToast('Failed to accept request', 'error')
                        });
                      }}
                      disabled={acceptJoinReq.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity"
                      style={{ background: '#00D4AA', color: '#0D0D0D', opacity: acceptJoinReq.isPending ? 0.5 : 1 }}>
                      Accept
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
