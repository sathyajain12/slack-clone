'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Connect to Socket.IO server
        const socketInstance = io({
            autoConnect: true,
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            socketInstance.emit('user-join', user.id);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        // Handle typing indicators
        socketInstance.on('user-typing', (data) => {
            setTypingUsers(prev => ({
                ...prev,
                [data.channelId || 'dm']: {
                    ...prev[data.channelId || 'dm'],
                    [data.userId]: true
                }
            }));
        });

        socketInstance.on('user-stopped-typing', (data) => {
            setTypingUsers(prev => {
                const key = data.channelId || 'dm';
                const updated = { ...prev };
                if (updated[key]) {
                    delete updated[key][data.userId];
                }
                return updated;
            });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    const joinChannel = useCallback((channelId) => {
        if (socket) {
            socket.emit('join-channel', channelId);
        }
    }, [socket]);

    const leaveChannel = useCallback((channelId) => {
        if (socket) {
            socket.emit('leave-channel', channelId);
        }
    }, [socket]);

    const joinDM = useCallback((recipientId) => {
        if (socket) {
            socket.emit('join-dm', recipientId);
        }
    }, [socket]);

    const sendChannelMessage = useCallback((channelId, message) => {
        if (socket) {
            socket.emit('channel-message', { channelId, ...message });
        }
    }, [socket]);

    const sendDMMessage = useCallback((senderId, recipientId, message) => {
        if (socket) {
            socket.emit('dm-message', { senderId, recipientId, ...message });
        }
    }, [socket]);

    const startTyping = useCallback((data) => {
        if (socket) {
            socket.emit('typing-start', data);
        }
    }, [socket]);

    const stopTyping = useCallback((data) => {
        if (socket) {
            socket.emit('typing-stop', data);
        }
    }, [socket]);

    const emitReaction = useCallback((data) => {
        if (socket) {
            socket.emit('reaction-added', data);
        }
    }, [socket]);

    const onNewMessage = useCallback((callback) => {
        if (socket) {
            socket.on('new-message', callback);
            return () => socket.off('new-message', callback);
        }
    }, [socket]);

    const onNewDM = useCallback((callback) => {
        if (socket) {
            socket.on('new-dm', callback);
            return () => socket.off('new-dm', callback);
        }
    }, [socket]);

    const onNewReaction = useCallback((callback) => {
        if (socket) {
            socket.on('new-reaction', callback);
            return () => socket.off('new-reaction', callback);
        }
    }, [socket]);

    const onUserOnline = useCallback((callback) => {
        if (socket) {
            socket.on('user-online', callback);
            return () => socket.off('user-online', callback);
        }
    }, [socket]);

    const onUserOffline = useCallback((callback) => {
        if (socket) {
            socket.on('user-offline', callback);
            return () => socket.off('user-offline', callback);
        }
    }, [socket]);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            typingUsers,
            joinChannel,
            leaveChannel,
            joinDM,
            sendChannelMessage,
            sendDMMessage,
            startTyping,
            stopTyping,
            emitReaction,
            onNewMessage,
            onNewDM,
            onNewReaction,
            onUserOnline,
            onUserOffline
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
