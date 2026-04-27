// frontend/src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import API from '../api';

const ChatWidget = memo(() => {
  const [isOpen, setIsOpen] = useState(false); // ← always starts closed
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const unreadPollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When chat OPENS: mark read + start polling messages
  useEffect(() => {
    if (isOpen) {
      API.put('/api/chat/mark-read-user').catch(() => {});
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
      // Focus input after open animation settles
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [isOpen]);

  // When chat is CLOSED: poll unread badge
  useEffect(() => {
    if (!isOpen) {
      fetchUnreadCount();
      unreadPollRef.current = setInterval(fetchUnreadCount, 5000);
    } else {
      clearInterval(unreadPollRef.current);
      setUnreadCount(0);
    }
    return () => clearInterval(unreadPollRef.current);
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get('/api/chat/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get('/api/chat/messages');
      setMessages(res.data);
    } catch { /* silent */ }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: 'user',
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
      await API.post('/api/chat/send', { message: msgText });
      await fetchMessages();
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
      setNewMessage(msgText);
    } finally {
      setLoading(false);
    }
  };

  // ─── CLOSED: just the FAB button ─────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        <button
          onClick={handleOpen}
          className="w-14 h-14 bg-nirshux-accent hover:bg-nirshux-accent/90 rounded-full flex items-center justify-center shadow-2xl shadow-nirshux-accent/30 transition-all hover:scale-110 active:scale-95 relative"
          aria-label="Open support chat"
        >
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-pulse pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ─── OPEN: full chat panel ────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, width: '380px', maxWidth: 'calc(100vw - 2rem)' }}>
      <div
        className="bg-[#0B0E11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200"
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="bg-nirshux-accent px-4 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-black font-black text-sm uppercase tracking-tight">Support Chat</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-black/40 animate-pulse" />
                <p className="text-black/60 text-[9px] font-mono uppercase tracking-wider">Online · Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors"
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#161A1E]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wide">No messages yet</p>
              <p className="text-gray-600 text-[10px] mt-1">Start the conversation below</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender === 'user';
              return (
                <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-nirshux-accent/20 flex items-center justify-center text-nirshux-accent font-black text-xs mr-2 mt-auto shrink-0">
                      A
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
                placeholder="Type a message..."
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
});

ChatWidget.displayName = 'ChatWidget';
export default ChatWidget;
