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
  usePrivateChat,
  useSendPrivateMessage,
  useUploadFileMessage,
} from '../hooks/useQueries';
import { LoadingSpinner, ErrorState, MutationButton } from './ui';
import { format } from 'date-fns';

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Private Chat Message interface ───────────────────────────────────────────
interface PrivateMessage {
  _id?: string;
  sender_id: string;
  content: string;
  fetchables?: string[];
  timestamp: string;
}

// ─── Chat Panel (right side) ──────────────────────────────────────────────────
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

  const { data: chatData, isLoading, isFetching } = usePrivateChat(friendId);
  const messages: PrivateMessage[] = chatData?.messages ?? [];
  const sendMessage = useSendPrivateMessage();
  const uploadFile = useUploadFileMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    const content = input.trim();
    setInput('');
    sendMessage.mutate(
      { friendId, content },
      {
        onError: () => showToast('Failed to send message.', 'error'),
      }
    );
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
    uploadFile.mutate(
      { friendId, file },
      {
        onSuccess: () => showToast('File sent!', 'success'),
        onError: () => showToast('Failed to upload file.', 'error'),
        onSettled: () => setUploading(false),
      }
    );

    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  // Detect if message is a file message
  const isFileMessage = (msg: PrivateMessage) =>
    msg.content?.startsWith('[FILE]') && msg.fetchables && msg.fetchables.length > 0;

  const getFileName = (msg: PrivateMessage) =>
    msg.content?.replace('[FILE] ', '') ?? 'file';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
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
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{friend.username}</div>
          <div className="text-xs flex items-center gap-1.5" style={{ color: '#4A5A70' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#00D4AA' }} />
            Online
          </div>
        </div>
        {isFetching && !isLoading && (
          <RefreshCw size={13} className="animate-spin" style={{ color: '#4A5A70' }} />
        )}
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
            const isMine = String(msg.sender_id) === String(currentUserId);
            const prevMsg = messages[i - 1];
            const showTime = !prevMsg || prevMsg.sender_id !== msg.sender_id ||
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
                    /* File message card */
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
                    /* Text message bubble */
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

      {/* Input bar */}
      <div className="px-5 py-4 flex-shrink-0" style={{ background: '#1A1F2E', borderTop: '1px solid #1E2A3A' }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#111827', border: '1px solid #2A3A50' }}>
          {/* File attachment */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg,.gif"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: uploading ? '#2A3A50' : '#4A5A70' }}>
            {uploading ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
          </button>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${friend.username}…`}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#E8EDF4' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{
              background: input.trim() && !sendMessage.isPending ? '#00D4AA' : '#2A3A50',
              color: input.trim() && !sendMessage.isPending ? '#0D0D0D' : '#4A5A70',
            }}>
            {sendMessage.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Friends Component (WhatsApp Layout) ─────────────────────────────────
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
  // MySQL may return senderId or senderid depending on platform
  const requests = (requestsQuery.data?.friendRequests ?? []).map((r: any) => ({
    senderId: r.senderId ?? r.senderid ?? r.sendid ?? r.userId ?? '',
    username: r.username ?? r.Username ?? '',
  }));
  const sentRequests = (sentRequestsQuery.data?.sentRequests ?? []).map((r: any) => ({
    recieverId: r.recieverId ?? r.recieverid ?? r.userId ?? '',
    username: r.username ?? r.Username ?? '',
  }));
  const results = searchResult.data?.users ?? [];

  // Get current user ID from JWT
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return String(payload.Uid);
    } catch { return ''; }
  })();

  // Filter friends by sidebar search
  const filteredFriends = sidebarSearch.length >= 1
    ? friends.filter((f: any) => f.username.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : friends;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSendRequest = (userID: string, username: string) => {
    sendRequest.mutate(userID, {
      onSuccess: (data) => {
        if (data?.status === 'error') {
          if (data.message === 'You are already friends')
            return show(`You and ${username} are already friends.`, 'info');
          if (data.message === 'Friend request already sent')
            return show(`You already sent a request to ${username}.`, 'info');
          return show(data.message ?? 'Something went wrong.', 'error');
        }
        if (data?.message === 'Friend request accepted') {
          show(`You and ${username} are now friends!`, 'success');
          friendsQuery.refetch();
          return;
        }
        show(`Friend request sent to ${username}.`, 'success');
      },
      onError: () => show('Failed to send request. Please try again.', 'error'),
    });
  };

  const handleAccept = (senderId: string, username: string) => {
    acceptRequest.mutate(senderId, {
      onSuccess: (data) => {
        if (data?.status === 'error') return show(data.message ?? 'Could not accept.', 'error');
        show(`You and ${username} are now friends!`, 'success');
      },
      onError: () => show('Failed to accept request.', 'error'),
    });
  };

  const handleReject = (senderId: string, username: string) => {
    rejectRequest.mutate({ senderId, recieverId: '' }, {
      onSuccess: (data) => {
        if (data?.status === 'error') return show(data.message ?? 'Could not decline.', 'error');
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status === 'error') {
        show(data?.message ?? 'Failed to unfriend.', 'error');
        return;
      }
      show(`Unfriended ${username}.`, 'info');
      friendsQuery.refetch();
      if (selectedFriend?.username === username) setSelectedFriend(null);
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
        {/* ══════════════════════ LEFT PANEL ════════════════════════════ */}
        <div className={`w-80 flex flex-col flex-shrink-0 ${selectedFriend ? 'hidden lg:flex' : 'flex'}`}
          style={{ background: '#111827', borderRight: '1px solid #1E2A3A' }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <h1 className="font-bold text-xl text-white mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Friends
            </h1>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0F1623' }}>
              {tabs.map(({ id, label, count, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: activeTab === id ? '#1E2A3A' : 'transparent',
                    color: activeTab === id ? '#E8EDF4' : '#4A5A70',
                  }}>
                  <Icon size={13} />
                  {label}
                  {count !== null && count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-xs font-bold" style={{
                      background: id === 'requests' ? '#FFB800' : 'rgba(0,212,170,0.15)',
                      color: id === 'requests' ? '#0D0D0D' : '#00D4AA',
                      fontSize: '10px',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Friends (Chat list) ─────────────────────────────── */}
          {activeTab === 'friends' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
                  <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)}
                    placeholder="Search friends…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide px-2 space-y-0.5">
                {friendsQuery.isLoading ? (
                  <LoadingSpinner label="Loading friends..." />
                ) : friendsQuery.isError ? (
                  <ErrorState message="Failed to load friends." onRetry={() => friendsQuery.refetch()} />
                ) : filteredFriends.length === 0 ? (
                  <EmptyState icon={Users} message="No friends yet. Find people to connect!" />
                ) : (
                  filteredFriends.map((f: any) => {
                    const isActive = selectedFriend?.username === f.username;
                    return (
                      <button key={f.username}
                        onClick={() => setSelectedFriend(f)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group"
                        style={{
                          background: isActive ? 'rgba(0,212,170,0.08)' : 'transparent',
                          borderLeft: isActive ? '2px solid #00D4AA' : '2px solid transparent',
                        }}>
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                            style={{ background: '#00D4AA' }}>
                            {f.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                            style={{ background: '#00D4AA', borderColor: '#111827' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{f.username}</div>
                          <div className="text-xs mt-0.5 truncate" style={{ color: '#4A5A70' }}>
                            Tap to chat
                          </div>
                        </div>
                        {/* Unfriend — shows on hover */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnfriend(f.username); }}
                          disabled={unfriendingId === f.username}
                          title="Unfriend"
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171' }}>
                          {unfriendingId === f.username
                            ? <Loader2 size={12} className="animate-spin" />
                            : <UserMinus size={12} />}
                        </button>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Requests ─────────────────────────────────────── */}
          {activeTab === 'requests' && (
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-4">
              
              {/* Incoming Requests */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#6B7A8D' }}>Incoming Requests</h3>
                <div className="space-y-2">
                  {requestsQuery.isLoading ? (
                    <LoadingSpinner label="Loading requests..." />
                  ) : requestsQuery.isError ? (
                    <ErrorState message="Failed to load requests." onRetry={() => requestsQuery.refetch()} />
                  ) : requests.length === 0 ? (
                    <EmptyState icon={UserPlus} message="No pending incoming friend requests." />
                  ) : (
                    requests.map((r: { senderId: string; username: string }) => (
                      <div key={r.senderId} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                          style={{ background: '#FFB800' }}>
                          {r.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{r.username}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#4A5A70' }}>Sent you a request</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <MutationButton
                            isPending={acceptRequest.isPending && acceptRequest.variables === r.senderId}
                            label="✓" pendingLabel="…"
                            onClick={() => handleAccept(r.senderId, r.username)}
                            className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center"
                            style={{ background: '#00D4AA', color: '#0D0D0D' }}
                          />
                          <MutationButton
                            isPending={rejectRequest.isPending && rejectRequest.variables?.senderId === r.senderId}
                            label="✕" pendingLabel="…"
                            onClick={() => handleReject(r.senderId, r.username)}
                            className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sent Requests */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-1 mt-4" style={{ color: '#6B7A8D' }}>Sent Requests</h3>
                <div className="space-y-2">
                  {sentRequestsQuery.isLoading ? (
                    <LoadingSpinner label="Loading sent requests..." />
                  ) : sentRequestsQuery.isError ? (
                    <ErrorState message="Failed to load sent requests." onRetry={() => sentRequestsQuery.refetch()} />
                  ) : sentRequests.length === 0 ? (
                    <div className="text-center py-4 text-xs" style={{ color: '#4A5A70' }}>No pending sent requests.</div>
                  ) : (
                    sentRequests.map((r: { recieverId: string; username: string }) => (
                      <div key={r.recieverId} className="flex items-center gap-3 p-3 rounded-xl opacity-75"
                        style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
                          style={{ background: '#00D4AA' }}>
                          {r.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{r.username}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: '#4A5A70' }}>Request sent (pending)</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ── Tab: Search / Find People ──────────────────────────── */}
          {activeTab === 'search' && (
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2">
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }}
                />
              </div>

              {searchQuery.length < 2 ? (
                <EmptyState icon={Search} message="Type at least 2 characters." />
              ) : searchResult.isLoading ? (
                <LoadingSpinner label="Searching..." />
              ) : results.length === 0 ? (
                <EmptyState icon={UserX} message={`No users found for "${searchQuery}".`} />
              ) : (
                <div className="space-y-2">
                  {results.map((u: { userID: string; username: string }) => (
                    <div key={u.userID} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                        style={{ background: '#7C3AED' }}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{u.username}</div>
                      </div>
                      <MutationButton
                        isPending={sendRequest.isPending && sendRequest.variables === u.userID}
                        label="Add" pendingLabel="…"
                        onClick={() => handleSendRequest(u.userID, u.username)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: '#FFB800', color: '#0D0D0D' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════ RIGHT PANEL (Chat) ════════════════════ */}
        {selectedFriend ? (
          <ChatPanel
            friend={selectedFriend}
            currentUserId={currentUserId}
            onBack={() => setSelectedFriend(null)}
            showToast={show}
          />
        ) : (
          <div className="flex-1 hidden lg:flex flex-col items-center justify-center gap-4"
            style={{ background: '#0F1623' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,212,170,0.08)' }}>
              <MessageCircle size={36} style={{ color: '#1E2A3A' }} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">StudySync Chat</h3>
              <p className="text-sm" style={{ color: '#4A5A70' }}>
                Select a friend to start chatting
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
              style={{ background: 'rgba(255,184,0,0.06)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.12)' }}>
              <Paperclip size={12} />
              Send files, PDFs & documents
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon: React.ElementType; message: string }> = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#1E2A3A' }}>
      <Icon size={20} style={{ color: '#4A5A70' }} />
    </div>
    <p className="text-xs text-center" style={{ color: '#4A5A70' }}>{message}</p>
  </div>
);

export default Friends;
