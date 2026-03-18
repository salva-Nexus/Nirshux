// frontend/src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api';

const ChatWidget = ({ isAdmin = false, selectedUserId = null, selectedUserName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // Poll for new messages every 5 seconds when open
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedUserId]);

  const fetchMessages = async () => {
    try {
      const url = isAdmin && selectedUserId 
        ? `/api/chat/messages?userId=${selectedUserId}` 
        : '/api/chat/messages';
      
      const res = await API.get(url);
      setMessages(res.data);
      
      // Mark as read if admin
      if (isAdmin && selectedUserId) {
        await API.put(`/api/chat/mark-read/${selectedUserId}`);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await API.post('/api/chat/send', {
        message: newMessage,
        recipientId: selectedUserId
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[180] w-14 h-14 bg-nirshux-accent hover:bg-nirshux-accent/90 rounded-full flex items-center justify-center shadow-2xl shadow-nirshux-accent/30 transition-all hover:scale-110 group"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[180] w-[380px] max-w-[calc(100vw-2rem)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0B0E11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-nirshux-accent p-4 flex justify-between items-center">
          <div>
            <h3 className="text-black font-black text-sm uppercase tracking-tight">
              {isAdmin && selectedUserName ? `Chat with ${selectedUserName}` : 'Support Chat'}
            </h3>
            <p className="text-black/60 text-[9px] font-mono uppercase tracking-wider">
              {isAdmin ? 'Admin Terminal' : 'Direct Line to Admin'}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-black font-bold text-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-[#161A1E] custom-scrollbar">
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
              const isUserMessage = msg.sender === 'user';
              const isOwnMessage = isAdmin ? !isUserMessage : isUserMessage;
              
              return (
                <div key={idx} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwnMessage ? 'bg-nirshux-accent text-black' : 'bg-white/10 text-white'} p-3 rounded-2xl`}>
                    <p className="text-sm break-words">{msg.message}</p>
                    <p className={`text-[9px] mt-1 font-mono ${isOwnMessage ? 'text-black/60' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-nirshux-accent transition-colors"
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
