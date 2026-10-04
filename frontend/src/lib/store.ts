'use client';
import { useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export type LiveUpdate = {
  timestamp?: string;
  aqi_city_avg?: number;
  traffic_congestion_avg?: number;
  active_complaints?: number;
};

export type SystemLogEntry = {
  id: string;
  ts: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  meta?: Record<string, string | number>;
};

// Store for global state
interface AppState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  role: 'citizen' | 'admin';
  activePage: string;
  sidebarCollapsed: boolean;
  notifications: number;
  theme: ThemeMode;
  live: LiveUpdate;
  emergencyMode: boolean;
  logs: SystemLogEntry[];
  
  login: (user: any, token: string) => void;
  logout: () => void;
  
  setRole: (role: 'citizen' | 'admin') => void;
  setActivePage: (page: string) => void;
  toggleSidebar: () => void;
  clearNotifications: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLive: (live: LiveUpdate) => void;
  triggerEmergencyMode: () => void;
  addLog: (entry: Omit<SystemLogEntry, 'id' | 'ts'> & Partial<Pick<SystemLogEntry, 'id' | 'ts'>>) => void;
}

const getStoredAuth = () => {
  if (typeof window === 'undefined') return { isAuthenticated: false, user: null, token: null, role: 'admin' as const };
  const token = localStorage.getItem('metrocity_token');
  const userStr = localStorage.getItem('metrocity_user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      return { isAuthenticated: true, user, token, role: user.role || 'admin' as const };
    } catch {
      return { isAuthenticated: false, user: null, token: null, role: 'admin' as const };
    }
  }
  return { isAuthenticated: false, user: null, token: null, role: 'admin' as const };
};

const initialAuth = getStoredAuth();

let globalState: AppState = {
  isAuthenticated: initialAuth.isAuthenticated,
  user: initialAuth.user,
  token: initialAuth.token,
  role: initialAuth.role,
  activePage: 'overview',
  sidebarCollapsed: false,
  notifications: 5,
  theme: 'dark',
  live: {},
  emergencyMode: false,
  logs: [],
  login: () => {},
  logout: () => {},
  setRole: () => {},
  setActivePage: () => {},
  toggleSidebar: () => {},
  clearNotifications: () => {},
  setTheme: () => {},
  setLive: () => {},
  triggerEmergencyMode: () => {},
  addLog: () => {},
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(l => l());
}

export function useAppStore(): AppState {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener = () => rerender(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    ...globalState,
    login: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('metrocity_token', token);
        localStorage.setItem('metrocity_user', JSON.stringify(user));
      }
      globalState = { ...globalState, isAuthenticated: true, user, token, role: user.role || 'citizen' };
      notifyListeners();
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('metrocity_token');
        localStorage.removeItem('metrocity_user');
      }
      globalState = { ...globalState, isAuthenticated: false, user: null, token: null };
      notifyListeners();
    },
    setRole: (role) => {
      globalState = { ...globalState, role };
      notifyListeners();
    },
    setActivePage: (page) => {
      globalState = { ...globalState, activePage: page };
      notifyListeners();
    },
    toggleSidebar: () => {
      globalState = { ...globalState, sidebarCollapsed: !globalState.sidebarCollapsed };
      notifyListeners();
    },
    clearNotifications: () => {
      globalState = { ...globalState, notifications: 0 };
      notifyListeners();
    },
    setTheme: (theme) => {
      globalState = { ...globalState, theme };
      notifyListeners();
    },
    setLive: (live) => {
      globalState = { ...globalState, live: { ...globalState.live, ...live } };
      notifyListeners();
    },
    triggerEmergencyMode: () => {
      globalState = { ...globalState, emergencyMode: true, notifications: globalState.notifications + 3, activePage: 'traffic' };
      notifyListeners();
    },
    addLog: (entry) => {
      const full: SystemLogEntry = {
        id: entry.id ?? `LOG-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        ts: entry.ts ?? new Date().toISOString(),
        level: entry.level,
        message: entry.message,
        meta: entry.meta,
      };
      globalState = { ...globalState, logs: [full, ...globalState.logs].slice(0, 200) };
      notifyListeners();
    },
  };
}
