'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { ArrowLeft, Send, MessageSquare, User, Package } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  senderId: string;
  senderType: 'User' | 'LogisticsCompany';
  message: string;
  attachments?: string[];
  read: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  orderId: {
    orderNumber: string;
    order_id: string;
  };
  userId: {
    name: string;
    email: string;
    phone: string;
  };
  companyId: {
    companyName: string;
    logo?: string;
  };
  messages: Message[];
  unreadCountCompany: number;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderId) {
      fetchChat();
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [orderId]);

  // Initialize socket after chat is loaded
  useEffect(() => {
    if (chat && !socket) {
      initializeSocket();
    }
  }, [chat]);

  // Join company room when socket and chat are ready
  useEffect(() => {
    if (socket && chat?.companyId?._id) {
      socket.emit('join:company', chat.companyId._id);
    }
  }, [socket, chat?.companyId?._id]);

  useEffect(() => {
    if (chat && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages]);

  const initializeSocket = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5444';
    const newSocket = io(API_URL.replace('/api', ''), {
      transports: ['websocket'],
      reconnection: true,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('chat:message', (data: { chatId: string; orderId: string; message: Message }) => {
      if (chat && data.chatId === chat._id) {
        setChat(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message],
            lastMessage: data.message.message,
            lastMessageAt: data.message.createdAt,
            unreadCountCompany: data.message.senderType === 'User' 
              ? prev.unreadCountCompany + 1 
              : prev.unreadCountCompany
          };
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);
  };

  const fetchChat = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get(`/logistics-companies/dashboard/chat/order/${orderId}`);
      setChat(response.data.chat);
      
      // Mark as read
      if (response.data.chat.unreadCountCompany > 0) {
        markAsRead();
      }
    } catch (err: any) {
      console.error('Error fetching chat:', err);
      setError(err.response?.data?.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);

    try {
      const response = await logisticsApi.post(
        `/logistics-companies/dashboard/chat/order/${orderId}/message`,
        { message: messageText }
      );

      setChat(response.data.chat);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    if (!chat || chat.unreadCountCompany === 0) return;

    try {
      await logisticsApi.patch(`/chat/${chat._id}/read`, {
        viewerType: 'LogisticsCompany'
      });
      
      setChat(prev => {
        if (!prev) return null;
        // Mark all unread messages as read
        const updatedMessages = prev.messages.map(msg => 
          msg.senderType === 'User' && !msg.read 
            ? { ...msg, read: true, readAt: new Date().toISOString() }
            : msg
        );
        return { ...prev, unreadCountCompany: 0, messages: updatedMessages };
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Chat not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[800px]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Conversations
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{chat.userId.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  <span>Order: {chat.orderId.orderNumber || chat.orderId.order_id}</span>
                </div>
                <span>{chat.userId.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        <div className="space-y-3">
          {chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium text-base">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            chat.messages.map((msg, index) => {
              const isCompany = msg.senderType === 'LogisticsCompany';
              const showTime = index === chat.messages.length - 1 || 
                new Date(msg.createdAt).getTime() - new Date(chat.messages[index + 1]?.createdAt || msg.createdAt).getTime() > 300000;
              
              return (
                <div
                  key={msg._id}
                  className={`flex ${isCompany ? 'justify-end' : 'justify-start'} px-1`}
                >
                  <div
                    className={`max-w-lg px-4 py-2.5 rounded-2xl ${
                      isCompany
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    } shadow-sm`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                    {showTime && (
                      <p
                        className={`text-xs mt-1.5 ${
                          isCompany ? 'text-purple-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <form onSubmit={sendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
              rows={1}
              maxLength={1000}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="px-5 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[44px] h-[44px]"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

