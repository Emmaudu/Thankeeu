import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('taskeeu_token');
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('user_online', ({ user_id }) => {
      setOnlineUsers((prev) => new Set([...prev, user_id]));
    });

    newSocket.on('user_offline', ({ user_id }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(user_id);
        return next;
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  const isOnline = (userId) => onlineUsers.has(userId);

  const joinRoom = (roomId) => socket?.emit('join_room', roomId);
  const leaveRoom = (roomId) => socket?.emit('leave_room', roomId);
  const sendTyping = (roomId, isTyping) => socket?.emit('typing', { room_id: roomId, is_typing: isTyping });

  return (
    <SocketContext.Provider value={{
      socket, onlineUsers, isOnline, unreadCount, setUnreadCount,
      joinRoom, leaveRoom, sendTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
