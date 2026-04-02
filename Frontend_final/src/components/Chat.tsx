import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, Users, Lock, BookOpen, RefreshCw } from 'lucide-react';
import { currentUser } from '../data/mockData';
import { StudyGroup } from '../types';
import { useGroups, useMessages, useSendMessage } from '../hooks/useQueries';
import { Skeleton } from './ui';
import { format } from 'date-fns';

interface ChatProps {
  selectedGroup: StudyGroup | null;
  setSelectedGroup: (g: StudyGroup) => void;
}

const Chat: React.FC<ChatProps> = ({ selectedGroup, setSelectedGroup }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: groups = [] } = useGroups();
  const myGroups = groups.filter(g => g.members.some(m => m.id === currentUser.id));

  const activeGroup: StudyGroup | null = selectedGroup ?? myGroups[0] ?? null;

  const { data: msgs = [], isLoading: msgsLoading, isFetching } = useMessages(activeGroup?.id ?? '');
  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const handleSend = () => {
    if (!input.trim() || !activeGroup) return;
    sendMessage.mutate({
      groupId: activeGroup.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: input,
      timestamp: new Date().toISOString(),
      type: 'text',
    });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-screen overflow-hidden animate-[slideIn_0.3s_ease-out]">
      {/* Group Sidebar */}
      <div className="w-64 flex flex-col flex-shrink-0" style={{ background: '#111827', borderRight: '1px solid #1E2A3A' }}>
        <div className="p-4">
          <h2 className="font-display font-bold text-white mb-3">Messages</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5A70' }} />
            <input placeholder="Search…" className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: '#1E2A3A', border: '1px solid #2A3A50', color: '#E8EDF4' }} />
          </div>
        </div>
        <div className="px-3 mb-1">
          <span className="text-xs font-medium uppercase tracking-widest px-2" style={{ color: '#4A5A70' }}>My Groups</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
          {myGroups.map(group => {
            const isActive = activeGroup?.id === group.id;
            return (
              <button key={group.id} onClick={() => setSelectedGroup(group)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                style={{ background: isActive ? 'rgba(255,184,0,0.08)' : 'transparent', borderLeft: isActive ? `2px solid ${group.coverColor}` : '2px solid transparent' }}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: group.coverColor + '20' }}>
                  <BookOpen size={14} style={{ color: group.coverColor }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-white truncate">{group.name}</span>
                    {group.isPrivate && <Lock size={9} style={{ color: '#4A5A70' }} />}
                  </div>
                  <div className="text-xs truncate" style={{ color: '#4A5A70' }}>{group.members.length} members</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {!activeGroup ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: '#4A5A70' }}>Select a group to start chatting</div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ background: '#1A1F2E', borderBottom: '1px solid #1E2A3A' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: activeGroup.coverColor + '25' }}>
                <BookOpen size={16} style={{ color: activeGroup.coverColor }} />
              </div>
              <div>
                <div className="font-display font-semibold text-white text-sm">{activeGroup.name}</div>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#4A5A70' }}>
                  <Users size={10} />{activeGroup.members.length} members
                  {activeGroup.isPrivate && <><Lock size={9} /> Private</>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isFetching && !msgsLoading && (
                <RefreshCw size={13} className="animate-spin" style={{ color: '#4A5A70' }} />
              )}
              <div className="flex items-center gap-1">
                {activeGroup.members.slice(0, 5).map(m => (
                  <div key={m.id} className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-black"
                    style={{ background: '#FFB800', fontSize: '9px' }}>
                    {m.avatar}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-1">
            {msgsLoading ? (
              <div className="space-y-4 pt-4">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                    <Skeleton className="w-8 h-8 flex-shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className={`h-10 ${i % 2 === 0 ? 'w-48' : 'w-36'} rounded-2xl`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : msgs.map((msg, i) => {
              const isMine = msg.senderId === currentUser.id;
              const prevMsg = msgs[i - 1];
              const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId;
              const time = format(new Date(msg.timestamp), 'h:mm a');

              return (
                <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-0.5'}`}>
                  {showHeader ? (
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-black self-start"
                      style={{ background: isMine ? '#FFB800' : '#00D4AA' }}>
                      {msg.senderAvatar}
                    </div>
                  ) : <div className="w-8 flex-shrink-0" />}

                  <div className={`max-w-xs flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {showHeader && (
                      <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-medium text-white">{isMine ? 'You' : msg.senderName}</span>
                        <span className="text-xs" style={{ color: '#4A5A70' }}>{time}</span>
                      </div>
                    )}
                    {msg.type === 'file' ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: isMine ? 'rgba(255,184,0,0.15)' : '#1E2A3A', border: `1px solid ${isMine ? '#FFB80040' : '#2A3A50'}` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFB80020' }}>
                          <Paperclip size={14} style={{ color: '#FFB800' }} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">{msg.fileName}</div>
                          <div className="text-xs" style={{ color: '#4A5A70' }}>{msg.fileSize}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{ background: isMine ? '#FFB800' : '#1E2A3A', color: isMine ? '#0D0D0D' : '#E8EDF4' }}>
                        {msg.content}
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
              <button className="flex-shrink-0" style={{ color: '#4A5A70' }}><Paperclip size={17} /></button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={`Message #${activeGroup.name.toLowerCase().replace(/ /g, '-')}…`}
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#E8EDF4' }} />
              <button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                style={{ background: input.trim() ? '#FFB800' : '#2A3A50', color: input.trim() ? '#0D0D0D' : '#4A5A70' }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
