import React, { useState, useCallback } from 'react';
import { Search, UserPlus, UserX, Users, CheckCircle, AlertCircle, Info, X, UserMinus } from 'lucide-react';
import {
  useFriends,
  useFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from '../hooks/useQueries';
import { LoadingSpinner, ErrorState, MutationButton } from './ui';

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
  success: { bg: 'rgba(0,212,170,0.08)',  border: 'rgba(0,212,170,0.25)',  color: '#00D4AA' },
  error:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  color: '#F87171' },
  info:    { bg: 'rgba(255,184,0,0.08)',  border: 'rgba(255,184,0,0.25)',  color: '#FFB800' },
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const color = toastStyle[type].color;
  if (type === 'success') return <CheckCircle size={14} style={{ color }} />;
  if (type === 'error')   return <AlertCircle size={14} style={{ color }} />;
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

// ─── Main component ───────────────────────────────────────────────────────────

const Friends: React.FC = () => {
  const [activeTab, setActiveTab]         = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery]     = useState('');
  const [unfriendingId, setUnfriendingId] = useState<string | null>(null);
  const { toasts, show, dismiss }         = useToast();

  const friendsQuery  = useFriends();
  const requestsQuery = useFriendRequests();
  const searchResult  = useSearchUsers(searchQuery);
  const sendRequest   = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const friends  = friendsQuery.data?.friends ?? [];
  const requests = requestsQuery.data?.friendRequests ?? [];
  const results  = searchResult.data?.users ?? [];

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
    // Backend rejectFriendRequest reads senderId + recieverId from req.body
    // recieverId comes from req.user via JWT on backend — pass empty string here
    rejectRequest.mutate({ senderId, recieverId: '' }, {
      onSuccess: (data) => {
        if (data?.status === 'error') return show(data.message ?? 'Could not decline.', 'error');
        show(`Declined request from ${username}.`, 'info');
      },
      onError: () => show('Failed to decline request.', 'error'),
    });
  };

  // unfriend → POST /api/friends/unfriend
  // Backend: const {userId1, userId2} = req.body
  // We need to send current user's ID as one of them.
  // Since we only have username from friendsList, adjust body once backend returns userId too.
  const handleUnfriend = async (username: string) => {
    setUnfriendingId(username);
    try {
        const token = localStorage.getItem("token");
      const res = await fetch('http://localhost:5000/api/friends/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, },
        // TODO: replace `username` with actual userId values when backend returns them in friendlist
        body: JSON.stringify({ username }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.status === 'error') {
        show(data?.message ?? 'Failed to unfriend.', 'error');
        return;
      }
      show(`Unfriended ${username}.`, 'info');
      friendsQuery.refetch();
    } catch {
      show('Failed to unfriend.', 'error');
    } finally {
      setUnfriendingId(null);
    }
  };

  const tabs = [
    { id: 'friends'  as const, label: 'My Friends',  count: friends.length  },
    { id: 'requests' as const, label: 'Requests',    count: requests.length },
    { id: 'search'   as const, label: 'Find People', count: null            },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="p-8 animate-[slideIn_0.3s_ease-out]">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Friends</h1>
          <p className="text-sm mt-1" style={{ color: '#4A5A70' }}>Manage your connections</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#111827' }}>
          {tabs.map(({ id, label, count }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: activeTab === id ? '#1E2A3A' : 'transparent', color: activeTab === id ? '#E8EDF4' : '#4A5A70' }}>
              {label}
              {count !== null && count > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{ background: id === 'requests' ? '#FFB800' : 'rgba(255,184,0,0.15)', color: id === 'requests' ? '#0D0D0D' : '#FFB800' }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Friends list ──────────────────────────────────────────────── */}
        {activeTab === 'friends' && (
          friendsQuery.isLoading ? <LoadingSpinner label="Loading friends..." />
          : friendsQuery.isError  ? <ErrorState message="Failed to load friends." onRetry={() => friendsQuery.refetch()} />
          : friends.length === 0  ? <EmptyState icon={Users} message="No friends yet. Search for people to connect with." />
          : (
            <div className="grid grid-cols-3 gap-4">
              {friends.map((f: { username: string }) => (
                <div key={f.username} className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                  <Avatar name={f.username} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{f.username}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4A5A70' }}>Friend</div>
                  </div>
                  {/* ── Unfriend button ── */}
                  <button
                    onClick={() => handleUnfriend(f.username)}
                    disabled={unfriendingId === f.username}
                    title="Unfriend"
                    className="p-2 rounded-xl transition-all duration-200 hover:opacity-80 flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171', opacity: unfriendingId === f.username ? 0.5 : 1 }}
                  >
                    {unfriendingId === f.username
                      ? <span className="text-xs px-1">...</span>
                      : <UserMinus size={14} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Friend Requests ───────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          requestsQuery.isLoading ? <LoadingSpinner label="Loading requests..." />
          : requestsQuery.isError  ? <ErrorState message="Failed to load requests." onRetry={() => requestsQuery.refetch()} />
          : requests.length === 0  ? <EmptyState icon={UserPlus} message="No pending friend requests." />
          : (
            <div className="space-y-3">
              {requests.map((r: { senderId: string; username: string }) => (
                <div key={r.senderId} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                  <Avatar name={r.username} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{r.username}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4A5A70' }}>Sent you a friend request</div>
                  </div>
                  <div className="flex gap-2">
                    <MutationButton
                      isPending={acceptRequest.isPending && acceptRequest.variables === r.senderId}
                      label="Accept" pendingLabel="..."
                      onClick={() => handleAccept(r.senderId, r.username)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#00D4AA', color: '#0D0D0D' }}
                    />
                    <MutationButton
                      isPending={rejectRequest.isPending && rejectRequest.variables?.senderId === r.senderId}
                      label="Decline" pendingLabel="..."
                      onClick={() => handleReject(r.senderId, r.username)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Search / Find People ──────────────────────────────────────── */}
        {activeTab === 'search' && (
          <>
            <div className="relative mb-6 max-w-md">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }}
              />
            </div>

            {searchQuery.length < 2 ? (
              <EmptyState icon={Search} message="Type at least 2 characters to search." />
            ) : searchResult.isLoading ? (
              <LoadingSpinner label="Searching..." />
            ) : results.length === 0 ? (
              <EmptyState icon={UserX} message={`No users found for "${searchQuery}".`} />
            ) : (
              <div className="space-y-3">
                {results.map((u: { userID: string; username: string }) => (
                  <div key={u.userID} className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: '#1A1F2E', border: '1px solid #1E2A3A' }}>
                    <Avatar name={u.username} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{u.username}</div>
                    </div>
                    <MutationButton
                      isPending={sendRequest.isPending && sendRequest.variables === u.userID}
                      label="Add Friend" pendingLabel="Sending..."
                      onClick={() => handleSendRequest(u.userID, u.username)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#FFB800', color: '#0D0D0D' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
    style={{ background: '#FFB800' }}>
    {name.slice(0, 2).toUpperCase()}
  </div>
);

const EmptyState: React.FC<{ icon: React.ElementType; message: string }> = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#1E2A3A' }}>
      <Icon size={20} style={{ color: '#4A5A70' }} />
    </div>
    <p className="text-sm" style={{ color: '#4A5A70' }}>{message}</p>
  </div>
);

export default Friends;
