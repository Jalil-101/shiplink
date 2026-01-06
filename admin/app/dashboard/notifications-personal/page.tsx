'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminNotifications,
  getAdminBadgeCounts,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  AdminNotification,
  BadgeCounts,
} from '@/lib/notifications';
import { Bell, Check, Filter, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', category: undefined },
  { id: 'orders', label: 'Orders', category: 'orders' as const },
  { id: 'role_applications', label: 'Applications', category: 'role_applications' as const },
  { id: 'deliveries', label: 'Deliveries', category: 'deliveries' as const },
  { id: 'products', label: 'Products', category: 'products' as const },
  { id: 'admin', label: 'Admin', category: 'admin' as const },
];

export default function AdminPersonalNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    orders: 0,
    role_applications: 0,
    deliveries: 0,
    products: 0,
    earnings: 0,
    system: 0,
    messages: 0,
    admin: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const [notifsData, counts] = await Promise.all([
        getAdminNotifications({ category }),
        getAdminBadgeCounts(),
      ]);
      setNotifications(notifsData.notifications);
      setBadgeCounts(counts);
    } catch (error) {
      console.error('Error fetching notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAdminNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      fetchData(); // Refresh badge counts
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!confirm('Mark all notifications as read?')) return;
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      await markAllAdminNotificationsAsRead(category);
      fetchData();
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await deleteAdminNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchData(); // Refresh badge counts
    } catch (error) {
      console.error('Error deleting notification', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = selectedCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.category === selectedCategory);

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const count = cat.category ? badgeCounts[cat.category] : badgeCounts.total;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
              {count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isSelected ? 'bg-primary-700' : 'bg-primary-600 text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
          <p className="text-gray-500">
            {selectedCategory === 'all'
              ? "You're all caught up! No notifications yet."
              : `No ${CATEGORIES.find((c) => c.id === selectedCategory)?.label.toLowerCase()} notifications.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3
                        className={`text-lg font-medium ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="capitalize">{notification.category.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{formatTime(notification.createdAt)}</span>
                      {notification.isSystemNotification && (
                        <>
                          <span>•</span>
                          <span className="text-primary-600">System Announcement</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {!notification.isSystemNotification && (
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

