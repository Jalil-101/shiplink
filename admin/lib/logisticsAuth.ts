/**
 * Logistics Company Authentication utilities
 */

import Cookies from 'js-cookie';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5444';

export interface LogisticsUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roles?: Array<{
    role: string;
    verified: boolean;
    verifiedAt?: string;
  }>;
  avatar?: string;
}

export interface LogisticsCompany {
  _id: string;
  companyName: string;
  registrationNumber: string;
  logo?: string;
  description?: string;
  verificationStatus: string;
  isVerified: boolean;
  isActive: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

export interface LoginResponse {
  message: string;
  user: LogisticsUser;
  company?: LogisticsCompany;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // Use the regular user login endpoint (not admin endpoint)
  const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
  const { token, user } = response.data;
  
  // Verify user has logistics-company role
  const hasLogisticsRole = user.roles?.some((r: any) => r.role === 'logistics-company' && r.verified) ||
                          user.role === 'logistics-company';
  
  if (!hasLogisticsRole) {
    throw new Error('This account does not have logistics company access. Please contact support.');
  }
  
  // Fetch logistics company profile
  let company = null;
  try {
    const companyResponse = await axios.get(`${API_URL}/api/logistics-companies/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    company = companyResponse.data.company;
  } catch (error: any) {
    // Profile might not exist yet, that's okay - it will be created when needed
    console.warn('Logistics company profile not found:', error?.response?.status, error?.response?.status !== 404 ? error : '');
  }
  
  // Store token in cookie
  Cookies.set('logistics_token', token, { expires: 30 }); // 30 days
  Cookies.set('logistics_user', JSON.stringify(user), { expires: 30 });
  if (company) {
    Cookies.set('logistics_company', JSON.stringify(company), { expires: 30 });
  }
  
  return { message: 'Login successful', user, company, token };
}

export function logout() {
  Cookies.remove('logistics_token');
  Cookies.remove('logistics_user');
  Cookies.remove('logistics_company');
  if (typeof window !== 'undefined') {
    window.location.href = '/logistics-login';
  }
}

export function getToken(): string | undefined {
  return Cookies.get('logistics_token');
}

export function getCurrentUser(): LogisticsUser | null {
  try {
    const userStr = Cookies.get('logistics_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
}

export function getCurrentCompany(): LogisticsCompany | null {
  try {
    const companyStr = Cookies.get('logistics_company');
    return companyStr ? JSON.parse(companyStr) : null;
  } catch (error) {
    return null;
  }
}

export async function refreshCompanyProfile(): Promise<LogisticsCompany | null> {
  try {
    const token = getToken();
    if (!token) return null;
    
    const response = await axios.get(`${API_URL}/api/logistics-companies/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const company = response.data.company;
    
    if (company) {
      Cookies.set('logistics_company', JSON.stringify(company), { expires: 30 });
    }
    
    return company;
  } catch (error: any) {
    // If 404, profile doesn't exist yet - that's okay
    if (error?.response?.status !== 404) {
      console.error('Error refreshing company profile:', error);
    }
    return null;
  }
}

