'use client';

import React from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export default function NotificationBadge({ count, maxCount = 99, className = '' }: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full ${className}`}
    >
      {displayCount}
    </span>
  );
}

