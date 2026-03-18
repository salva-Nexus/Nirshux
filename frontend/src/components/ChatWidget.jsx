// frontend/src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when chat opens
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Fetch unread count for badge
  useEffect(() => {
    if (!isOpen) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get('/api/chat/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get('/api/chat/messages');
      setMessages(res.data);
      setUnreadCount(0); // Reset when viewing
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      await API.post('/api/chat/send', {
        message: newMessage.trim()
      });
      
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[190] w-14 h-14 bg-nirshux-accent hover:bg-nirshux-accent/90 rounded-full flex items-center justify-center shadow-2xl shadow-nirshux-accent/30 transition-all hover:scale-110 group relative"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[190] w-[380px] max-w-[calc(100vw-2rem)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0B0E11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-nirshux-accent p-4 flex justify-between items-center">
          <div>
            <h3 className="text-black font-black text-sm uppercase tracking-tight">Support Chat</h3>
            <p className="text-black/60 text-[9px] font-mono uppercase tracking-wider">Direct Line to Admin</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-[#161A1E]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wide">No messages yet</p>
              <p className="text-gray-600 text-[10px] mt-2">Start the conversation below</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMyMessage = msg.sender === 'user';
              
              return (
                <div key={idx} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                  <div className={`max-w-[75%] ${isMyMessage ? 'bg-nirshux-accent text-black' : 'bg-white/10 text-white'} p-3 rounded-2xl shadow-lg`}>
                    <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <p className={`text-[9px] font-mono ${isMyMessage ? 'text-black/60' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isMyMessage && (
                        <span className={`text-[10px] ${msg.read ? 'text-blue-400' : 'text-black/50'}`}>
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
        <form onSubmit={sendMessage} className="p-4 bg-[#0B0E11] border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-nirshux-accent transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-nirshux-accent text-black font-black px-6 py-3 rounded-xl hover:bg-nirshux-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase text-xs tracking-wider"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;
