import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Send,
  Paperclip,
  MoreVertical,
  User,
  Clock
} from 'lucide-react';
import { useAuth } from '@payflow/core/auth';
import { schemaClient } from '@/lib/database';
import { dbQueries } from '@/lib/database';
import { format } from 'date-fns';

interface MessageThread {
  id: string;
  subject: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id?: string;
  status: string;
  creator?: { full_name: string };
  project?: { name: string };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    sender: { full_name: string };
  };
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_deleted: boolean;
  sender?: { full_name: string };
  read_by?: Array<{
    user_id: string;
    read_at: string;
  }>;
}

const MessageList: React.FC = () => {
  const { profile } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (profile?.id) {
        const role = await dbQueries.getUserRole(profile.id);
        setUserRole(role);
      }
    };
    fetchUserRole();
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      fetchThreads();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      markThreadAsRead(selectedThread.id);
      setupRealtimeSubscription(selectedThread.id);
    }
    
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [selectedThread]);

  const fetchThreads = async () => {
    try {
      const { data, error } = await schemaClient.messaging
        .message_threads()
        .select(`
          *,
          creator:profiles!message_threads_created_by_fkey(full_name),
          project:projects(name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
      
      // Select first thread by default
      if (data && data.length > 0 && !selectedThread) {
        setSelectedThread(data[0]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await schemaClient.messaging
        .messages()
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name),
          read_by:message_recipients(user_id, read_at)
        `)
        .eq('thread_id', threadId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markThreadAsRead = async (threadId: string) => {
    if (!profile?.id) return;
    
    try {
      // Mark all unread messages in this thread as read
      const { error } = await schemaClient.messaging
        .message_recipients()
        .upsert({
          message_id: threadId,
          user_id: profile.id,
          read_status: true,
          read_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  };

  const setupRealtimeSubscription = (threadId: string) => {
    // Clean up existing subscription
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }

    // Subscribe to new messages in this thread
    const subscription = schemaClient
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'messaging',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Fetch complete message with sender info
          fetchMessages(threadId);
        }
      )
      .subscribe();

    setRealtimeSubscription(subscription);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !profile) return;

    try {
      const messageData = {
        thread_id: selectedThread.id,
        sender_id: profile.id,
        content: newMessage.trim(),
        message_type: 'text',
        created_at: new Date().toISOString()
      };

      const { error } = await schemaClient.messaging
        .messages()
        .insert([messageData]);

      if (error) throw error;
      
      // Update thread's updated_at timestamp
      await schemaClient.messaging
        .message_threads()
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedThread.id);
      
      setNewMessage('');
      
      // Real-time subscription will handle adding the message to the UI
      // But we'll also refresh threads to update the "last message" preview
      fetchThreads();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isMessageRead = (message: Message): boolean => {
    if (!profile?.id || message.sender_id === profile.id) return true;
    return message.read_by?.some(read => read.user_id === profile.id) || false;
  };

  const filteredThreads = threads.filter(thread =>
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';
  const isTeamMember = userRole === 'team_member';

  return (
    <div className="h-full flex bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Thread List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {(isAdmin || isTeamMember) && (
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="mx-auto h-8 w-8 mb-2" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                    selectedThread?.id === thread.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-medium text-gray-900 truncate ${
                      thread.unread_count && thread.unread_count > 0 ? 'font-semibold' : ''
                    }`}>
                      {thread.subject}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {thread.unread_count && thread.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {thread.unread_count}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(thread.updated_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {(thread.project as any)?.name || 'General Discussion'}
                  </p>
                  {thread.last_message ? (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      <span className="font-medium">{thread.last_message.sender.full_name}:</span> {thread.last_message.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      by {(thread.creator as any)?.full_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedThread.subject}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Project: {(selectedThread.project as any)?.name || 'General'}
                  </p>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === profile?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === profile?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {(message.sender as any)?.full_name}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {message.sender_id === profile?.id && (
                        <div className="flex items-center space-x-1">
                          {isMessageRead(message) ? (
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Read" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full" title="Delivered" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-end space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Paperclip className="h-4 w-4" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 mb-4" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;