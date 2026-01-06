'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAdminBadgeCounts } from '@/lib/notifications';
import NotificationBadge from './NotificationBadge';

export default function NotificationBell() {
  const router = useRouter();
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadgeCount = async () => {
      try {
        const counts = await getAdminBadgeCounts();
        setBadgeCount(counts.total);
      } catch (error) {
        console.error('Error fetching badge counts', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBadgeCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => router.push('/dashboard/notifications-personal')}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-6 w-6" />
      {!loading && badgeCount > 0 && (
        <NotificationBadge
          count={badgeCount}
          className="absolute -top-1 -right-1"
        />
      )}
    </button>
  );
}

