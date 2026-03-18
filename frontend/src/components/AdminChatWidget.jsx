// frontend/src/components/AdminChatWidget.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import ChatWidget from './ChatWidget';

const AdminChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (isOpen && !selectedUser) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedUser]);

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
      setTotalUnread(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await API.get('/api/chat/conversations');
      setConversations(res.data);
      
      // Calculate total unread
      const total = res.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const handleSelectUser = (conv) => {
    setSelectedUser(conv);
    setIsOpen(false); // Close conversation list
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setIsOpen(true); // Reopen conversation list
    fetchConversations(); // Refresh list
  };

  if (selectedUser) {
    return (
      <div className="relative">
        <ChatWidget 
          isAdmin={true} 
          selectedUserId={selectedUser._id._id} 
          selectedUserName={selectedUser._id.fullName}
        />
        <button
          onClick={handleBackToList}
          className="fixed bottom-[500px] right-6 z-[181] bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all border border-white/10 backdrop-blur-md"
        >
          ← Back to Inbox
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[180] w-14 h-14 bg-nirshux-accent hover:bg-nirshux-accent/90 rounded-full flex items-center justify-center shadow-2xl shadow-nirshux-accent/30 transition-all hover:scale-110 group relative"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
        
        {/* Unread Badge */}
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-pulse">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

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
            onClick={() => setIsOpen(false)}
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
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm group-hover:text-nirshux-accent transition-colors truncate pr-2">
                        {conv._id.fullName}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono">{conv._id.email}</p>
                    </div>
                    
                    {/* Unread Badge */}
                    {conv.unreadCount > 0 && (
                      <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Last Message */}
                  <p className={`text-xs truncate ${conv.lastSender === 'user' && conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                    {conv.lastSender === 'admin' ? 'You: ' : ''}
                    {conv.lastMessage}
                  </p>
                  
                  {/* Timestamp */}
                  <p className="text-gray-600 text-[9px] font-mono mt-1">
                    {new Date(conv.lastMessageDate).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatWidget;
