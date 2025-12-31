/**
 * Authentication utilities
 */

import Cookies from 'js-cookie';
import api from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'admin' | 'moderator' | 'support';
  avatar?: string;
}

export interface LoginResponse {
  message: string;
  admin: AdminUser;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post('/login', { email, password });
  const { token, admin } = response.data;
  
  // Store token in cookie
  Cookies.set('admin_token', token, { expires: 30 }); // 30 days
  
  return response.data;
}

export function logout() {
  Cookies.remove('admin_token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function getToken(): string | undefined {
  return Cookies.get('admin_token');
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const response = await api.get('/me');
    return response.data.admin;
  } catch (error) {
    return null;
  }
}

