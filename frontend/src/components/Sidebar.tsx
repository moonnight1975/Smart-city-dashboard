'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard, Car, Wind, User, Trash2, Droplets,
  MessageSquare, Settings, Menu, X, Shield, Zap, Building2, Map, Route, ClipboardList,
  Bell, TrendingUp, Brain, ChevronRight, Globe, Camera, BarChart2, Target, Network, Layers, MapPin
} from 'lucide-react';
const aiPredictions = [
  { id: 1, title: 'Severe Waterlogging Predicted', risk: 'critical' }
];

const navigationGroups = [
  {
    title: 'CITY INTELLIGENCE',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'gis-explorer', label: 'GIS Explorer', icon: Globe },
      { id: 'gis-analysis', label: 'GIS Analysis', icon: Layers },
      { id: 'remote-sensing', label: 'Remote Sensing', icon: Camera },
      { id: 'spatial-stats', label: 'Spatial Stats', icon: BarChart2 },
      { id: 'urban-models', label: 'Urban Models', icon: Target },
    ]
  },
  {
    title: 'CITY OPERATIONS',
    items: [
      { id: 'road-intelligence', label: 'Road Intelligence', icon: Route },
      { id: 'traffic', label: 'Traffic Monitoring', icon: Car },
      { id: 'aqi', label: 'Air Quality', icon: Wind },
      { id: 'waste', label: 'Waste Management', icon: Trash2 },
      { id: 'water', label: 'Water Monitoring', icon: Droplets },
      { id: 'infrastructure', label: 'Infrastructure', icon: Building2 },
    ]
  },
  {
    title: 'CIVIC SERVICES',
    items: [
      { id: 'complaints', label: 'Complaints', icon: MessageSquare },
      { id: 'issue-operations', label: 'Issue Operations', icon: ClipboardList, adminOnly: true },
      { id: 'alerts', label: 'Active Alerts', icon: Bell },
    ]
  },
  {
    title: 'AI & ANALYTICS',
    items: [
      { id: 'ai-alerts', label: 'AI Predictions', icon: Brain },
      { id: 'automation-studio', label: 'Automation Studio', icon: Network },
      { id: 'analytics', label: 'City Analytics', icon: TrendingUp },
    ]
  },
  {
    title: 'ADMINISTRATION',
    adminOnly: true,
    items: [
      { id: 'admin', label: 'Admin Panel', icon: Settings },
      { id: 'data-sources', label: 'Data Sources', icon: Zap },
      { id: 'system-health', label: 'System Health', icon: Shield },
      { id: 'user-management', label: 'User Management', icon: User },
    ]
  }
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { activePage, setActivePage, role, user, logout } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const criticalAI = aiPredictions.filter(p => p.risk === 'critical').length;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNav = (id: string) => {
    setActivePage(id);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const isExpanded = !isMobile && isHovered;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 40,
          }}
        />
      )}

      {/* Floating Pill Sidebar Container */}
      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        style={{
          position: 'fixed',
          top: isMobile ? 0 : 16,
          left: isMobile ? (mobileOpen ? 0 : -280) : 16,
          bottom: isMobile ? 0 : 16,
          width: isMobile ? 280 : (isExpanded ? 260 : 72),
          borderRadius: isMobile ? 0 : 32, // Material You 3 Pill Shape
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(24px)', // Liquid glass blur
          WebkitBackdropFilter: 'blur(24px)',
          border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isMobile ? 'none' : '0 16px 48px rgba(0, 0, 0, 0.3)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          height: 72, display: 'flex', alignItems: 'center',
          padding: isExpanded ? '0 20px' : '0 16px',
          justifyContent: isExpanded ? 'space-between' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <MapPin size={22} color="white" />
            </div>
            {isExpanded && (
              <div style={{
                fontSize: 18, fontWeight: 800, fontFamily: "'Instrument Serif', sans-serif",
                background: 'linear-gradient(135deg, #e9d5ff, #fff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap'
              }}>
                MetroCity AI
              </div>
            )}
          </div>
          
          {isMobile && (
            <button onClick={onMobileClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <X size={15} color="#d8b4fe" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 16 }} className="hide-scroll">
          {navigationGroups.map((group, groupIndex) => {
            if (('adminOnly' in group) && group.adminOnly && role !== 'admin') return null;
            return (
              <div key={groupIndex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {isExpanded && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, paddingLeft: 12, marginBottom: 4 }}>
                    {group.title}
                  </div>
                )}
                {group.items.map(item => {
                  if (('adminOnly' in item) && item.adminOnly && role !== 'admin') return null;
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  const isAI = item.id === 'ai-alerts';
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      style={{
                        width: '100%', border: 'none', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center',
                        justifyContent: isExpanded ? 'flex-start' : 'center',
                        padding: isExpanded ? '10px 14px' : '12px',
                        borderRadius: 12,
                        background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: isActive ? '#06b6d4' : '#94a3b8',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        if (!isActive) e.currentTarget.style.color = '#e2e8f0';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                        if (!isActive) e.currentTarget.style.color = '#94a3b8';
                      }}
                      title={!isExpanded ? item.label : ''}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ color: isActive ? '#06b6d4' : 'inherit' }} />
                      {isExpanded && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, marginLeft: 14, whiteSpace: 'nowrap' }}>{item.label}</span>}
                      
                      {/* Badges */}
                      {isAI && isExpanded && criticalAI > 0 && (
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 12,
                          background: '#ef4444', color: 'white',
                        }}>
                          {criticalAI}
                        </span>
                      )}
                      {isAI && !isExpanded && criticalAI > 0 && (
                        <span style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 14, height: 14, borderRadius: '50%',
                          background: '#ef4444', fontSize: 8, fontWeight: 800,
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid rgba(45, 20, 65, 1)',
                        }}>
                          {criticalAI}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Profile */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
          {!isExpanded ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>
                {role === 'admin' ? 'AD' : 'CT'}
              </div>
              <button onClick={() => logout()} title="Logout" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e9d5ff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {role === 'admin' ? 'AD' : 'CT'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || (role === 'admin' ? 'Admin User' : 'Citizen')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={12} color="#c084fc" />
                    <span style={{ fontSize: 12, color: '#d8b4fe', fontWeight: 500, textTransform: 'capitalize' }}>{role}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => logout()} title="Logout" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', flexShrink: 0, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          )}
        </div>
      </aside>
      
      {/* Hide scrollbar logic */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
