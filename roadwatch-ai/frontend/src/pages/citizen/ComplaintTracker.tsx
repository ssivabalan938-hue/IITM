import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { complaintService } from '../../services/api';
import { Complaint } from '../../types';

export default function ComplaintTracker() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('roadwatch_token');
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchComplaints();
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      const data = await complaintService.getMyComplaints();
      setComplaints(data);
      if (data.length > 0) {
        setSelectedComplaint(data[0]);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (status: string, isRiskAnalyzed: boolean) => {
    // Standard citizen steps
    return [
      { 
        title: 'Report Submitted', 
        desc: 'Citizen hazard submission registered in the database.', 
        done: true 
      },
      { 
        title: 'Official Review', 
        desc: 'Divisional safety administrator inspecting proximity thresholds.', 
        done: status !== 'SUBMITTED' 
      },
      { 
        title: 'Risk Intelligence Run', 
        desc: 'Evaluated by the rule-based AI engine to generate safety solutions.', 
        done: isRiskAnalyzed || status === 'ANALYZED' || status === 'RESOLVED' 
      },
      { 
        title: 'Resolution Audited', 
        desc: 'Physical safety measures verified on site and audit marked.', 
        done: status === 'RESOLVED' 
      }
    ];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Header Nav */}
      <nav className="glass-panel border-b border-brand-border px-6 py-4 flex items-center gap-4 relative z-20">
        <button
          onClick={() => navigate('/citizen')}
          className="p-2 bg-brand-bg hover:bg-brand-border rounded-xl text-brand-muted hover:text-brand-text transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="font-bold text-lg text-brand-text">Complaint Tracker</span>
          <p className="text-[10px] text-brand-muted">Monitor safety reports status and audit stages</p>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* Left Side: Complaints list */}
        <div className="glass-panel rounded-2xl border border-brand-border p-6 flex flex-col h-[600px] lg:h-auto overflow-hidden">
          <div className="flex items-center gap-2 mb-4 font-bold text-sm text-brand-text uppercase tracking-wider">
            <Clock size={16} className="text-brand-primary" />
            Report History
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="text-center py-12 text-xs text-brand-muted">Loading safety reports...</div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12 text-xs text-brand-muted border border-dashed border-brand-border rounded-2xl">
                No reports found in your history.
              </div>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    selectedComplaint?.id === c.id
                      ? 'bg-brand-card border-brand-primary border-opacity-70 shadow-premium'
                      : 'bg-brand-bg border-brand-border hover:bg-brand-card hover:bg-opacity-50'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <span className="text-xs font-bold text-brand-text block truncate">
                      {c.issueType}
                    </span>
                    <span className="text-[10px] text-brand-muted block truncate">
                      {c.locationName}
                    </span>
                    <span className="text-[9px] text-brand-primary font-semibold block">
                      Updated {formatDate(c.updatedAt).split(',')[0]}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-brand-muted shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Timeline and Detailed view */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-[600px] lg:h-auto">
          {selectedComplaint ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
              {/* Timeline list */}
              <div className="glass-panel rounded-2xl border border-brand-border p-6 flex flex-col overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 font-bold text-sm text-brand-text uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-brand-secondary" />
                  Resolution Milestones
                </div>

                <div className="relative border-l border-brand-border pl-6 ml-3 space-y-8 flex-1">
                  {getStatusSteps(selectedComplaint.status, selectedComplaint.isRiskAnalyzed).map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Ring Indicator */}
                      <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                        step.done
                          ? 'bg-brand-secondary border-brand-bg text-[#0B0F19]'
                          : 'bg-brand-bg border-brand-border text-brand-muted'
                      }`}>
                        {idx + 1}
                      </span>
                      
                      <div className="space-y-1">
                        <span className={`text-xs font-bold block ${step.done ? 'text-brand-text' : 'text-brand-muted'}`}>
                          {step.title}
                        </span>
                        <p className="text-[11px] text-brand-muted leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details & Image */}
              <div className="glass-panel rounded-2xl border border-brand-border p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-brand-text uppercase tracking-wider border-b border-brand-border pb-3">
                    <FileText size={16} className="text-brand-accent" />
                    Audit Particulars
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-muted block font-semibold uppercase">Hazard Type</span>
                    <span className="text-xs font-bold text-brand-text">{selectedComplaint.issueType}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-muted block font-semibold uppercase">Exact Proximity Landmark</span>
                    <span className="text-xs text-brand-text leading-tight block">{selectedComplaint.locationName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-brand-muted block font-semibold uppercase">Latitude</span>
                      <span className="text-brand-text">{selectedComplaint.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-muted block font-semibold uppercase">Longitude</span>
                      <span className="text-brand-text">{selectedComplaint.longitude.toFixed(6)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-muted block font-semibold uppercase">Report Date</span>
                    <span className="text-xs text-brand-text">{formatDate(selectedComplaint.createdAt)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-brand-muted block font-semibold uppercase">Citizen Observations</span>
                    <p className="text-xs text-brand-text bg-brand-bg p-3 rounded-xl border border-brand-border leading-relaxed">
                      {selectedComplaint.description}
                    </p>
                  </div>
                </div>

                {selectedComplaint.imageUrl ? (
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <span className="text-[10px] text-brand-muted block font-semibold uppercase mb-2">Uploaded Image Evidence</span>
                    <div className="h-32 w-full rounded-xl border border-brand-border overflow-hidden bg-brand-bg relative">
                      <img 
                        src={`http://localhost:5000${selectedComplaint.imageUrl}`} 
                        alt="Hazard evidence" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback source in case backend address differs or serving is slow
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-brand-border text-center py-4 text-xs text-brand-muted bg-brand-bg rounded-xl border border-dashed">
                    No image attached to this safety report.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow glass-panel rounded-2xl border border-brand-border flex flex-col justify-center items-center text-center p-8">
              <HelpCircle size={48} className="text-brand-border opacity-70 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">No Report Selected</h3>
              <p className="text-xs text-brand-muted max-w-sm mt-2">
                Choose a hazard report from the history panel on the left to track its verification steps and resolution audits.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
