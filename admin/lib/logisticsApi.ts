/**
 * API Client for Logistics Dashboard
 */

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5444';

const logisticsApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
logisticsApi.interceptors.request.use((config) => {
  const token = Cookies.get('logistics_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
logisticsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('logistics_token');
      Cookies.remove('logistics_user');
      Cookies.remove('logistics_company');
      if (typeof window !== 'undefined') {
        window.location.href = '/logistics-login';
      }
    }
    return Promise.reject(error);
  }
);

export default logisticsApi;

