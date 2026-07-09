import React, { useEffect, useState, useRef } from 'react';

const Messages = () => {
  const [user, setUser] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('thesisSphereUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (user) fetchInbox();
    if (user) fetchAllUsers();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user?.token}`,
  });

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/messages/inbox', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setInbox(data.data || []);
    } catch (err) {
      console.error('Inbox load failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: authHeaders() });
      const data = await res.json();
      if (data && data.data) {
        // exclude current user
        const list = data.data.filter((u) => u._id !== user?._id);
        setAllUsers(list);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const openConversation = async (participant) => {
    setSelected(participant);
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/conversation/${participant.participant?._id || participant._id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setConversation(data.data || []);
        // Mark unread messages as read where current user is receiver
        data.data.forEach((m) => {
          if (!m.isRead && m.receiver === user._id) {
            markAsRead(m._id);
          }
        });
      }
    } catch (err) {
      console.error('Conversation load failed', err);
    } finally {
      setLoading(false);
      fetchInbox();
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selected || !text.trim()) return;

    try {
      setLoading(true);
      const receiverId = selected.participant?._id || selected._id;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ receiver: receiverId, message: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setText('');
        // reload conversation and inbox
        await openConversation(selected);
        await fetchInbox();
      } else {
        alert(data.message || 'Failed to send');
      }
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left: Inbox / Contacts */}
      <div className="w-1/3 bg-white rounded-lg shadow p-4 overflow-y-auto text-slate-900" style={{ maxHeight: '78vh' }}>
        <h2 className="text-lg font-semibold mb-3 text-black">Inbox</h2>
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email"
            className="w-full border rounded p-2 text-black placeholder:text-slate-500"
          />
          {search.trim() !== '' && (
            <div className="mt-2 max-h-40 overflow-y-auto border rounded bg-white">
              {allUsers.filter(u => {
                const q = search.toLowerCase();
                return (u.fullName || u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
              }).map(u => (
                <div key={u._id} className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => openConversation(u)}>
                  <div>
                    <div className="font-medium text-black">{u.fullName || u.name || u.email}</div>
                    <div className="text-xs text-slate-600">{u.email}</div>
                  </div>
                  <div className="text-sm text-slate-500">{u.role}</div>
                </div>
              ))}
              {allUsers.filter(u => {
                const q = search.toLowerCase();
                return (u.fullName || u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
              }).length === 0 && (
                <div className="p-2 text-sm text-slate-600">No users found</div>
              )}
            </div>
          )}
        </div>
        {loading && !inbox.length ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : inbox.length === 0 ? (
          <p className="text-sm text-slate-600">No messages yet</p>
        ) : (
          <ul>
            {inbox.map((item) => {
              const participant = item.participant || {};
              return (
                <li
                  key={participant._id || item.lastMessageId}
                  className={`p-3 rounded hover:bg-slate-50 cursor-pointer flex justify-between items-start ${selected && ((selected.participant && selected.participant._id) || selected._id) === participant._id ? 'bg-slate-100' : ''}`}
                  onClick={() => openConversation(item)}
                >
                  <div>
                    <div className="font-medium text-black">{participant.fullName || participant.email}</div>
                    <div className="text-sm text-slate-700 truncate" style={{ maxWidth: '220px' }}>{item.lastMessage}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
                    {!item.isRead && item.participant && item.participant._id !== user?._id && (
                      <div className="mt-2 inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full">New</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Right: Conversation */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col text-slate-900" style={{ maxHeight: '78vh' }}>
        <div className="border-b pb-3 mb-3">
          <h2 className="text-lg font-semibold text-black">{selected ? (selected.participant?.fullName || selected.fullName || 'Conversation') : 'Select a conversation'}</h2>
          <div className="text-sm text-slate-600">{selected?.participant?.email || ''}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-2" style={{ minHeight: 0 }}>
          {!selected ? (
            <div className="h-full flex items-center justify-center text-slate-600">Choose a conversation to start</div>
          ) : (
            <div className="space-y-3">
              {conversation.map((m) => (
                <div key={m._id} className={`flex ${m.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.sender._id === user?._id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'} rounded-xl p-3 max-w-[70%]`}>
                    <div className="text-sm">{m.message}</div>
                    <div className="text-xs text-slate-400 mt-1 text-right">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Send box */}
        <form onSubmit={sendMessage} className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={selected ? `Message ${selected.participant?.fullName || selected.fullName || ''}` : 'Select a conversation'}
              className="flex-1 border rounded p-2 text-black placeholder:text-slate-500"
              disabled={!selected}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={!selected || !text.trim() || loading}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Messages;
