import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, UserPlus, UserX, Users, CheckCircle, AlertCircle, Info, X, UserMinus,
  Send, Paperclip, ArrowLeft, MessageCircle, FileText, Download, RefreshCw, Loader2
} from 'lucide-react';
import {
  useFriends,
  useFriendRequests,
  useSentFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useUploadFileMessage,
} from '../hooks/useQueries';
import { useChatSocket } from '../hooks/useChatSocket';
import { LoadingSpinner, ErrorState, MutationButton } from './ui';
import { format } from 'date-fns';

// ─── Toast Sub-system ─────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType }
let _toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, show, dismiss };
}

const toastStyle: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.25)', color: '#00D4AA' },
  error:   { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: '#F87171' },
  info:    { bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.25)', color: '#FFB800' },
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const color = toastStyle[type].color;
  if (type === 'success') return <CheckCircle size={14} style={{ color }} />;
  if (type === 'error') return <AlertCircle size={14} style={{ color }} />;
  return <Info size={14} style={{ color }} />;
};

const ToastContainer: React.FC<{ toasts: Toast[]; dismiss: (id: number) => void }> = ({ toasts, dismiss }) => (
  <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm pointer-events-auto"
        style={{ background: toastStyle[t.type].bg, border: `1px solid ${toastStyle[t.type].border}`, color: '#E8EDF4', minWidth: 260, animation: 'slideIn 0.2s ease-out' }}>
        <ToastIcon type={t.type} />
        <span className="flex-1">{t.message}</span>
        <button onClick={() => dismiss(t.id)} className="opacity-40 hover:opacity-100 transition-opacity">
          <X size={13} />
        </button>
      </div>
    ))}
  </div>
);

// ─── Chat Panel Component ─────────────────────────────────────────────────────
interface ChatPanelProps {
  friend: { username: string; userid?: string; userID?: string };
  currentUserId: string;
  onBack: () => void;
  showToast: (msg: string, type: ToastType) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ friend, currentUserId, onBack, showToast }) => {
  const friendId = friend.userid || friend.userID || '';
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SOCKET INTEGRATION
  const { 
    messages, 
    sendMessage, 
    isConnected: socketConnected 
  } = useChatSocket(friendId, 'private');

  const isLoading = friendId && messages.length === 0;
  const uploadFile = useUploadFileMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    try {
      sendMessage(input.trim());
      setInput('');
    } catch (e) {
      showToast('Failed to send message', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Max 10MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile.mutateAsync({ friendId, file });
      sendMessage(`[FILE] ${result.fileName}`, [result.fileUrl]);
      showToast('File shared!', 'success');
    } catch (e) {
      showToast('Failed to upload file.', 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const isFileMessage = (msg: any) =>
    msg.content?.startsWith('[FILE]') && msg.fetchables && msg.fetchables.length > 0;

  const getFileName = (msg: any) =>
    msg.content?.replace('[FILE] ', '') ?? 'file';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ background: '#1A1F2E', borderBottom: '1px solid #1E2A3A' }}>
        <button onClick={onBack} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity lg:hidden"
          style={{ color: '#6B7A8D' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
          style={{ background: '#00D4AA' }}>
          {friend.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-white text-sm">{friend.username}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-[#00D4AA] animate-pulse' : 'bg-[#4A5A70]'}`} />
            <span className="text-[10px] font-medium" style={{ color: socketConnected ? '#00D4AA' : '#4A5A70' }}>
              {socketConnected ? 'LIVE CONNECTION' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-1"
        style={{ background: '#0F1623' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner label="Loading chat..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <MessageCircle size={32} style={{ color: '#4A5A70' }} />
            <p className="text-sm text-center" style={{ color: '#4A5A70' }}>
              No messages yet.<br />Say hi to {friend.username}!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const senderId = msg.sender_id || msg.senderId;
            const isMine = String(senderId) === String(currentUserId);
            const prevMsg = messages[i - 1];
            const prevSenderId = prevMsg ? (prevMsg.sender_id || prevMsg.senderId) : null;
            const showTime = !prevMsg || prevSenderId !== senderId ||
              (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) > 300000;

            let timeStr = '';
            try { timeStr = format(new Date(msg.timestamp), 'h:mm a'); } catch {}

            return (
              <div key={msg._id ?? `msg-${i}`}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${showTime ? 'mt-4' : 'mt-0.5'}`}>
                <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {showTime && timeStr && (
                    <span className="text-xs mb-1 px-1" style={{ color: '#4A5A70' }}>{timeStr}</span>
                  )}
                  {isFileMessage(msg) ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{
                        background: isMine ? 'rgba(0,212,170,0.12)' : '#1E2A3A',
                        border: `1px solid ${isMine ? 'rgba(0,212,170,0.2)' : '#2A3A50'}`,
                      }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,184,0,0.12)' }}>
                        <FileText size={16} style={{ color: '#FFB800' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white truncate">{getFileName(msg)}</div>
                        <a href={msg.fetchables![0]} target="_blank" rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity"
                          style={{ color: '#00D4AA' }}>
                          <Download size={10} /> Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: isMine ? '#00D4AA' : '#1E2A3A',
                        color: isMine ? '#0D0D0D' : '#E8EDF4',
                        borderBottomRightRadius: isMine ? '6px' : '18px',
                        borderBottomLeftRadius: isMine ? '18px' : '6px',
                      }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 flex-shrink-0" style={{ background: '#1A1F2E', borderTop: '1px solid #1E2A3A' }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#111827', border: '1px solid #2A3A50' }}>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: uploading ? '#2A3A50' : '#4A5A70' }}>
            {uploading ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`Message ${friend.username}…`}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#E8EDF4' }} />
          <button onClick={handleSend} disabled={!input.trim()}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{
              background: input.trim() ? '#00D4AA' : '#2A3A50',
              color: input.trim() ? '#0D0D0D' : '#4A5A70',
            }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Friends Component ───────────────────────────────────────────────────
const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [unfriendingId, setUnfriendingId] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const { toasts, show, dismiss } = useToast();

  const friendsQuery = useFriends();
  const requestsQuery = useFriendRequests();
  const sentRequestsQuery = useSentFriendRequests();
  const searchResult = useSearchUsers(searchQuery);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const friends = friendsQuery.data?.friends ?? [];
  const requests = (requestsQuery.data?.friendRequests ?? []).map((r: any) => ({
    senderId: r.senderId ?? r.senderid ?? r.sendid ?? r.userId ?? '',
    username: r.username ?? r.Username ?? '',
  }));
  const sentRequests = (sentRequestsQuery.data?.sentRequests ?? []).map((r: any) => ({
    recieverId: r.recieverId ?? r.recieverid ?? r.userId ?? '',
    username: r.username ?? r.Username ?? '',
  }));
  const results = searchResult.data?.users ?? [];

  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return String(payload.Uid);
    } catch { return ''; }
  })();

  const filteredFriends = sidebarSearch.length >= 1
    ? friends.filter((f: any) => f.username.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : friends;

  const handleSendRequest = (userID: string, username: string) => {
    sendRequest.mutate(userID, {
      onSuccess: (data) => {
        if (data?.status === 'error') return show(data.message ?? 'Error', 'error');
        show(`Friend request sent to ${username}.`, 'success');
      },
      onError: () => show('Failed to send request.', 'error'),
    });
  };

  const handleAccept = (senderId: string, username: string) => {
    acceptRequest.mutate(senderId, {
      onSuccess: (data) => {
        if (data?.status === 'error') return show(data.message ?? 'Error', 'error');
        show(`You and ${username} are now friends!`, 'success');
        friendsQuery.refetch();
      },
      onError: () => show('Failed to accept request.', 'error'),
    });
  };

  const handleReject = (senderId: string, username: string) => {
    rejectRequest.mutate({ senderId, recieverId: '' }, {
      onSuccess: (data) => {
        if (data?.status === 'error') return show(data.message ?? 'Error', 'error');
        show(`Declined request from ${username}.`, 'info');
      },
      onError: () => show('Failed to decline request.', 'error'),
    });
  };

  const handleUnfriend = async (username: string) => {
    setUnfriendingId(username);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/friends/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        show(`Unfriended ${username}.`, 'info');
        friendsQuery.refetch();
        if (selectedFriend?.username === username) setSelectedFriend(null);
      }
    } catch {
      show('Failed to unfriend.', 'error');
    } finally {
      setUnfriendingId(null);
    }
  };

  const tabs = [
    { id: 'friends' as const, label: 'Chats', count: friends.length, icon: MessageCircle },
    { id: 'requests' as const, label: 'Requests', count: requests.length, icon: UserPlus },
    { id: 'search' as const, label: 'Find', count: null, icon: Search },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="flex h-screen overflow-hidden animate-[slideIn_0.3s_ease-out]">
        {/* LEFT PANEL */}
        <div className={`w-80 flex flex-col flex-shrink-0 ${selectedFriend ? 'hidden lg:flex' : 'flex'}`}
          style={{ background: '#111827', borderRight: '1px solid #1E2A3A' }}>

          <div className="px-5 pt-5 pb-3">
            <h1 className="font-bold text-xl text-white mb-3">Friends</h1>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0F1623' }}>
              {tabs.map(({ id, label, count, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{ background: activeTab === id ? '#1E2A3A' : 'transparent', color: activeTab === id ? '#E8EDF4' : '#4A5A70' }}>
                  <Icon size={13} />
                  {label}
                  {count !== null && count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ background: id === 'requests' ? '#FFB800' : 'rgba(0,212,170,0.15)', color: id === 'requests' ? '#0D0D0D' : '#00D4AA' }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {activeTab === 'friends' && (
              <div className="p-2 space-y-0.5">
                {friendsQuery.isLoading ? <LoadingSpinner /> : filteredFriends.length === 0 ? <EmptyState icon={Users} message="No friends yet." /> : (
                  filteredFriends.map((f: any) => (
                    <button key={f.username} onClick={() => setSelectedFriend(f)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group"
                      style={{ background: selectedFriend?.username === f.username ? 'rgba(0,212,170,0.08)' : 'transparent' }}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: '#00D4AA' }}>
                        {f.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-sm font-medium text-white">{f.username}</div>
                        <div className="text-xs text-[#4A5A70]">Tap to chat</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleUnfriend(f.username); }} className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#F87171' }}>
                        <UserMinus size={12} />
                      </button>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="p-3 space-y-4">
                {requests.length > 0 && (
                  <div className="space-y-2">
                    {requests.map((r: any) => (
                      <div key={r.senderId} className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1F2E]">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: '#FFB800' }}>{r.username.slice(0, 2).toUpperCase()}</div>
                        <div className="flex-1 truncate text-white text-sm">{r.username}</div>
                        <div className="flex gap-1">
                          <button onClick={() => handleAccept(r.senderId, r.username)} className="w-8 h-8 rounded-lg bg-[#00D4AA] flex items-center justify-center text-xs">✓</button>
                          <button onClick={() => handleReject(r.senderId, r.username)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="p-3 space-y-3">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search people..." className="w-full p-2 rounded-xl bg-[#1E2A3A] text-xs text-white outline-none" />
                {searchResult.isLoading ? <LoadingSpinner /> : searchResult.data?.users?.map((u: any) => (
                  <div key={u.userID} className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1F2E]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: '#7C3AED' }}>{u.username.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 truncate text-white text-sm">{u.username}</div>
                    <button onClick={() => handleSendRequest(u.userID, u.username)} className="px-3 py-1.5 rounded-lg bg-[#FFB800] text-xs font-bold">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        {selectedFriend ? (
          <ChatPanel friend={selectedFriend} currentUserId={currentUserId} onBack={() => setSelectedFriend(null)} showToast={show} />
        ) : (
          <div className="flex-1 hidden lg:flex flex-col items-center justify-center gap-4 bg-[#0F1623]">
            <MessageCircle size={48} className="text-[#1E2A3A]" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">Select a friend to chat</h3>
              <p className="text-sm text-[#4A5A70]">Stay connected with your study partners</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const EmptyState: React.FC<{ icon: any; message: string }> = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#4A5A70]">
    <Icon size={24} />
    <p className="text-xs">{message}</p>
  </div>
);

export default Friends;
