'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getCurrentCompany, getToken, logout } from '@/lib/logisticsAuth';
import { LogisticsUser, LogisticsCompany } from '@/lib/logisticsAuth';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/logistics-dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/logistics-dashboard/orders', icon: Package },
  { name: 'Tracking', href: '/logistics-dashboard/tracking', icon: Truck },
  { name: 'Chat', href: '/logistics-dashboard/chat', icon: MessageSquare },
  { name: 'Returns', href: '/logistics-dashboard/returns', icon: Package },
  { name: 'Quotes', href: '/logistics-dashboard/quotes', icon: Package },
  { name: 'Billing', href: '/logistics-dashboard/billing', icon: DollarSign },
  { name: 'Drivers', href: '/logistics-dashboard/drivers', icon: Truck },
  { name: 'Analytics', href: '/logistics-dashboard/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/logistics-dashboard/profile', icon: Settings },
];

export default function LogisticsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<LogisticsUser | null>(null);
  const [company, setCompany] = useState<LogisticsCompany | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication using cookie-based token
    const token = getToken();
    
    if (!token) {
      router.push('/logistics-login');
      return;
    }

    const currentUser = getCurrentUser();
    const currentCompany = getCurrentCompany();
    
    if (!currentUser) {
      router.push('/logistics-login');
      return;
    }

    setUser(currentUser);
    setCompany(currentCompany);
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-purple-600">ShipLink Logistics</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Company info & logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{company?.companyName || user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              {company && (
                <p className="text-xs text-purple-600 mt-1">{company.registrationNumber}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </h2>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

