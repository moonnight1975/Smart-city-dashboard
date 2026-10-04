'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical': return '#ef4444';
    case 'High': return '#f59e0b';
    case 'Medium': return '#3b82f6';
    case 'Low': return '#10b981';
    default: return '#64748b';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Submitted': return '#64748b';
    case 'Assigned': return '#3b82f6';
    case 'In Progress': return '#f59e0b';
    case 'Resolved': return '#10b981';
    case 'Closed': return '#10b981';
    default: return '#64748b';
  }
};
import { downloadText, toCSV } from '@/lib/exporters';
import { MessageSquare, Plus, Upload, MapPin, Filter, Search, X, CheckCircle, Clock, AlertCircle, Send, Loader2, Camera } from 'lucide-react';
import {
  BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { fetchPublicIssues, submitIssue } from '@/lib/publicIssueApi';
import type { CivicIssue } from '@/lib/issueApi';
import toast from 'react-hot-toast';

const COMPLAINT_TYPES = ['Pothole', 'Garbage', 'Streetlight', 'Water Leak', 'Smoke', 'Noise', 'Other'];

export default function ComplaintsPage() {
  const { role } = useAppStore();
  const [complaints, setComplaints] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiDetected, setAiDetected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPublicIssues()
      .then(data => { setComplaints(data); setLoading(false); })
      .catch(err => { toast.error("Failed to fetch complaints"); setLoading(false); });
  }, []);

  const filtered = useMemo(() => complaints.filter(c => {
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchSearch = !searchQuery || c.category.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  }), [complaints, filterStatus, searchQuery]);

  const statusCounts = useMemo(() => ({
    Open: complaints.filter(c => c.status === 'Submitted' || c.status === 'Verified').length,
    'In Progress': complaints.filter(c => c.status === 'Assigned' || c.status === 'Work in progress' || c.status === 'Awaiting citizen confirmation').length,
    Resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
  }), [complaints]);

  const complaintsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.keys(counts).map(k => ({ type: k, count: counts[k] })).sort((a,b) => b.count - a.count);
  }, [complaints]);

  const complaintsByArea = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => { 
      const loc = c.location.split(',')[0] || c.location;
      counts[loc] = (counts[loc] || 0) + 1; 
    });
    return Object.keys(counts).map(k => ({ area: k, count: counts[k] })).sort((a,b) => b.count - a.count).slice(0, 5);
  }, [complaints]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      
      // Simulate AI analysis
      setTimeout(() => {
        if (selectedType === 'Pothole') setAiDetected('Severe road degradation detected (94% confidence)');
        else if (selectedType === 'Garbage') setAiDetected('Mixed solid waste detected (88% confidence)');
        else setAiDetected('Issue verified by AI vision (82% confidence)');
      }, 800);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !description || !location) return;
    setSubmitting(true);
    
    try {
      const newIssue = await submitIssue({
        category: selectedType,
        title: `${selectedType} Report`,
        description,
        location,
        lat: null, lng: null
      });
      
      setComplaints([newIssue, ...complaints]);
      setSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit issue");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setDescription('');
    setLocation('');
    setImagePreview(null);
    setAiDetected(null);
    setSubmitted(false);
    setShowForm(false);
  };

  const handleExport = () => {
    const csv = toCSV(filtered.map(c => ({
      ID: c.id,
      Type: c.category,
      Status: c.status,
      Location: c.location,
      Date: c.created_at,
    })));
    downloadText(csv, `civic-issues-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Civic Services & Complaints</h1>
          <p style={{ color: 'var(--text-muted)' }}>AI-triaged issue reporting and tracking platform.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={handleExport}>
            <Upload size={16} /> Export
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> File New Complaint
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="animate-spin text-accent-cyan" size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Main List */}
          <div className="glass-card" style={{ gridColumn: '1 / -1', lg: { gridColumn: 'span 2' } } as any}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-title" style={{ margin: 0 }}>Recent Reports</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }} />
                  <input 
                    type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '6px 12px 6px 30px', borderRadius: 8, color: '#fff', fontSize: 13, width: 180 }}
                  />
                </div>
                <select 
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 8, color: '#fff', fontSize: 13 }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Work in progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {filtered.map(c => (
                <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{c.category}</span>
                      <span className="badge" style={{ backgroundColor: getStatusColor(c.status) + '22', color: getStatusColor(c.status), border: `1px solid ${getStatusColor(c.status)}44` }}>
                        {c.status}
                      </span>
                      {c.grouped_reports > 0 && (
                        <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                          +{c.grouped_reports} duplicates grouped
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{c.description || c.title}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {c.location}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(c.created_at).toLocaleDateString()}</div>
                      <div>Reporter: {c.reporter_name || 'Citizen'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: getPriorityColor(c.priority) }}>{c.priority.toUpperCase()} PRIORITY</div>
                    <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>View Details</button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No complaints found matching filters.</div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: '1 / -1', '@media (min-width: 1024px)': { gridColumn: 'span 1' } } as any}>
            
            {/* Summary */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Status Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>{statusCounts.Open}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase' }}>Open</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>{statusCounts['In Progress']}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase' }}>In Progress</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 16, borderRadius: 12, gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>{statusCounts.Resolved}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase' }}>Resolved (Last 30 Days)</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>By Type</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={complaintsByType} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" />
                  <Tooltip contentStyle={{ background: '#0d1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Complaints" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {complaintsByType.map((_, i) => <Cell key={i} fill={`hsl(${260 + i * 15}, 70%, 60%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>By Area</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={complaintsByArea} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} hide />
                  <YAxis dataKey="area" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ background: '#0d1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Complaints" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                    {complaintsByArea.map((_, i) => <Cell key={i} fill={`hsl(${190 + i * 15}, 70%, 50%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* Slide-over Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 480, height: '100%', background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "'Instrument Serif', serif" }}>File a Complaint</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>Complaint Submitted!</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Your report has been logged. Our AI has triaged it and routed it to the appropriate department.</p>
                  </div>
                  <button className="btn-secondary" onClick={resetForm} style={{ marginTop: 24 }}>Submit Another</button>
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <label>Issue Type *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {COMPLAINT_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          style={{
                            padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                            background: selectedType === type ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${selectedType === type ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                            color: selectedType === type ? '#06b6d4' : 'var(--text-secondary)'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Location *</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input 
                        type="text" className="input-field" placeholder="e.g. Near Station Road, Virar West"
                        style={{ paddingLeft: 36 }}
                        value={location} onChange={e => setLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Description *</label>
                    <textarea 
                      className="input-field" placeholder="Please describe the issue..." rows={4}
                      value={description} onChange={e => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>Photo Evidence (Optional)</label>
                    <div 
                      onClick={() => fileRef.current?.click()}
                      style={{ 
                        border: '1px dashed var(--border-color)', borderRadius: 12, padding: 24, 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                        cursor: 'pointer', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden'
                      }}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={20} color="var(--text-muted)" />
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to upload a photo</div>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                  </div>

                  {aiDetected && (
                    <div style={{ padding: 12, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 8, display: 'flex', gap: 12 }}>
                      <AlertCircle size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#d8b4fe', marginBottom: 2 }}>AI Vision Analysis</div>
                        <div style={{ fontSize: 12, color: '#e9d5ff' }}>{aiDetected}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                    <button 
                      className="btn-primary" 
                      onClick={handleSubmit} 
                      disabled={!selectedType || !location || !description || submitting}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
                    >
                      {submitting ? 'Submitting...' : <><Send size={16} /> Submit Report</>}
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
