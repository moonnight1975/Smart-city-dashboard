'use client';

import { useAppStore } from '@/lib/store';
import { LayoutDashboard, Car, Wind, MessageSquare, Brain, Route } from 'lucide-react';
const aiPredictions = [
  { id: 1, title: 'Severe Waterlogging Predicted', risk: 'critical' }
];

const mobileNav = [
  { id: 'overview',   label: 'Home',       icon: LayoutDashboard },
  { id: 'road-intelligence', label: 'Roads', icon: Route },
  { id: 'traffic',    label: 'Traffic',    icon: Car },
  { id: 'aqi',        label: 'Air',        icon: Wind },
  { id: 'complaints', label: 'Reports',    icon: MessageSquare },
  { id: 'ai-alerts',  label: 'AI',         icon: Brain },
];

export default function MobileBottomNav() {
  const { activePage, setActivePage } = useAppStore();
  const criticalAI = aiPredictions.filter(p => p.risk === 'critical').length;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 66, zIndex: 30,
      background: 'rgba(6, 11, 24, 0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {mobileNav.map(item => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        const isAI = item.id === 'ai-alerts';
        const color = isActive ? '#00d4ff' : '#475569';

        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              height: '100%', background: 'none', border: 'none',
              cursor: 'pointer', position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 28, height: 2, borderRadius: 1,
                background: 'linear-gradient(90deg, #00d4ff, #3b82f6)',
                boxShadow: '0 0 8px rgba(0,212,255,0.6)',
              }} />
            )}

            <div style={{ position: 'relative' }}>
              <Icon
                size={22}
                color={color}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(0,212,255,0.5))' : 'none', transition: 'all 0.2s' }}
              />
              {isAI && criticalAI > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -8,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#ef4444', fontSize: 9, fontWeight: 800,
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #060b18',
                  animation: 'bounce-badge 1.5s ease-in-out infinite',
                }}>
                  {criticalAI}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              color, letterSpacing: '0.2px', transition: 'all 0.2s',
            }}>
              {item.label}
            </span>

            {/* Active background */}
            {isActive && (
              <div style={{
                position: 'absolute', inset: '4px 4px',
                borderRadius: 10,
                background: 'rgba(0,212,255,0.06)',
                zIndex: -1,
              }} />
            )}
          </button>
        );
      })}

      <style>{`
        @keyframes bounce-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </nav>
  );
}
