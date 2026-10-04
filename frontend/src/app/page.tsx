'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useLiveSocket } from '@/lib/useLiveSocket';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import OverviewPage from '@/components/pages/OverviewPage';
import TrafficPage from '@/components/pages/TrafficPage';
import AQIPage from '@/components/pages/AQIPage';
import WastePage from '@/components/pages/WastePage';
import WaterPage from '@/components/pages/WaterPage';
import InfrastructurePage from '@/components/pages/InfrastructurePage';
import ComplaintsPage from '@/components/pages/ComplaintsPage';
import AlertsPage from '@/components/pages/AlertsPage';
import AnalyticsPage from '@/components/pages/AnalyticsPage';
import AdminPage from '@/components/pages/AdminPage';
import AIAlertsPage from '@/components/pages/AIAlertsPage';
import RoadIntelligencePage from '@/components/pages/RoadIntelligencePage';
import AdminOperationsPage from '@/components/pages/AdminOperationsPage';
import MobileBottomNav from '@/components/MobileBottomNav';
import GISExplorerPage from '@/components/pages/GISExplorerPage';
import GISAnalysisPage from '@/components/pages/GISAnalysisPage';
import RemoteSensingPage from '@/components/pages/RemoteSensingPage';
import SpatialStatsPage from '@/components/pages/SpatialStatsPage';
import UrbanModelsPage from '@/components/pages/UrbanModelsPage';
import AutomationStudioPage from '@/components/pages/AutomationStudioPage';

const pageMap: Record<string, React.ComponentType> = {
  overview: OverviewPage,
  'road-intelligence': RoadIntelligencePage,
  'issue-operations': AdminOperationsPage,
  'gis-explorer': GISExplorerPage,
  'gis-analysis': GISAnalysisPage,
  'remote-sensing': RemoteSensingPage,
  'spatial-stats': SpatialStatsPage,
  'urban-models': UrbanModelsPage,
  'automation-studio': AutomationStudioPage,
  traffic: TrafficPage,
  aqi: AQIPage,
  waste: WastePage,
  water: WaterPage,
  infrastructure: InfrastructurePage,
  complaints: ComplaintsPage,
  alerts: AlertsPage,
  'ai-alerts': AIAlertsPage,
  analytics: AnalyticsPage,
  admin: AdminPage,
  'data-sources': AdminPage,
  'system-health': AdminPage,
  'user-management': AdminPage,
};

export default function Dashboard() {
  const router = useRouter();
  const { activePage, sidebarCollapsed, isAuthenticated } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/login');
    }
  }, [isClient, isAuthenticated, router]);

  useLiveSocket();
  
  const PageComponent = pageMap[activePage] || OverviewPage;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activePage]);

  if (!isClient || !isAuthenticated) return null; // Avoid rendering flash before redirect

  const sidebarWidth = 104; // Fixed margin for floating pill sidebar (16px left + 72px width + 16px right gap)
  
  // List of pages that should span the full width (map backgrounds)
  const fullScreenPages = ['overview', 'gis-explorer', 'gis-analysis', 'remote-sensing', 'spatial-stats', 'urban-models'];
  const isFullScreen = fullScreenPages.includes(activePage);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <Navbar onMobileMenuToggle={() => setMobileMenuOpen(prev => !prev)} />
      
      <main
        style={{
          position: 'relative',
          paddingLeft: isMobile || isFullScreen ? 0 : sidebarWidth,
          marginTop: isFullScreen ? 0 : 96,
          minHeight: isFullScreen ? '100vh' : 'calc(100vh - 96px)',
          paddingBottom: isMobile ? 72 : 0, // space for bottom nav
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        }}
      >
        <PageComponent key={activePage} />
      </main>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
