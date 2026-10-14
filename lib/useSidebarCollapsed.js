'use client';

import { useState, useEffect } from 'react';

export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setIsCollapsed(localStorage.getItem('buu_sidebar_collapsed') === 'true');
    } catch {}

    const handleToggle = (e) => {
      if (typeof e.detail?.collapsed === 'boolean') {
        setIsCollapsed(e.detail.collapsed);
      }
    };

    window.addEventListener('buu:sidebar-toggle', handleToggle);
    return () => window.removeEventListener('buu:sidebar-toggle', handleToggle);
  }, []);

  const toggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('buu_sidebar_collapsed', String(next));
      } catch {}
      window.dispatchEvent(new CustomEvent('buu:sidebar-toggle', { detail: { collapsed: next } }));
    }
  };

  return [isCollapsed, toggle];
}
