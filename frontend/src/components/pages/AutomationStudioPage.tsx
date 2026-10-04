'use client';

import { useState } from 'react';
import { Network, Database, Filter, ArrowRight, Play, FileJson, Layers, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AutomationStudioPage() {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const nodes = [
    { id: 1, type: 'source', label: 'Load City Boundaries', icon: Database, color: 'var(--accent-blue)' },
    { id: 2, type: 'process', label: 'Filter Ward 4', icon: Filter, color: 'var(--accent-orange)' },
    { id: 3, type: 'source', label: 'Load Incidents', icon: Database, color: 'var(--accent-blue)' },
    { id: 4, type: 'process', label: 'Spatial Join', icon: Layers, color: 'var(--accent-purple)' },
    { id: 5, type: 'output', label: 'Export GeoJSON', icon: FileJson, color: 'var(--accent-green)' },
  ];

  const handleRun = async () => {
    setRunning(true);
    setCompleted(false);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/ai/automation/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      });
      const data = await res.json();
      setResult(data);
      setCompleted(true);
      toast.success(data.message || 'Pipeline executed successfully');
    } catch (err) {
      toast.error('Failed to execute pipeline');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page-enter" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Network size={22} className="text-accent-blue" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif" }}>GIS Automation Studio</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visual Geoprocessing Workflow Editor</div>
          </div>
        </div>
        <button 
          onClick={handleRun}
          disabled={running}
          className="btn-primary" 
          style={{ width: 140, justifyContent: 'center', background: running ? 'var(--text-muted)' : 'var(--accent-green)' }}
        >
          {running ? 'Executing...' : <><Play size={16} /> Run Pipeline</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, flex: 1, minHeight: 0 }}>
        
        {/* Canvas Area */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', background: '#080d18' }}>
          
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '30px 30px' }} />
          
          <div style={{ position: 'absolute', top: 40, left: 40, padding: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <strong>Demo Pipeline:</strong> High-risk Ward 4 Incidents Filter
          </div>

          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'relative' }}>
              
              <div style={{ display: 'flex', gap: 120, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
                  <div className={`node-card ${running ? 'pulse' : ''}`} style={{ borderColor: 'var(--accent-blue)' }}>
                    <Database size={16} color="var(--accent-blue)" /> Load City Boundaries
                  </div>
                  <div className={`node-card ${running ? 'pulse' : ''}`} style={{ borderColor: 'var(--accent-blue)' }}>
                    <Database size={16} color="var(--accent-blue)" /> Load Incidents
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
                  <div className={`node-card ${running ? 'pulse' : ''}`} style={{ borderColor: 'var(--accent-orange)' }}>
                    <Filter size={16} color="var(--accent-orange)" /> Filter Ward 4
                  </div>
                </div>

                <div className={`node-card ${running ? 'pulse' : ''}`} style={{ borderColor: 'var(--accent-purple)' }}>
                  <Layers size={16} color="var(--accent-purple)" /> Spatial Join
                </div>

                <div className={`node-card ${running ? 'pulse' : ''}`} style={{ borderColor: 'var(--accent-green)' }}>
                  <FileJson size={16} color="var(--accent-green)" /> Export GeoJSON
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Console / Output */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 13, fontWeight: 700 }}>
            Execution Console
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'monospace', fontSize: 12 }}>
            {running && (
              <>
                <div style={{ color: 'var(--text-muted)' }}>[14:00:01] Starting pipeline execution...</div>
                <div style={{ color: 'var(--text-secondary)' }}>[14:00:01] Loading City Boundaries (1.2MB)</div>
                <div style={{ color: 'var(--text-secondary)' }}>[14:00:02] Loading Incidents Data (450KB)</div>
                <div style={{ color: 'var(--accent-orange)' }}>[14:00:02] Applying Filter: Ward 4</div>
                <div style={{ color: 'var(--accent-purple)' }}>[14:00:03] Executing Spatial Join...</div>
              </>
            )}
            
            {completed && result && (
              <>
                <div style={{ color: 'var(--text-muted)' }}>[14:00:01] Starting pipeline execution...</div>
                <div style={{ color: 'var(--text-secondary)' }}>[14:00:01] Loading City Boundaries (1.2MB)</div>
                <div style={{ color: 'var(--text-secondary)' }}>[14:00:02] Loading Incidents Data (450KB)</div>
                <div style={{ color: 'var(--accent-orange)' }}>[14:00:02] Applying Filter: Ward 4</div>
                <div style={{ color: 'var(--accent-purple)' }}>[14:00:03] Executing Spatial Join...</div>
                <div style={{ color: 'var(--accent-green)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} /> Pipeline Completed Successfully
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 6, marginTop: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Output Generated:</div>
                  <div style={{ color: '#06b6d4' }}>Features processed: {result.features_processed}</div>
                  <div style={{ color: '#06b6d4' }}>URL: {result.output_url}</div>
                </div>
              </>
            )}

            {!running && !completed && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
                Ready to execute pipeline.
              </div>
            )}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .node-card {
          padding: 12px 16px;
          background: rgba(13, 22, 41, 0.9);
          border: 1px solid;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          position: relative;
          z-index: 10;
        }
        .pulse {
          animation: pulseBorder 1.5s infinite;
        }
        @keyframes pulseBorder {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
          70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
      `}} />
    </div>
  );
}
