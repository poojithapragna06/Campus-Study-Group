import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5002';

export interface Message {
  _id?: string;
  message_id?: string;
  senderId?: string;
  sender_id?: string;
  senderName?: string;
  content: string;
  timestamp: string;
  fetchables?: string[];
  type?: 'text' | 'file';
  fileName?: string;
}

export function useChatSocket(id: string | null, mode: 'group' | 'private' = 'group') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const token = localStorage.getItem('token');
      
      if (mode === 'group') {
        socket.emit('join-group-chat', { groupChatId: id });
      } else {
        socket.emit('join-private-chat', { friendId: id, jwt: token });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // History
    socket.on(mode === 'group' ? 'chat-history' : 'private-chat-history', (history: Message[]) => {
      setMessages(history);
    });

    // New messages
    socket.on(mode === 'group' ? 'receive-message' : 'receive-private-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('deleted-post', ({ postId }: { postId: string }) => {
      setMessages((prev) => prev.filter(m => (m.message_id || (m as any)._id) !== postId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, mode]);

  const sendMessage = useCallback((content: string, fetchables: string[] = []) => {
    if (!socketRef.current || !id) return;

    const token = localStorage.getItem('token');
    let myId = '';
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        myId = String(payload.Uid);
      }
    } catch (e) {}

    const message: Message = {
      senderId: myId,
      sender_id: myId,
      content,
      fetchables,
      timestamp: new Date().toISOString(),
    };

    if (mode === 'group') {
      socketRef.current.emit('send-message', {
        groupChatId: id,
        message,
      });
    } else {
      socketRef.current.emit('send-private-message', {
        friendId: id,
        message,
        jwt: token,
      });
    }

    // Optimistic update
    setMessages((prev) => [...prev, message]);
  }, [id, mode]);

  return {
    messages,
    sendMessage,
    isConnected,
  };
}
