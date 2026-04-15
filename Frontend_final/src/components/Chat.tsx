import { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Search, Users, Lock, BookOpen,
  RefreshCw, LogOut, ShieldCheck, Trash2, Plus, X, UserPlus,
} from 'lucide-react';
import { useMyRealGroups, useJoinRequests, useAcceptJoinRequest } from '../hooks/useQueries';
import { useCreateRealGroup, useDeleteRealGroup, useJoinGroup } from '../hooks/useQueries';
import { useChatSocket, Message } from '../hooks/useChatSocket';
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

interface RealGroup {
  _id: string;
  group_name: string;
  group_members: string[];  // array of userId strings
  group_admins: string[];
  requires_permission: boolean;
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

  const { 
    messages: msgs, 
    sendMessage, 
    isConnected: socketConnected 
  } = useChatSocket(activeGroup?._id ?? null);
  
  const msgsLoading = activeGroup && msgs.length === 0;

  const createGroup = useCreateRealGroup();
  const deleteGroup = useDeleteRealGroup();
  const joinGroup   = useJoinGroup();
  const acceptJoinReq = useAcceptJoinRequest();

  const reqQuery = useJoinRequests(isAdmin && activeGroup ? activeGroup._id : '');
  const joinRequests = reqQuery.data?.result ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeGroup || sending) return;
    setSending(true);
    sendMessage(input.trim());
    setInput('');
    setSending(false);
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
      const uploadRes = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      sendMessage(`[FILE] ${uploadData.fileName}`, [uploadData.url]);
      showToast('File uploaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroup.mutate(
      { group_name: newGroupName.trim(), requires_permission: newGroupPrivate },
      {
        onSuccess: (data) => {
          showToast(`"${newGroupName}" created!`, 'success');
          setShowCreateModal(false);
          setNewGroupName('');
          setNewGroupPrivate(false);
          if (data?.result) setSelectedGroup(data.result);
          refetchGroups();
        },
        onError: () => showToast('Failed to create.', 'error'),
      }
    );
  };

  const handleDeleteGroup = () => {
    if (!activeGroup || !isAdmin) return;
    if (!window.confirm("Delete this group permanently?")) return;
    deleteGroup.mutate(activeGroup._id, {
      onSuccess: () => {
        showToast('Group deleted.', 'info');
        setSelectedGroup(null);
        refetchGroups();
      },
      onError: (err: any) => showToast(err.message || 'Failed to delete.', 'error'),
    });
  };

  const handleLeaveGroup = async () => {
    if (!activeGroup) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ groupChatId: activeGroup._id }),
      });
      showToast(`Left "${activeGroup.group_name}".`, 'info');
      setSelectedGroup(null);
      refetchGroups();
    } catch {
      showToast('Failed to leave.', 'error');
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
              <h2 className="font-display font-bold text-white">Groups</h2>
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

          <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
            {filteredSidebar.map((group, index) => {
              const color    = getColor(index);
              const isActive = activeGroup?._id === group._id;
              return (
                <button key={group._id} onClick={() => setSelectedGroup(group)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                  style={{ background: isActive ? 'rgba(255,184,0,0.08)' : 'transparent', borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent' }}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: color + '20' }}>
                    <BookOpen size={14} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-white truncate block">{group.group_name}</span>
                    <span className="text-[10px]" style={{ color: '#4A5A70' }}>{group.group_members?.length || 0} members</span>
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
                    {activeGroup.requires_permission && <><Lock size={9} /> Private</>}
                    {isAdmin && <span style={{ color: '#00D4AA' }}>Admin</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Member Avatars */}
                <div className="flex -space-x-1 mr-2">
                  {(activeGroup.group_members ?? []).slice(0, 3).map((uid, i) => (
                    <div key={uid} className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-black border border-[#1A1F2E]" style={{ background: getColor(i) }}>
                      {uid.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Join Button for non-members */}
                {!activeGroup.group_members?.includes(currentUserId) && (
                  <button
                    onClick={() => {
                      joinGroup.mutate(activeGroup._id, {
                        onSuccess: () => {
                          if (activeGroup.requires_permission) showToast('Request sent!', 'info');
                          else { showToast('Joined!', 'success'); refetchGroups(); }
                        }
                      });
                    }}
                    disabled={joinGroup.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: '#FFB800', color: '#0D0D0D' }}
                  >
                    {activeGroup.requires_permission ? 'Request' : 'Join'}
                  </button>
                )}

                {isAdmin && activeGroup.requires_permission && (
                  <button onClick={() => setShowRequestsModal(true)} className="p-2 rounded-lg" style={{ background: '#1E2A3A', color: '#00D4AA' }}>
                    <UserPlus size={14} />
                  </button>
                )}
                
                {isAdmin ? (
                  <button onClick={handleDeleteGroup} className="p-2 rounded-lg" style={{ background: '#1E2A3A', color: '#EF4444' }}>
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button onClick={handleLeaveGroup} className="p-2 rounded-lg" style={{ background: '#1E2A3A', color: '#EF4444' }}>
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-1">
              {!activeGroup.group_members?.includes(currentUserId) ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <Lock size={32} style={{ color: '#4A5A70' }} />
                  <p className="text-sm" style={{ color: '#4A5A70' }}>Private Group. Join to view messages.</p>
                </div>
              ) : msgsLoading ? (
                <div className="animate-pulse space-y-4 pt-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#1E2A3A] rounded-2xl w-1/2" />)}
                </div>
              ) : (
                <>
                  {msgs.map((msg, i) => {
                    const isMine = String(msg.senderId || msg.sender_id) === currentUserId;
                    return (
                      <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                        <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%]`}
                          style={{ background: isMine ? '#FFB800' : '#1E2A3A', color: isMine ? '#0D0D0D' : '#E8EDF4' }}>
                          <div className="text-[10px] opacity-70 mb-0.5">{msg.senderName || 'User'}</div>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            {activeGroup.group_members?.includes(currentUserId) && (
              <div className="px-6 py-4" style={{ background: '#1A1F2E' }}>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: '#111827', border: '1px solid #2A3A50' }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} style={{ color: '#4A5A70' }}><Paperclip size={16} /></button>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder="Type message..." className="flex-1 bg-transparent text-sm outline-none text-white" />
                  <button onClick={handleSend} disabled={!input.trim() || sending} style={{ color: '#FFB800' }}>
                    {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-[#1A1F2E] border border-[#2A3A50]">
            <h2 className="text-lg font-bold text-white mb-4">Create Group</h2>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group Name" className="w-full p-2.5 rounded-xl bg-[#111827] border border-[#2A3A50] text-white mb-4 outline-none" />
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-white">Private Group</span>
              <button onClick={() => setNewGroupPrivate(!newGroupPrivate)} className={`w-10 h-5 rounded-full relative transition-colors ${newGroupPrivate ? 'bg-[#FFB800]' : 'bg-[#2A3A50]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${newGroupPrivate ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-xl bg-[#1E2A3A] text-white">Cancel</button>
              <button onClick={handleCreateGroup} className="flex-1 py-2 rounded-xl bg-[#FFB800] text-black font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {showRequestsModal && activeGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-[#1A1F2E] border border-[#2A3A50]">
            <div className="flex justify-between items-center mb-4 text-white font-bold">
              <span>Join Requests</span>
              <button onClick={() => setShowRequestsModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {joinRequests.length === 0 ? <p className="text-xs text-[#4A5A70] text-center">No requests</p> : 
                joinRequests.map((req: any) => (
                  <div key={req._id} className="flex justify-between items-center p-2 bg-[#111827] rounded-lg border border-[#2A3A50]">
                    <span className="text-xs text-white truncate mr-2">{req.username}</span>
                    <button onClick={() => acceptJoinReq.mutate({ groupId: activeGroup._id, requesterId: req.requester_id }, { onSuccess: () => refetchGroups() })} className="px-2 py-1 bg-[#00D4AA] text-black font-bold rounded-md text-[10px]">Accept</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
