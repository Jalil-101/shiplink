/**
 * Admin Dashboard Notification Utilities
 * Handles notifications for admin users
 */

import api from './api';

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  category: 'orders' | 'role_applications' | 'deliveries' | 'products' | 'earnings' | 'system' | 'messages' | 'admin';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  readAt?: string;
  actionUrl?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
  isSystemNotification?: boolean;
}

export interface BadgeCounts {
  orders: number;
  role_applications: number;
  deliveries: number;
  products: number;
  earnings: number;
  system: number;
  messages: number;
  admin: number;
  total: number;
}

/**
 * Get admin notifications
 */
export async function getAdminNotifications(filters?: {
  category?: string;
  read?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ notifications: AdminNotification[]; pagination: any }> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.read !== undefined) params.append('read', filters.read.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const response = await api.get(`/notifications/personal${queryString ? `?${queryString}` : ''}`);
  return response.data;
}

/**
 * Get admin badge counts
 */
export async function getAdminBadgeCounts(): Promise<BadgeCounts> {
  const response = await api.get('/notifications/badges');
  return response.data;
}

/**
 * Mark notification as read
 */
export async function markAdminNotificationAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/personal/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAdminNotificationsAsRead(category?: string): Promise<void> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  const queryString = params.toString();
  await api.patch(`/notifications/personal/read-all${queryString ? `?${queryString}` : ''}`);
}

/**
 * Delete notification
 */
export async function deleteAdminNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/personal/${notificationId}`);
}

