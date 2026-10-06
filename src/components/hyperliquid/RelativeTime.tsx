import React, { useState, useEffect } from 'react';

export interface RelativeTimeProps {
  timestamp: number;
  isHistorical?: boolean;
  prefix?: string;
  className?: string;
}

export function RelativeTime({
  timestamp,
  isHistorical = false,
  prefix = 'Listed',
  className = '',
}: RelativeTimeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Re-render every second for live countdown precision
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffSec = Math.floor(diffMs / 1000);

  let formatted = '';
  if (isHistorical) {
    if (diffSec < 60) {
      formatted = 'Baseline verified moments ago';
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      formatted = `Baseline synced ${mins}m ago`;
    } else {
      const hours = Math.floor(diffSec / 3600);
      formatted = `Baseline synced ${hours}h ago`;
    }
  } else {
    if (diffSec < 60) {
      formatted = `${prefix} ${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      formatted = `${prefix} ${mins} minute${mins === 1 ? '' : 's'} ago`;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      formatted = `${prefix} ${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffSec / 86400);
      formatted = `${prefix} ${days} day${days === 1 ? '' : 's'} ago`;
    }
  }

  return (
    <span className={`tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}
