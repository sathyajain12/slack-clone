'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';
import styles from './chat.module.css';

// Common emoji reactions
const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

// Format timestamp
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Get initials from display name
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Check if file is an image
function isImage(fileType) {
    return fileType?.startsWith('image/');
}

export default function ChatPage() {
    const { user, loading: authLoading, logout, updateProfile } = useAuth();
    const {
        channels,
        currentChannel,
        currentDM,
        messages,
        setMessages,
        dmConversations,
        users,
        fetchChannels,
        fetchUsers,
        fetchDMConversations,
        selectChannel,
        selectDM,
        sendMessage,
        createChannel
    } = useChat();
    const { theme, toggleTheme } = useTheme();
    const {
        isConnected,
        typingUsers,
        joinChannel,
        leaveChannel,
        sendChannelMessage,
        startTyping,
        stopTyping,
        onNewMessage,
        emitReaction
    } = useSocket();

    const [messageInput, setMessageInput] = useState('');
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelDesc, setNewChannelDesc] = useState('');
    const [showUserList, setShowUserList] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [showProfile, setShowProfile] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileStatus, setProfileStatus] = useState('online');
    const [profileAvatar, setProfileAvatar] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const router = useRouter();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Fetch initial data
    useEffect(() => {
        if (user) {
            fetchChannels();
            fetchUsers();
            fetchDMConversations();
        }
    }, [user, fetchChannels, fetchUsers, fetchDMConversations]);

    // Join/leave channel rooms for Socket.IO
    useEffect(() => {
        if (currentChannel && isConnected) {
            joinChannel(currentChannel.id);
            return () => leaveChannel(currentChannel.id);
        }
    }, [currentChannel, isConnected, joinChannel, leaveChannel]);

    // Listen for new messages via Socket.IO
    useEffect(() => {
        if (!isConnected) return;

        const cleanup = onNewMessage((data) => {
            if (data.channelId === currentChannel?.id) {
                setMessages(prev => [...prev, data]);
            }
        });

        return cleanup;
    }, [isConnected, currentChannel, onNewMessage, setMessages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File too large. Maximum size is 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    // Upload file
    const uploadFile = async () => {
        if (!selectedFile) return null;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            return data.file;
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() && !selectedFile) return;

        let fileData = null;
        if (selectedFile) {
            fileData = await uploadFile();
            if (!fileData) return;
        }

        const message = await sendMessage(messageInput, fileData);

        // Emit to Socket.IO for real-time
        if (message && currentChannel) {
            sendChannelMessage(currentChannel.id, message);
        }

        setMessageInput('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle typing indicator
    const handleTyping = useCallback(() => {
        if (currentChannel) {
            startTyping({ channelId: currentChannel.id });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                stopTyping({ channelId: currentChannel.id });
            }, 2000);
        }
    }, [currentChannel, startTyping, stopTyping]);

    // Handle create channel
    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;

        const channel = await createChannel(newChannelName, newChannelDesc, false);
        if (channel) {
            setShowCreateChannel(false);
            setNewChannelName('');
            setNewChannelDesc('');
            selectChannel(channel);
        }
    };

    // Handle start DM
    const handleStartDM = (targetUser) => {
        selectDM(targetUser);
        setShowUserList(false);
    };

    // Handle search
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || searchQuery.length < 2) return;

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error('Search failed');

            const data = await res.json();
            setSearchResults(data.messages || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    // Handle reaction
    const handleReaction = async (messageId, emoji) => {
        try {
            const res = await fetch(`/api/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji })
            });

            if (!res.ok) throw new Error('Reaction failed');

            const data = await res.json();

            // Update local state
            setMessageReactions(prev => {
                const msgReactions = { ...prev[messageId] } || {};
                if (data.added) {
                    msgReactions[emoji] = (msgReactions[emoji] || 0) + 1;
                } else if (data.removed) {
                    msgReactions[emoji] = Math.max(0, (msgReactions[emoji] || 1) - 1);
                    if (msgReactions[emoji] === 0) delete msgReactions[emoji];
                }
                return { ...prev, [messageId]: msgReactions };
            });

            // Emit to socket
            if (currentChannel) {
                emitReaction({ channelId: currentChannel.id, messageId, emoji, ...data });
            }
        } catch (error) {
            console.error('Reaction error:', error);
        }
        setShowEmojiPicker(null);
    };

    // Get typing users for current channel
    const currentTypingUsers = currentChannel
        ? Object.keys(typingUsers[currentChannel.id] || {}).filter(id => id !== String(user?.id))
        : [];

    if (authLoading || !user) {
        return (
            <div className={styles.chatLayout}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💬</div>
                    <div className={styles.emptyTitle}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chatLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.workspaceHeader}>
                    <span className={styles.workspaceName}>COE Messenger</span>
                    <div className={styles.userStatus}>
                        <span className={`${styles.statusDot} ${isConnected ? '' : styles.offline}`}></span>
                    </div>
                </div>

                <div className={styles.sidebarContent}>
                    {/* Search Button */}
                    <button
                        className={styles.searchButton}
                        onClick={() => setShowSearch(true)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <span>Search messages</span>
                    </button>

                    {/* Channels Section */}
                    <div className={styles.sectionHeader}>
                        <span>Channels</span>
                        <button
                            className={styles.addButton}
                            onClick={() => setShowCreateChannel(true)}
                            title="Create channel"
                        >
                            ＋
                        </button>
                    </div>
                    <ul className={styles.channelList}>
                        {channels.map(channel => (
                            <li
                                key={channel.id}
                                className={`${styles.channelItem} ${currentChannel?.id === channel.id ? styles.active : ''}`}
                                onClick={() => selectChannel(channel)}
                            >
                                <span className={styles.channelIcon}>#</span>
                                <span className={styles.truncate}>{channel.name}</span>
                            </li>
                        ))}
                        {channels.length === 0 && (
                            <li className={styles.channelItem} style={{ opacity: 0.5, cursor: 'default' }}>
                                <span className={styles.channelIcon}>📭</span>
                                <span>No channels yet</span>
                            </li>
                        )}
                    </ul>

                    {/* Direct Messages Section */}
                    <div className={styles.sectionHeader} style={{ marginTop: '16px' }}>
                        <span>Direct Messages</span>
                        <button
                            className={styles.addButton}
                            onClick={() => setShowUserList(true)}
                            title="Start a DM"
                        >
                            ＋
                        </button>
                    </div>
                    <ul className={styles.channelList}>
                        {dmConversations.map(conv => (
                            <li
                                key={conv.user.id}
                                className={`${styles.dmItem} ${currentDM?.id === conv.user.id ? styles.active : ''}`}
                                onClick={() => selectDM(conv.user)}
                            >
                                <div className={styles.dmAvatar}>
                                    {getInitials(conv.user.displayName)}
                                    <span className={`${styles.dmAvatarStatus} ${conv.user.status === 'online' ? styles.online : ''}`}></span>
                                </div>
                                <div className={styles.dmInfo}>
                                    <div className={styles.dmName}>{conv.user.displayName}</div>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* User Footer - Clickable for Profile */}
                <div className={styles.userFooter}>
                    <div
                        className={styles.userAvatar}
                        onClick={() => {
                            setProfileName(user.displayName);
                            setProfileStatus(user.status || 'online');
                            setProfileAvatar(user.avatarUrl || '');
                            setShowProfile(true);
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Edit profile"
                    >
                        {getInitials(user.displayName)}
                    </div>
                    <div
                        className={styles.userInfo}
                        onClick={() => {
                            setProfileName(user.displayName);
                            setProfileStatus(user.status || 'online');
                            setProfileAvatar(user.avatarUrl || '');
                            setShowProfile(true);
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Edit profile"
                    >
                        <div className={styles.userName}>{user.displayName}</div>
                        <div className={styles.userRole}>{user.role}</div>
                    </div>
                    <button
                        className="themeToggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>
                    <button
                        className={styles.logoutButton}
                        onClick={logout}
                        title="Sign out"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className={styles.mainArea}>
                {(currentChannel || currentDM) ? (
                    <>
                        {/* Chat Header */}
                        <header className={styles.chatHeader}>
                            <div className={styles.chatTitle}>
                                {currentChannel ? (
                                    <>
                                        <span className={styles.chatName}>#{currentChannel.name}</span>
                                        {currentChannel.description && (
                                            <span className={styles.chatDescription}>{currentChannel.description}</span>
                                        )}
                                    </>
                                ) : (
                                    <span className={styles.chatName}>{currentDM.displayName}</span>
                                )}
                            </div>
                            {currentChannel && (
                                <div className={styles.memberCount}>
                                    👥 {currentChannel.members?.length || 0} members
                                </div>
                            )}
                        </header>

                        {/* Messages */}
                        <div className={styles.messagesContainer}>
                            {messages.length === 0 ? (
                                <div className={styles.welcomeMessage}>
                                    <div className={styles.welcomeIcon}>
                                        {currentChannel ? '📢' : '👋'}
                                    </div>
                                    <h2 className={styles.welcomeTitle}>
                                        {currentChannel
                                            ? `Welcome to #${currentChannel.name}!`
                                            : `Start a conversation with ${currentDM.displayName}`
                                        }
                                    </h2>
                                    <p className={styles.welcomeText}>
                                        {currentChannel
                                            ? 'This is the very beginning of the channel. Send a message to get started!'
                                            : 'Send a message to start your direct conversation.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={styles.message}
                                        onMouseEnter={() => setHoveredMessage(message.id)}
                                        onMouseLeave={() => {
                                            setHoveredMessage(null);
                                            setShowEmojiPicker(null);
                                        }}
                                    >
                                        <div className={styles.messageAvatar}>
                                            {getInitials(message.sender?.displayName)}
                                        </div>
                                        <div className={styles.messageContent}>
                                            <div className={styles.messageHeader}>
                                                <span className={styles.messageSender}>
                                                    {message.sender?.displayName || 'Unknown'}
                                                </span>
                                                <span className={styles.messageTime}>
                                                    {formatTime(message.createdAt)}
                                                </span>
                                            </div>
                                            <div className={styles.messageText}>{message.content}</div>

                                            {/* Attachments */}
                                            {message.attachments?.map(att => (
                                                <div key={att.id} className={styles.attachment}>
                                                    {isImage(att.fileType) ? (
                                                        <img src={att.fileUrl} alt={att.filename} className={styles.attachmentImage} />
                                                    ) : (
                                                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
                                                            📎 {att.filename}
                                                        </a>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Reactions */}
                                            {messageReactions[message.id] && Object.keys(messageReactions[message.id]).length > 0 && (
                                                <div className={styles.reactions}>
                                                    {Object.entries(messageReactions[message.id]).map(([emoji, count]) => (
                                                        <button
                                                            key={emoji}
                                                            className={styles.reactionBadge}
                                                            onClick={() => handleReaction(message.id, emoji)}
                                                        >
                                                            {emoji} {count}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Reaction Picker */}
                                        {hoveredMessage === message.id && (
                                            <div className={styles.messageActions}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                                >
                                                    😀
                                                </button>
                                                {showEmojiPicker === message.id && (
                                                    <div className={styles.emojiPicker}>
                                                        {EMOJI_OPTIONS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                className={styles.emojiOption}
                                                                onClick={() => handleReaction(message.id, emoji)}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                            {/* Typing Indicator */}
                            {currentTypingUsers.length > 0 && (
                                <div className={styles.typingIndicator}>
                                    <span className={styles.typingDots}>
                                        <span></span><span></span><span></span>
                                    </span>
                                    Someone is typing...
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className={styles.inputContainer}>
                            {/* File Preview */}
                            {selectedFile && (
                                <div className={styles.filePreview}>
                                    <span>{selectedFile.name}</span>
                                    <button onClick={() => setSelectedFile(null)}>×</button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className={styles.inputWrapper}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                />
                                <button
                                    type="button"
                                    className={styles.attachButton}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach file"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                    </svg>
                                </button>
                                <textarea
                                    className={styles.messageInput}
                                    placeholder={`Message ${currentChannel ? '#' + currentChannel.name : currentDM.displayName}`}
                                    value={messageInput}
                                    onChange={(e) => {
                                        setMessageInput(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    className={styles.sendButton}
                                    disabled={(!messageInput.trim() && !selectedFile) || uploading}
                                >
                                    {uploading ? '...' : '➤'}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h2 className={styles.emptyTitle}>Welcome to COE Messenger</h2>
                        <p className={styles.emptyText}>
                            Select a channel or start a direct message to begin chatting with your team.
                        </p>
                    </div>
                )}
            </main>

            {/* Create Channel Modal */}
            {showCreateChannel && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateChannel(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Create a channel</h2>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowCreateChannel(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateChannel}>
                            <input
                                type="text"
                                className={styles.modalInput}
                                placeholder="Channel name (e.g., exam-schedules)"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                autoFocus
                            />
                            <input
                                type="text"
                                className={styles.modalInput}
                                placeholder="Description (optional)"
                                value={newChannelDesc}
                                onChange={(e) => setNewChannelDesc(e.target.value)}
                            />
                            <button
                                type="submit"
                                className={styles.modalButton}
                                disabled={!newChannelName.trim()}
                            >
                                Create Channel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* User List Modal for DMs */}
            {showUserList && (
                <div className={styles.modalOverlay} onClick={() => setShowUserList(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Start a conversation</h2>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowUserList(false)}
                            >
                                ×
                            </button>
                        </div>
                        <ul className={styles.channelList}>
                            {users.filter(u => u.id !== user.id).map(targetUser => (
                                <li
                                    key={targetUser.id}
                                    className={styles.dmItem}
                                    onClick={() => handleStartDM(targetUser)}
                                >
                                    <div className={styles.dmAvatar}>
                                        {getInitials(targetUser.displayName)}
                                        <span className={`${styles.dmAvatarStatus} ${targetUser.status === 'online' ? styles.online : ''}`}></span>
                                    </div>
                                    <div className={styles.dmInfo}>
                                        <div className={styles.dmName}>{targetUser.displayName}</div>
                                        <div className={styles.dmStatus}>@{targetUser.username}</div>
                                    </div>
                                </li>
                            ))}
                            {users.filter(u => u.id !== user.id).length === 0 && (
                                <li className={styles.channelItem} style={{ opacity: 0.5, cursor: 'default' }}>
                                    <span>No other users yet</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Search Modal */}
            {showSearch && (
                <div className={styles.modalOverlay} onClick={() => setShowSearch(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Search Messages</h2>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowSearch(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSearch}>
                            <input
                                type="text"
                                className={styles.modalInput}
                                placeholder="Search for messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className={styles.modalButton}>
                                Search
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className={styles.searchResults}>
                                {searchResults.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={styles.searchResult}
                                        onClick={() => {
                                            selectChannel(msg.channel);
                                            setShowSearch(false);
                                        }}
                                    >
                                        <div className={styles.searchResultHeader}>
                                            <span className={styles.searchResultChannel}>#{msg.channel?.name}</span>
                                            <span className={styles.searchResultTime}>{formatTime(msg.createdAt)}</span>
                                        </div>
                                        <div className={styles.searchResultContent}>{msg.content}</div>
                                        <div className={styles.searchResultSender}>— {msg.sender?.displayName}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Profile Edit Modal */}
            {showProfile && (
                <div className={styles.modalOverlay} onClick={() => setShowProfile(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Edit Profile</h2>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowProfile(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!profileName.trim()) return;

                            setProfileSaving(true);
                            try {
                                await updateProfile({
                                    displayName: profileName,
                                    status: profileStatus,
                                    avatarUrl: profileAvatar || null
                                });
                                setShowProfile(false);
                            } catch (error) {
                                alert(error.message);
                            } finally {
                                setProfileSaving(false);
                            }
                        }}>
                            {/* Hidden file input for avatar */}
                            <input
                                type="file"
                                ref={avatarInputRef}
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (file.size > 2 * 1024 * 1024) {
                                        alert('Image must be less than 2MB');
                                        return;
                                    }

                                    setAvatarUploading(true);
                                    try {
                                        const formData = new FormData();
                                        formData.append('file', file);

                                        const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData
                                        });

                                        if (!res.ok) throw new Error('Upload failed');

                                        const data = await res.json();
                                        setProfileAvatar(data.file.fileUrl);
                                    } catch (error) {
                                        console.error('Avatar upload error:', error);
                                        alert('Failed to upload image');
                                    } finally {
                                        setAvatarUploading(false);
                                    }
                                }}
                            />

                            <div
                                className={styles.profileAvatarLarge}
                                onClick={() => avatarInputRef.current?.click()}
                                title="Click to change photo"
                            >
                                {profileAvatar ? (
                                    <img src={profileAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                                ) : (
                                    getInitials(profileName)
                                )}
                                <div className={styles.avatarOverlay}>
                                    {avatarUploading ? (
                                        <span>...</span>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    )}
                                </div>
                                {profileAvatar && (
                                    <button
                                        type="button"
                                        className={styles.removeAvatarBadge}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProfileAvatar('');
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <p className={styles.avatarHint}>Click avatar to upload photo</p>

                            <label className={styles.inputLabel}>Display Name</label>
                            <input
                                type="text"
                                className={styles.modalInput}
                                placeholder="Your display name"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                maxLength={50}
                            />

                            <label className={styles.inputLabel}>Status</label>
                            <div className={styles.statusOptions}>
                                <button
                                    type="button"
                                    className={`${styles.statusOption} ${profileStatus === 'online' ? styles.active : ''}`}
                                    onClick={() => setProfileStatus('online')}
                                >
                                    <span className={styles.statusIndicator} style={{ background: 'var(--status-online)' }}></span>
                                    Online
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.statusOption} ${profileStatus === 'away' ? styles.active : ''}`}
                                    onClick={() => setProfileStatus('away')}
                                >
                                    <span className={styles.statusIndicator} style={{ background: 'var(--status-away)' }}></span>
                                    Away
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.statusOption} ${profileStatus === 'offline' ? styles.active : ''}`}
                                    onClick={() => setProfileStatus('offline')}
                                >
                                    <span className={styles.statusIndicator} style={{ background: 'var(--status-offline)' }}></span>
                                    Invisible
                                </button>
                            </div>

                            <button
                                type="submit"
                                className={styles.modalButton}
                                disabled={!profileName.trim() || profileSaving}
                            >
                                {profileSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
