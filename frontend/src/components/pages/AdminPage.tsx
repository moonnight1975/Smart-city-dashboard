'use client';

import { useAppStore } from '@/lib/store';
import { Users, Settings, Shield, AlertTriangle, CheckCircle, RefreshCw, Database, Cpu, Activity, MessageSquare, Trash2, Zap, X, CheckCircle2, Loader2, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const systemHealth = [
  { name: 'API Server', status: 'Operational', latency: '12ms', uptime: '99.97%', icon: Cpu },
  { name: 'Database', status: 'Operational', latency: '3ms', uptime: '100%', icon: Database },
  { name: 'WebSocket', status: 'Operational', latency: '8ms', uptime: '99.85%', icon: Activity },
  { name: 'AI Engine', status: 'Operational', latency: '24ms', uptime: '99.2%', icon: Zap },
  { name: 'Notification Service', status: 'Operational', latency: '45ms', uptime: '99.91%', icon: AlertTriangle },
];

export default function AdminPage() {
  const { role } = useAppStore();
  const [activeTab, setActiveTab] = useState<'users' | 'data' | 'system' | 'settings' | 'logs'>('users');
  
  const [users, setUsers] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const [uRes, dRes, lRes, sRes] = await Promise.all([
        fetch(`${baseUrl}/api/v2/admin/users`),
        fetch(`${baseUrl}/api/v2/admin/data_sources`),
        fetch(`${baseUrl}/api/v2/admin/audit_logs`),
        fetch(`${baseUrl}/api/v2/admin/settings`)
      ]);
      const [u, d, l, s] = await Promise.all([uRes.json(), dRes.json(), lRes.json(), sRes.json()]);
      setUsers(u.users || []);
      setDataSources(d.data_sources || []);
      setLogs(l.logs || []);
      setSettings(s.settings);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      await fetch(`${baseUrl}/api/v2/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader2 className="animate-spin text-accent-blue" size={32} />
    </div>
  );

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={28} className="text-accent-blue" /> System Administration
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage users, data integrations, and global platform settings.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'users', label: 'Users & Roles', icon: Users },
            { id: 'data', label: 'Data Sources', icon: Database },
            { id: 'system', label: 'System Health', icon: Activity },
            { id: 'settings', label: 'Global Settings', icon: Settings },
            { id: 'logs', label: 'Audit Logs', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8,
                  background: activeTab === tab.id ? 'var(--accent-blue)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="glass-card" style={{ flex: 1, minHeight: 500 }}>
          
          {/* USERS */}
          {activeTab === 'users' && (
            <div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Role-Based Access Control</h2>
                <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>Invite User</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Joined</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className="badge" style={{
                          background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                          color: u.role === 'admin' ? '#3b82f6' : 'var(--text-secondary)'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Active
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DATA SOURCES */}
          {activeTab === 'data' && (
            <div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>GIS & Data Integrations</h2>
                <button className="btn-secondary" onClick={fetchAdminData} style={{ padding: '4px 12px', fontSize: 12 }}><RefreshCw size={12}/> Refresh</button>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {dataSources.map(ds => (
                  <div key={ds.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid var(--border-color)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{ds.provider}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({ds.dataset})</span>
                        {ds.connection_state === 'LIVE' && <span className="badge badge-green">LIVE</span>}
                        {ds.connection_state === 'UNAVAILABLE' && <span className="badge badge-red">UNAVAILABLE</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
                        <span>Coverage: {ds.coverage}</span>
                        <span>Updated: {new Date(ds.last_updated).toLocaleString()}</span>
                      </div>
                      {ds.error_status && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>Error: {ds.error_status}</div>}
                    </div>
                    <button className="btn-secondary">Configure</button>
                  </div>
                ))}
                {dataSources.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No data sources configured.</div>}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Global Platform Settings</h2>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Platform Maintenance Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Disable citizen access and show maintenance screen.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>AI Engine Integration</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enable computer vision and predictive risk analytics.</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={settings.enableAI} onChange={e => setSettings({...settings, enableAI: e.target.checked})} />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div style={{ height: 1, background: 'var(--border-color)' }} />

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>AQI Critical Threshold</label>
                  <input type="number" className="input-field" value={settings.aqiCritical} onChange={e => setSettings({...settings, aqiCritical: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Dashboard Refresh Interval (Seconds)</label>
                  <input type="number" className="input-field" value={settings.refreshIntervalSec} onChange={e => setSettings({...settings, refreshIntervalSec: parseInt(e.target.value)})} />
                </div>

                <button onClick={handleSaveSettings} disabled={saving} className="btn-primary" style={{ width: 'fit-content' }}>
                  {saving ? 'Saving...' : <><Save size={16} /> Save Configuration</>}
                </button>
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Security & Audit Logs</h2>
              </div>
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Timestamp</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Issue ID</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Actor</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((lg, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{new Date(lg.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '12px 24px', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{lg.issue_id}</td>
                        <td style={{ padding: '12px 24px', color: '#e2e8f0' }}>{lg.actor_id}</td>
                        <td style={{ padding: '12px 24px', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc', display: 'block' }}>{lg.action}</span>
                          <span style={{ fontSize: 11 }}>{lg.note}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs available.</div>}
              </div>
            </div>
          )}

          {/* SYSTEM HEALTH */}
          {activeTab === 'system' && (
            <div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Microservice Health Check</h2>
              </div>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                {systemHealth.map(sys => {
                  const Icon = sys.icon;
                  return (
                    <div key={sys.name} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon size={16} color="var(--text-secondary)" />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{sys.name}</span>
                        </div>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: sys.status === 'Operational' ? '#10b981' : '#f59e0b', boxShadow: `0 0 8px ${sys.status === 'Operational' ? '#10b981' : '#f59e0b'}` }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        <div>Uptime: <strong style={{ color: '#e2e8f0' }}>{sys.uptime}</strong></div>
                        <div>Latency: <strong style={{ color: '#e2e8f0' }}>{sys.latency}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
        input:checked + .slider { background-color: var(--accent-blue); }
        input:checked + .slider:before { transform: translateX(20px); }
        .slider.round { border-radius: 24px; }
        .slider.round:before { border-radius: 50%; }
      `}} />
    </div>
  );
}
