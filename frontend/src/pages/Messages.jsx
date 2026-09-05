import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import {
  Send,
  Search,
  Check,
  CheckCheck,
  User,
  MessageSquare,
  Clock,
  Sparkles,
  X,
  Smile,
  Paperclip,
} from 'lucide-react';

const Messages = () => {
  const outlet = useOutletContext();
  const [user, setUser] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const {
    socket,
    isConnected,
    onlineUsers,
    emitTyping,
    emitStopTyping,
    sendSocketMessage,
    readConversation,
  } = useSocket();

  const messagesEndRef = useRef(null);
  const userRef = useRef(null);
  const selectedRef = useRef(null);
  const userIsTypingRef = useRef(false);
  const stopTypingTimeoutRef = useRef(null);
  const partnerTypingTimeoutRef = useRef(null);

  // Sync user state
  useEffect(() => {
    const activeUser = outlet?.currentUser || JSON.parse(localStorage.getItem('thesisSphereUser') || 'null');
    if (activeUser) {
      setUser(activeUser);
      userRef.current = activeUser;
    }
  }, [outlet?.currentUser]);

  // Keep selectedRef synced with selected state
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userRef.current?.token}`,
  }), []);

  const fetchInbox = useCallback(async () => {
    if (!userRef.current?.token) return;
    try {
      const res = await fetch('/api/messages/inbox', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setInbox(data.data || []);
    } catch (err) {
      console.error('Inbox load failed', err);
    }
  }, [authHeaders]);

  const fetchAllUsers = useCallback(async () => {
    if (!userRef.current?.token) return;
    try {
      const res = await fetch('/api/users', { headers: authHeaders() });
      const data = await res.json();
      if (data && data.data) {
        const list = data.data.filter((u) => u._id !== userRef.current?._id);
        setAllUsers(list);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (user?.token) {
      fetchInbox();
      fetchAllUsers();
    }
  }, [user?.token, fetchInbox, fetchAllUsers]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [conversation, isPartnerTyping]);

  const markConversationReadApi = useCallback(async (participantId) => {
    if (!participantId || !userRef.current?.token) return;
    try {
      await fetch(`/api/messages/conversation/${participantId}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      window.dispatchEvent(new Event('update_unread_messages'));
    } catch (err) {
      console.error('Mark conversation read failed', err);
    }
  }, [authHeaders]);

  const openConversation = useCallback(async (participant) => {
    setSelected(participant);
    selectedRef.current = participant;
    setIsPartnerTyping(false);

    const participantId = participant.participant?._id || participant._id;

    try {
      setConvLoading(true);
      const res = await fetch(`/api/messages/conversation/${participantId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setConversation(data.data || []);
      }

      // Mark unread messages as read both over socket and API
      readConversation(participantId);
      markConversationReadApi(participantId);

      // Update local inbox state to remove unread badge
      setInbox((prev) =>
        prev.map((item) => {
          const itemId = item.participant?._id || item._id;
          if (itemId === participantId) {
            return { ...item, isRead: true };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Conversation load failed', err);
    } finally {
      setConvLoading(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [authHeaders, readConversation, markConversationReadApi]);

  // Real-time socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const currentUserId = userRef.current?._id;
      const activeParticipant = selectedRef.current;
      const activeId = activeParticipant?.participant?._id || activeParticipant?._id;

      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;

      const isCurrentConversation = activeId && (senderId === activeId || receiverId === activeId);

      if (isCurrentConversation) {
        setConversation((prev) => {
          // If already has this message by real ID, don't duplicate
          if (prev.some((m) => m._id === msg._id)) return prev;
          // Filter out optimistic temporary message if matching
          const filtered = prev.filter(
            (m) => !(m.isPending && m.message === msg.message && (m.sender?._id || m.sender) === senderId)
          );
          return [...filtered, msg];
        });

        // If message is from partner to current user, mark as read immediately
        if (senderId === activeId && receiverId === currentUserId) {
          readConversation(activeId);
          markConversationReadApi(activeId);
        }
      }

      // Real-time inbox update
      setInbox((prevInbox) => {
        const otherUserId = senderId === currentUserId ? receiverId : senderId;
        const existingIndex = prevInbox.findIndex(
          (item) => (item.participant?._id || item._id) === otherUserId
        );

        const isForActiveChat = activeId === otherUserId;
        const isUnread = !isForActiveChat && receiverId === currentUserId;

        if (existingIndex !== -1) {
          const existing = prevInbox[existingIndex];
          const updatedItem = {
            ...existing,
            lastMessage: msg.message,
            lastMessageId: msg._id,
            createdAt: msg.createdAt,
            isRead: !isUnread,
          };
          const rest = prevInbox.filter((_, idx) => idx !== existingIndex);
          return [updatedItem, ...rest];
        } else {
          // New conversation not yet in inbox: reload inbox
          fetchInbox();
          return prevInbox;
        }
      });
    };

    const handleConversationRead = ({ readerId }) => {
      const activeParticipant = selectedRef.current;
      const activeId = activeParticipant?.participant?._id || activeParticipant?._id;

      if (activeId === readerId) {
        setConversation((prev) =>
          prev.map((m) => {
            const senderId = m.sender?._id || m.sender;
            if (senderId === userRef.current?._id) {
              return { ...m, isRead: true };
            }
            return m;
          })
        );
      }

      setInbox((prev) =>
        prev.map((item) => {
          const itemId = item.participant?._id || item._id;
          if (itemId === readerId) {
            return { ...item, isRead: true };
          }
          return item;
        })
      );
    };

    const handleMessageRead = ({ messageId }) => {
      setConversation((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRead: true } : m))
      );
    };

    const handleUserTyping = ({ senderId }) => {
      const activeParticipant = selectedRef.current;
      const activeId = activeParticipant?.participant?._id || activeParticipant?._id;

      if (activeId === senderId) {
        setIsPartnerTyping(true);
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
        partnerTypingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3000);
      }
    };

    const handleUserStopTyping = ({ senderId }) => {
      const activeParticipant = selectedRef.current;
      const activeId = activeParticipant?.participant?._id || activeParticipant?._id;

      if (activeId === senderId) {
        setIsPartnerTyping(false);
        if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_read', handleConversationRead);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_read', handleConversationRead);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
    };
  }, [socket, fetchInbox, readConversation, markConversationReadApi]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    const activeParticipant = selectedRef.current;
    const activeId = activeParticipant?.participant?._id || activeParticipant?._id;
    if (!activeId) return;

    if (!userIsTypingRef.current && val.trim().length > 0) {
      userIsTypingRef.current = true;
      emitTyping(activeId);
    }

    if (stopTypingTimeoutRef.current) clearTimeout(stopTypingTimeoutRef.current);

    stopTypingTimeoutRef.current = setTimeout(() => {
      if (userIsTypingRef.current) {
        userIsTypingRef.current = false;
        emitStopTyping(activeId);
      }
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selected || !text.trim()) return;

    const messageText = text.trim();
    const activeId = selected.participant?._id || selected._id;

    // Reset typing status immediately
    if (userIsTypingRef.current) {
      userIsTypingRef.current = false;
      emitStopTyping(activeId);
      if (stopTypingTimeoutRef.current) clearTimeout(stopTypingTimeoutRef.current);
    }

    // Clear input immediately for zero lag feeling
    setText('');

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: user,
      receiver: selected.participant || selected,
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true,
    };

    setConversation((prev) => [...prev, optimisticMessage]);

    try {
      // Attempt sending via socket first
      let sentSuccess = false;
      if (isConnected && socket) {
        const socketRes = await sendSocketMessage({
          receiverId: activeId,
          message: messageText,
        });
        if (socketRes?.success && socketRes?.data) {
          sentSuccess = true;
          setConversation((prev) =>
            prev.map((m) => (m._id === tempId ? socketRes.data : m))
          );
        }
      }

      // Fallback to HTTP POST if socket is not available or failed
      if (!sentSuccess) {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ receiver: activeId, message: messageText }),
        });
        const data = await res.json();
        if (data.success) {
          setConversation((prev) =>
            prev.map((m) => (m._id === tempId ? data.data : m))
          );
        } else {
          // Remove optimistic message if both failed
          setConversation((prev) => prev.filter((m) => m._id !== tempId));
          alert(data.message || 'Failed to send message');
        }
      }
    } catch (err) {
      console.error('Send failed', err);
      setConversation((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedParticipantId = selected?.participant?._id || selected?._id;
  const selectedParticipantName = selected?.participant?.fullName || selected?.fullName || selected?.name || selected?.email || '';
  const selectedParticipantEmail = selected?.participant?.email || selected?.email || '';
  const selectedParticipantRole = selected?.participant?.role || selected?.role || '';
  const isSelectedOnline = selectedParticipantId ? onlineUsers.has(selectedParticipantId) : false;

  // Filtered users for search
  const filteredUsers = allUsers.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return false;
    const name = (u.fullName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-140px)] min-w-0 gap-6 overflow-x-auto antialiased">
      {/* Left Sidebar: Inbox & Directory */}
      <div className="w-[clamp(14rem,28vw,24rem)] flex-[0_1_24rem] min-w-56 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        {/* Inbox Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Messages
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Real-time Live' : 'Connecting...'}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people by name or email..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User Directory Results when Searching */}
        {search.trim() !== '' ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              People ({filteredUsers.length})
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No users found matching "{search}"
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isOnline = onlineUsers.has(u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => {
                      openConversation(u);
                      setSearch('');
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3 group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                        {(u.fullName || u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {u.fullName || u.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                          {u.role || 'Member'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{u.email}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Normal Inbox Conversations List */
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
            {inbox.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Use the search box above to find faculty, supervisors, or students and start chatting.
                </p>
              </div>
            ) : (
              inbox.map((item) => {
                const participant = item.participant || {};
                const participantId = participant._id || item.lastMessageId;
                const isSelected = selectedParticipantId === participant._id;
                const isOnline = onlineUsers.has(participant._id);
                const isUnread = !item.isRead && participant._id !== user?._id;

                return (
                  <div
                    key={participantId}
                    onClick={() => openConversation(item)}
                    className={`p-3.5 cursor-pointer flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-900/20 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-blue-600 dark:to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {(participant.fullName || participant.email || '?').charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {participant.fullName || participant.email}
                        </h4>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.lastMessage || 'Sent an attachment'}
                        </p>
                        {isUnread && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full flex-shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Right Area: Conversation Pane */}
      <div className="flex-[1_1_0%] min-w-[22rem] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        {!selected ? (
          /* Empty State when no conversation is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Real-Time Messaging</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Select a conversation from the left or search for someone to start chatting with live delivery and read receipts.
            </p>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {selectedParticipantName.charAt(0).toUpperCase()}
                  </div>
                  {isSelectedOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedParticipantName}
                    </h3>
                    {selectedParticipantRole && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                        {selectedParticipantRole}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{selectedParticipantEmail}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className={`text-xs flex items-center gap-1 ${isSelectedOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelectedOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {isSelectedOnline ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-900/30">
              {convLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Loading conversation...
                </div>
              ) : conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <Sparkles className="w-8 h-8 text-blue-400 mb-2 opacity-80" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Start the conversation</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Say hello to {selectedParticipantName}!
                  </p>
                </div>
              ) : (
                conversation.map((m) => {
                  const senderId = m.sender?._id || m.sender;
                  const isMe = senderId === user?._id;

                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-all`}
                    >
                      <div
                        className={`max-w-[72%] px-4 py-2.5 shadow-sm text-sm break-words ${
                          isMe
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none'
                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-600/50 rounded-2xl rounded-tl-none'
                        }`}
                      >
                        <div className="leading-relaxed whitespace-pre-wrap">{m.message}</div>
                      </div>

                      {/* Timestamp & Read Receipts */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 px-1">
                        <span>
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>

                        {isMe && (
                          <span className="ml-0.5" title={m.isPending ? 'Sending...' : m.isRead ? 'Read' : 'Delivered'}>
                            {m.isPending ? (
                              <Clock className="w-3 h-3 text-slate-400 animate-spin" />
                            ) : m.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Live Partner Typing Indicator */}
              {isPartnerTyping && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs py-1">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                    {selectedParticipantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{selectedParticipantName} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="p-3.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/80">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Write a message to ${selectedParticipantName}...`}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={!text.trim()}
                  className={`p-2.5 rounded-xl font-medium flex items-center justify-center transition-all ${
                    text.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-95 active:scale-95'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
