// frontend/src/components/AdminChatWidget.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import API from '../api';

const AdminChatWidget = memo(() => {
  // 'closed' | 'list' | 'chat'  — always starts at 'closed'
  const [view, setView] = useState('closed');
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const listPollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll conversations when in list view
  useEffect(() => {
    if (view === 'list') {
      fetchConversations();
      listPollRef.current = setInterval(fetchConversations, 5000);
    } else {
      clearInterval(listPollRef.current);
    }
    return () => clearInterval(listPollRef.current);
  }, [view]);

  // Poll messages when in chat view
  useEffect(() => {
    if (view === 'chat' && selectedUser) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [view, selectedUser]);

  // Always poll unread badge (even when widget is closed)
  useEffect(() => {
    fetchUnreadBadge();
    const badgePoll = setInterval(fetchUnreadBadge, 5000);
    return () => clearInterval(badgePoll);
  }, []);

  const fetchUnreadBadge = async () => {
    try {
      const res = await API.get('/api/chat/unread-count');
      setTotalUnread(res.data.unreadCount || 0);
    } catch { /* silent */ }
  };

  const fetchConversations = async () => {
    try {
      const res = await API.get('/api/chat/conversations');
      setConversations(res.data);
      const total = res.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch { /* silent */ }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    try {
      const res = await API.get(`/api/chat/messages?userId=${selectedUser._id}`);
      setMessages(res.data);
      await API.put(`/api/chat/mark-read/${selectedUser._id}`);
    } catch { /* silent */ }
  };

  const handleSelectUser = (conv) => {
    const user = conv._id;
    setSelectedUser(user);
    setMessages([]);
    setView('chat');
  };

  const handleBackToList = () => {
    clearInterval(pollRef.current);
    setView('list');
    setSelectedUser(null);
    setMessages([]);
    setNewMessage('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !selectedUser) return;

    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: 'admin',
      message: newMessage.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      _optimistic: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    const msgText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      await API.post('/api/chat/send', {
        message: msgText,
        recipientId: selectedUser._id,
      });
      await fetchMessages();
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
      setNewMessage(msgText);
    } finally {
      setLoading(false);
    }
  };

  // ─── CLOSED: FAB button only ──────────────────────────────────────────────────
  if (view === 'closed') {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        <button
          onClick={() => setView('list')}
          className="w-14 h-14 bg-nirshux-accent hover:bg-nirshux-accent/90 rounded-full flex items-center justify-center shadow-2xl shadow-nirshux-accent/30 transition-all hover:scale-110 active:scale-95 relative"
          aria-label="Open admin inbox"
        >
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-pulse pointer-events-none">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Shared panel wrapper styles
  const panelStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    width: '380px',
    maxWidth: 'calc(100vw - 2rem)',
  };

  const panelClass = "bg-[#0B0E11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200";

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div style={panelStyle}>
        <div className={panelClass} style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-nirshux-accent px-4 py-3 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-black font-black text-sm uppercase tracking-tight">Admin Inbox</h3>
              <p className="text-black/60 text-[9px] font-mono uppercase tracking-wider">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {totalUnread > 0 && ` · ${totalUnread} unread`}
              </p>
            </div>
            <button
              onClick={() => setView('closed')}
              className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors"
              aria-label="Close inbox"
            >
              ×
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto bg-[#161A1E] divide-y divide-white/5">
            {conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wide">No conversations yet</p>
                <p className="text-gray-600 text-[10px] mt-2">Users will appear here when they message you</p>
              </div>
            ) : (
              conversations.map((conv, idx) => {
                const user = conv._id;
                const hasUnread = conv.unreadCount > 0;
                return (
                  <button
                    key={user._id || idx}
                    onClick={() => handleSelectUser(conv)}
                    className="w-full p-4 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-nirshux-accent/20 flex items-center justify-center text-nirshux-accent font-black text-base border border-nirshux-accent/30">
                          {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-[#161A1E]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-sm truncate pr-2 ${hasUnread ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                            {user.fullName}
                          </p>
                          <p className="text-gray-600 text-[9px] font-mono shrink-0">
                            {new Date(conv.lastMessageDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className={`text-xs truncate ${hasUnread ? 'text-white/80' : 'text-gray-500'}`}>
                          {conv.lastSender === 'admin' ? <span className="text-gray-600">You: </span> : null}
                          {conv.lastMessage}
                        </p>
                      </div>
                      {hasUnread && (
                        <span className="shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-black">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── CHAT VIEW ────────────────────────────────────────────────────────────────
  if (view === 'chat' && selectedUser) {
    return (
      <div style={panelStyle}>
        <div className={panelClass} style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-nirshux-accent px-3 py-3 flex items-center gap-2 shrink-0">
            <button
              onClick={handleBackToList}
              className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold transition-colors shrink-0"
              aria-label="Back to inbox"
            >
              ←
            </button>
            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-black font-black text-sm shrink-0">
              {selectedUser.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-black font-black text-sm uppercase tracking-tight truncate">{selectedUser.fullName}</h3>
              <p className="text-black/60 text-[9px] font-mono truncate">{selectedUser.email}</p>
            </div>
            <button
              onClick={() => setView('closed')}
              className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors shrink-0"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#161A1E]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wide">No messages yet</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.sender === 'admin';
                return (
                  <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-nirshux-accent/20 flex items-center justify-center text-nirshux-accent font-black text-xs mr-2 mt-auto shrink-0">
                        {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMine
                        ? 'bg-nirshux-accent text-black rounded-br-sm'
                        : 'bg-white/10 text-white rounded-bl-sm'
                    } ${msg._optimistic ? 'opacity-70' : ''}`}>
                      <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <p className={`text-[9px] font-mono ${isMine ? 'text-black/50' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isMine && (
                          <span className={`text-[10px] ${msg.read ? 'text-blue-600' : 'text-black/40'}`}>
                            {msg.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-[#0B0E11] border-t border-white/10 shrink-0">
            <form onSubmit={sendMessage}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedUser.fullName?.split(' ')[0]}...`}
                  disabled={loading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-nirshux-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-nirshux-accent text-black font-black px-4 py-2.5 rounded-xl hover:bg-nirshux-accent/90 disabled:opacity-40 transition-all active:scale-95"
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

AdminChatWidget.displayName = 'AdminChatWidget';
export default AdminChatWidget;
