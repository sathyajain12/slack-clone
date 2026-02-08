'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [currentDM, setCurrentDM] = useState(null);
    const [messages, setMessages] = useState([]);
    const [dmConversations, setDmConversations] = useState([]);
    const [users, setUsers] = useState([]);

    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch('/api/channels');
            if (res.ok) {
                const data = await res.json();
                setChannels(data.channels);
            }
        } catch (error) {
            console.error('Failed to fetch channels:', error);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, []);

    const fetchDMConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/dm');
            if (res.ok) {
                const data = await res.json();
                setDmConversations(data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch DM conversations:', error);
        }
    }, []);

    const selectChannel = useCallback(async (channel) => {
        setCurrentChannel(channel);
        setCurrentDM(null);
        setMessages([]);

        try {
            const res = await fetch(`/api/channels/${channel.id}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }, []);

    const selectDM = useCallback(async (user) => {
        setCurrentDM(user);
        setCurrentChannel(null);
        setMessages([]);

        try {
            const res = await fetch(`/api/dm/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch DM messages:', error);
        }
    }, []);

    const sendMessage = useCallback(async (content) => {
        if (!content.trim()) return;

        try {
            let res;
            if (currentChannel) {
                res = await fetch(`/api/channels/${currentChannel.id}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
            } else if (currentDM) {
                res = await fetch(`/api/dm/${currentDM.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
            }

            if (res && res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.message]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }, [currentChannel, currentDM]);

    const createChannel = useCallback(async (name, description, isPrivate) => {
        try {
            const res = await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isPrivate })
            });

            if (res.ok) {
                const data = await res.json();
                setChannels(prev => [...prev, data.channel]);
                return data.channel;
            }
        } catch (error) {
            console.error('Failed to create channel:', error);
        }
        return null;
    }, []);

    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    return (
        <ChatContext.Provider value={{
            channels,
            currentChannel,
            currentDM,
            messages,
            dmConversations,
            users,
            fetchChannels,
            fetchUsers,
            fetchDMConversations,
            selectChannel,
            selectDM,
            sendMessage,
            createChannel,
            addMessage,
            setMessages
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
