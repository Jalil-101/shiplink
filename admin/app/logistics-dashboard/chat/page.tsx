'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { MessageSquare, Package, Clock, User } from 'lucide-react';

interface Chat {
  _id: string;
  orderId: {
    orderNumber: string;
    order_id: string;
    status: string;
  };
  userId: {
    name: string;
    email: string;
    phone: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCountCompany: number;
}

export default function ChatConversationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get('/logistics-companies/dashboard/chat/conversations');
      setChats(response.data.chats || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chat Conversations</h1>
        <p className="mt-1 text-sm text-gray-500">Communicate with customers about their orders</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {chats.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conversations</h3>
          <p className="text-gray-600">Chat conversations with customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => router.push(`/logistics-dashboard/chat/${chat.orderId.order_id || chat.orderId._id}`)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 truncate">{chat.userId.name}</h3>
                    {chat.unreadCountCompany > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full flex-shrink-0">
                        {chat.unreadCountCompany}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2 flex-wrap">
                    <div className="flex items-center">
                      <Package className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate">Order: {chat.orderId?.orderNumber || chat.orderId?.order_id || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>{chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'No messages'}</span>
                    </div>
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-1">{chat.lastMessage}</p>
                  )}
                </div>
                <MessageSquare className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

