// frontend/src/components/AdminChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api';

const AdminChatWidget = () => {
  const [view, setView] = useState('list'); // 'list' or 'chat'
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations when in list view
  useEffect(() => {
    if (view === 'list') {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // Fetch messages when in chat view
  useEffect(() => {
    if (view === 'chat' && selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [view, selectedUser]);

  const fetchConversations = async () => {
    try {
      const res = await API.get('/api/chat/conversations');
      setConversations(res.data);
      
      const total = res.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await API.get(`/api/chat/messages?userId=${selectedUser._id}`);
      setMessages(res.data);
      
      // Mark as read
      await API.put(`/api/chat/mark-read/${selectedUser._id}`);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSelectUser = async (conv) => {
    setSelectedUser(conv._id);
    setView('chat');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedUser(null);
    setMessages([]);
    setNewMessage('');
    fetchConversations();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading || !selectedUser) return;

    setLoading(true);
    try {
      await API.post('/api/chat/send', {
        message: newMessage.trim(),
        recipientId: selectedUser._id
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

  // CLOSED STATE
  if (view === 'closed') {
    return (
      <button
        onClick={() => setView('list')}
        className="fixed bottom-6 right-6 z-[180] w-14 h-14 bg-nirshux-accent hover:bg-nirshux-accent/90 rounded-full flex items-center justify-center shadow-2xl shadow-nirshux-accent/30 transition-all hover:scale-110 group relative"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
        
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-pulse">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="fixed bottom-6 right-6 z-[180] w-[380px] max-w-[calc(100vw-2rem)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0B0E11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-nirshux-accent p-4 flex justify-between items-center">
            <div>
              <h3 className="text-black font-black text-sm uppercase tracking-tight">Admin Inbox</h3>
              <p className="text-black/60 text-[9px] font-mono uppercase tracking-wider">
                {conversations.length} Conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setView('closed')}
              className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors"
            >
              ×
            </button>
          </div>

          {/* Conversations List */}
          <div className="h-[400px] overflow-y-auto bg-[#161A1E]">
            {conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wide">No conversations yet</p>
                <p className="text-gray-600 text-[10px] mt-2">Users will appear here when they message you</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {conversations.map((conv, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectUser(conv)}
                    className="w-full p-4 hover:bg-white/5 transition-colors text-left group relative"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-nirshux-accent/20 flex items-center justify-center text-nirshux-accent font-black text-lg border-2 border-nirshux-accent/30">
                          {conv._id.fullName.charAt(0)}
                        </div>
                        {/* Blue Dot for Unread */}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#161A1E]"></span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-sm group-hover:text-nirshux-accent transition-colors truncate pr-2">
                            {conv._id.fullName}
                          </p>
                          <p className="text-gray-600 text-[9px] font-mono shrink-0">
                            {new Date(conv.lastMessageDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        <p className="text-gray-500 text-[10px] font-mono mb-1">{conv._id.email}</p>
                        
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                          {conv.lastSender === 'admin' ? 'You: ' : ''}
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CHAT VIEW
  if (view === 'chat' && selectedUser) {
    return (
      <div className="fixed bottom-6 right-6 z-[180] w-[380px] max-w-[calc(100vw-2rem)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0B0E11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-nirshux-accent p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold transition-colors"
              >
                ←
              </button>
              <div className="flex-1">
                <h3 className="text-black font-black text-sm uppercase tracking-tight truncate">
                  {selectedUser.fullName}
                </h3>
                <p className="text-black/60 text-[9px] font-mono truncate">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setView('closed')}
                className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-[#161A1E]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-wide">No messages yet</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMyMessage = msg.sender === 'admin';
                
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
  }

  return null;
};

export default AdminChatWidget;
