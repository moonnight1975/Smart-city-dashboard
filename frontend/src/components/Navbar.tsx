'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Bell, Search, User, ChevronDown, Shield, LogOut, Menu, Brain, X, MessageSquare, Siren, Sun, Moon } from 'lucide-react';
const alerts = [
  { id: 1, type: 'critical', message: 'High voltage fluctuation in North Grid', time: '10m ago' },
  { id: 2, type: 'warning', message: 'Traffic congestion detected on Main Bypass', time: '1h ago' }
];

const aiPredictions = [
  { id: 1, title: 'Severe Waterlogging Predicted', risk_level: 'Critical' }
];
import FeedbackModal from '@/components/FeedbackModal';

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { notifications, clearNotifications, activePage, theme, setTheme, triggerEmergencyMode, addLog } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const pageNames: Record<string, string> = {
    overview: 'City Overview',
    'road-intelligence': 'Nalasopara Road Intelligence',
    'issue-operations': 'Admin Issue Operations',
    traffic: 'Traffic Monitoring',
    aqi: 'Air Quality Index',
    waste: 'Waste Management',
    water: 'Water Monitoring',
    infrastructure: 'Infrastructure',
    complaints: 'Complaints System',
    alerts: 'Active Alerts',
    'ai-alerts': 'AI Predictions',
    analytics: 'City Analytics',
    admin: 'Admin Panel',
  };

  const criticalAI = aiPredictions.filter(p => p.risk_level === 'Critical').length;

  return (
    <header className="navbar-header">
      
      {/* Mobile: Hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="lg-hidden"
        style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Menu size={18} color="#94a3b8" />
      </button>

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', sans-serif",
          fontSize: 'clamp(14px, 2.5vw, 17px)',
          fontWeight: 700, color: '#f0f6ff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {pageNames[activePage] || 'Dashboard'}
        </h1>
        <div className="live-indicator" style={{ marginTop: 1 }}>Live data</div>
      </div>

      {/* Desktop Search */}
      <div className="desktop-search" style={{ position: 'relative', flex: '0 0 220px' }}>
        <Search size={14} color="#475569" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input type="text" placeholder="Search..." className="input-field" style={{ paddingLeft: 30, height: 36, fontSize: 13 }} />
      </div>

      {/* Mobile Search Toggle */}
      {showSearch && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0,
          background: 'rgba(6,11,24,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 16px', zIndex: 50,
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#475569" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input autoFocus type="text" placeholder="Search city data..." className="input-field" style={{ paddingLeft: 30, height: 40 }} />
          </div>
        </div>
      )}

      {/* Mobile search button */}
      <button
        className="mobile-search-btn"
        onClick={() => setShowSearch(!showSearch)}
        style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      >
        {showSearch ? <X size={16} color="#94a3b8" /> : <Search size={16} color="#94a3b8" />}
      </button>

      {/* AI badge */}
      {criticalAI > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 8, flexShrink: 0,
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
          animation: 'pulse-badge 2s ease-in-out infinite',
        }}>
          <Brain size={13} color="#a78bfa" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>{criticalAI} AI Alerts</span>
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); if (notifications > 0) clearNotifications(); }}
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative',
          }}
        >
          <Bell size={16} color="#94a3b8" />
          {notifications > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, width: 17, height: 17, borderRadius: '50%', background: '#ef4444', fontSize: 9, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #060b18' }}>
              {notifications}
            </span>
          )}
        </button>

        {showNotifications && (
          <div style={{
            position: 'fixed',
            top: 64, right: 12,
            width: 'min(360px, calc(100vw - 24px))',
            background: 'rgba(13, 22, 41, 0.99)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            overflow: 'hidden',
            zIndex: 100,
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#f0f6ff' }}>Alerts</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-red">{alerts.filter(a => a.type === 'critical').length} critical</span>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={14} color="#475569" />
                </button>
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: alert.type === 'critical' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, color: '#f0f6ff', lineHeight: 1.4 }}>{alert.message}</p>
                    <span style={{ fontSize: 11, color: '#475569', marginTop: 2, display: 'block' }}>{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#00d4ff', cursor: 'pointer', fontWeight: 500 }}>View all alerts →</span>
            </div>
          </div>
        )}
      </div>

      {/* Emergency mode */}
      <button
        onClick={() => {
          triggerEmergencyMode();
          addLog({ level: 'critical', message: 'Emergency mode triggered', meta: { from: 'navbar' } });
        }}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(239,68,68,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label="Emergency mode"
        title="Emergency mode"
      >
        <Siren size={16} color="#ef4444" />
      </button>

      {/* Feedback */}
      <button
        onClick={() => {
          setShowFeedback(true);
          setShowNotifications(false);
          setShowProfile(false);
        }}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label="Send feedback"
        title="Feedback"
      >
        <MessageSquare size={16} color="#94a3b8" />
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
          addLog({ level: 'info', message: 'Theme toggled', meta: { theme: theme === 'dark' ? 'light' : 'dark' } });
        }}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'dark' ? <Moon size={16} color="#94a3b8" /> : <Sun size={16} color="#f59e0b" />}
      </button>

      {/* Protected admin role */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 10, flexShrink: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Shield size={13} color="#00d4ff" />
        <span className="role-label" style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', textTransform: 'capitalize' }}>admin only</span>
      </div>

      {/* Profile */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>
            AD
          </div>
          <span className="profile-label" style={{ fontSize: 13, fontWeight: 600, color: '#f0f6ff' }}>Admin</span>
          <ChevronDown size={13} color="#475569" />
        </button>

        {showProfile && (
          <div style={{
            position: 'absolute', top: 46, right: 0,
            width: 190,
            background: 'rgba(13, 22, 41, 0.99)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            padding: 8, zIndex: 100,
          }}>
            <button className="sidebar-item" style={{ width: '100%', background: 'none', border: 'none', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
              <User size={15} /><span style={{ fontSize: 13 }}>Profile</span>
            </button>
            <button className="sidebar-item" style={{ width: '100%', background: 'none', border: 'none', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
              <Shield size={15} /><span style={{ fontSize: 13 }}>Security</span>
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            <button className="sidebar-item" style={{ width: '100%', background: 'none', border: 'none', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', color: '#ef4444' }}>
              <LogOut size={15} color="#ef4444" /><span style={{ fontSize: 13 }}>Sign out</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .navbar-header {
          position: fixed;
          top: 16px;
          left: 104px;
          right: 16px;
          height: 64px;
          border-radius: 32px;
          z-index: 20;
          background: rgba(11, 16, 32, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 12px;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
          50% { box-shadow: 0 0 0 4px rgba(139,92,246,0); }
        }
        /* Desktop: hide mobile-only */
        @media (min-width: 1024px) {
          .lg-hidden { display: none !important; }
          .mobile-search-btn { display: none !important; }
          .desktop-search { display: block !important; }
        }
        @media (max-width: 1023px) {
          .navbar-header {
            left: 16px;
          }
          .desktop-search { display: none !important; }
        }
        @media (max-width: 640px) {
          .role-label { display: none; }
          .profile-label { display: none; }
        }
      `}</style>

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} page={pageNames[activePage] || activePage} />
    </header>
  );
}
