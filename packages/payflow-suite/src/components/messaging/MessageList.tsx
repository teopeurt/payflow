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
import { dbQueries } from '@/lib/database';
import { getSupabase } from '@payflow/core/integrations/supabase/client';
import { crossSchemaApi, MessageThreadWithRelations, MessageWithSender } from '@/lib/api/cross-schema-client';
import { format } from 'date-fns';

// Use the cross-schema API types directly
type MessageThread = MessageThreadWithRelations & {
  unread_count?: number;
  last_message?: {
    content: string;
    createdAt: string;
    sender: { fullName: string };
  };
};

type Message = MessageWithSender & {
  read_by?: Array<{
    user_id: string;
    read_at: string;
  }>;
};

const MessageList: React.FC = () => {
  const { profile } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

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
    if (profile?.id && !hasAttemptedFetch) {
      fetchThreads();
    }
  }, [profile?.id, hasAttemptedFetch]);

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
    setHasAttemptedFetch(true);
    setError(null);
    
    try {
      const threads = await crossSchemaApi.getMessageThreadsWithRelations(20);
      setThreads(threads);
      
      // Select first thread by default
      if (threads && threads.length > 0 && !selectedThread) {
        setSelectedThread(threads[0]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      setError('Failed to load message threads. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    console.log('🔍 fetchMessages called for thread ID:', threadId);
    try {
      const messages = await crossSchemaApi.getMessagesForThread(threadId);
      console.log('✅ fetchMessages success - received', messages.length, 'messages');
      console.log('📄 First few messages:', messages.slice(0, 2));
      setMessages(messages);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      // Don't show error for individual message fetching, just fail silently
    }
  };

  const markThreadAsRead = async (threadId: string) => {
    if (!profile?.id) return;
    
    try {
      // For now, skip the marking as read functionality since we're using cross-schema API
      // This would need to be implemented as a server endpoint to properly handle
      // marking all messages in a thread as read
      console.log('Marking thread as read:', threadId);
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  };

  const setupRealtimeSubscription = (threadId: string) => {
    // Clean up existing subscription
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }

    try {
      // Get the Supabase client for realtime subscriptions
      const supabase = getSupabase();
      
      // Subscribe to new messages in this thread
      const subscription = supabase
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
            console.log('New message received:', payload);
            // Fetch complete message with sender info from cross-schema API
            fetchMessages(threadId);
          }
        )
        .subscribe();

      setRealtimeSubscription(subscription);
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !profile) return;

    try {
      console.log('Sending message via cross-schema API:', {
        threadId: selectedThread.id,
        content: newMessage.trim()
      });

      const message = await crossSchemaApi.createMessage(selectedThread.id, newMessage.trim());
      console.log('Message sent successfully:', message.id);

      // Clear the input
      setNewMessage('');
      
      // Refresh messages to show the new message
      fetchMessages(selectedThread.id);
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add user-facing error handling here
    }
  };

  const isMessageRead = (message: Message): boolean => {
    if (!profile?.id || message.sender?.id === profile.id) return true;
    return message.read_by?.some(read => read.user_id === profile.id) || false;
  };

  const filteredThreads = threads.filter(thread =>
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const retryFetch = () => {
    setHasAttemptedFetch(false);
    setLoading(true);
    setError(null);
  };

  if (loading && !hasAttemptedFetch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={retryFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
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
                        {format(new Date(thread.updatedAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {thread.project?.name || 'General Discussion'}
                  </p>
                  {thread.last_message ? (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      <span className="font-medium">{thread.last_message.sender.fullName}:</span> {thread.last_message.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      by {thread.creator?.fullName}
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
                    Project: {selectedThread.project?.name || 'General'}
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
                    message.sender?.id === profile?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender?.id === profile?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {message.sender?.fullName}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">
                          {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {message.sender?.id === profile?.id && (
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