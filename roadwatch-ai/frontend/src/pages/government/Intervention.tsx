import { useState, useMemo } from 'react';
import {
  HardHat, Clock, CheckCircle2, AlertTriangle,
  Search, Filter, SortDesc, ChevronDown, ChevronUp,
  Calendar, Image as ImageIcon, User, Activity,
  TrendingUp, MapPin, Wrench, Eye
} from 'lucide-react';
import { ConstructionStatus } from '../../types';

interface InterventionTabProps {
  constructions: ConstructionStatus[];
  onRefresh?: () => void;
}

/* ── helpers ── */
const getRiskLevel = (score: number) => {
  if (score >= 90) return 'CRITICAL';
  if (score >= 80) return 'HIGH';
  if (score >= 70) return 'MEDIUM';
  return 'LOW';
};

const riskBadge: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LOW:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:            { label: 'Pending',           color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',     dot: 'bg-amber-400' },
  APPROVED:           { label: 'Approved',           color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',       dot: 'bg-blue-400' },
  UNDER_CONSTRUCTION: { label: 'Under Construction', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400 animate-pulse' },
  COMPLETED:          { label: 'Completed',          color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400' },
};

/* ── photo thumbnail ── */
function PhotoSlot({ url, label }: { url?: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">{label}</span>
      <div className="rounded-xl border border-brand-border overflow-hidden aspect-[4/3] bg-brand-bg/60 flex items-center justify-center relative group">
        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <a href={url} target="_blank" rel="noreferrer"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye size={18} className="text-white" />
            </a>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-brand-muted/40">
            <ImageIcon size={20} />
            <span className="text-[9px]">No photo</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterventionTab({ constructions, onRefresh }: InterventionTabProps) {
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter,   setRiskFilter]   = useState('ALL');
  const [sortBy,       setSortBy]       = useState('RECENTLY_UPDATED');
  const [expandedId,   setExpandedId]   = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = [...constructions];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter(c =>
        c.hotspot.locationName.toLowerCase().includes(q) ||
        c.hotspot.id.toLowerCase().includes(q) ||
        (c.assignedEngineerName || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') r = r.filter(c => c.status === statusFilter);
    if (riskFilter   !== 'ALL') r = r.filter(c => getRiskLevel(c.hotspot.predictedRiskScore) === riskFilter);

    r.sort((a, b) => {
      switch (sortBy) {
        case 'HIGHEST_RISK':   return b.hotspot.predictedRiskScore - a.hotspot.predictedRiskScore;
        case 'COMPLETION_DATE':
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        case 'PROGRESS':       return (b.progress || 0) - (a.progress || 0);
        default:               return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    return r;
  }, [constructions, searchTerm, statusFilter, riskFilter, sortBy]);

  return (
    <div className="flex flex-col h-full min-h-[600px] space-y-5">

      {/* ── READ-ONLY notice ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-semibold">
        <Eye size={14} />
        Construction Status is <strong>read-only</strong> for government officials.
        Only the assigned engineer can update progress, photos and status.
      </div>

      {/* ── Filters ── */}
      <div className="glass-panel border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={15} />
          <input
            type="text"
            placeholder="Search location, hotspot ID, engineer…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-brand-bg/50 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text placeholder-brand-muted transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <div className="flex items-center gap-2 bg-brand-bg/50 border border-brand-border rounded-xl px-3 py-1.5">
            <Filter size={13} className="text-brand-muted" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-brand-text font-medium focus:outline-none">
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-brand-bg/50 border border-brand-border rounded-xl px-3 py-1.5">
            <AlertTriangle size={13} className="text-brand-muted" />
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
              className="bg-transparent text-xs text-brand-text font-medium focus:outline-none">
              <option value="ALL">All Risk</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-brand-bg/50 border border-brand-border rounded-xl px-3 py-1.5">
            <SortDesc size={13} className="text-brand-muted" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-brand-text font-medium focus:outline-none">
              <option value="RECENTLY_UPDATED">Recently Updated</option>
              <option value="HIGHEST_RISK">Highest Risk</option>
              <option value="PROGRESS">Most Progress</option>
              <option value="COMPLETION_DATE">Completion Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-muted border-2 border-dashed border-brand-border rounded-2xl glass-panel">
            <HardHat size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">No construction projects match your criteria.</p>
          </div>
        ) : filtered.map(item => {
          const risk       = getRiskLevel(item.hotspot.predictedRiskScore);
          const sm         = statusMeta[item.status] ?? statusMeta['PENDING'];
          const isExpanded = expandedId === item.id;
          const progress   = item.progress || 0;

          return (
            <div key={item.id} className="glass-panel border border-brand-border hover:border-brand-primary/30 rounded-2xl overflow-hidden transition-all group relative">

              {/* progress stripe */}
              <div
                className="h-1 bg-gradient-to-r from-brand-primary to-brand-highlight transition-all duration-700"
                style={{ width: `${progress}%` }}
              />

              {/* ── Card header ── */}
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : item.id);
                  }
                }}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 cursor-pointer select-none outline-none focus:ring-1 focus:ring-brand-primary/30 rounded-t-2xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-brand-muted px-2 py-1 bg-brand-bg rounded-lg border border-brand-border">
                      #{item.hotspot.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${riskBadge[risk]}`}>
                      {risk} RISK
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sm.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                      {sm.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-brand-text flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-brand-primary shrink-0" />
                    {item.hotspot.locationName}
                  </h3>

                  <p className="text-xs text-brand-muted flex items-center gap-1.5">
                    <Wrench size={11} className="text-brand-accent" />
                    {item.hotspot.predictedCause || 'Multiple Hazards'}
                  </p>
                </div>

                {/* Right summary */}
                <div className="flex flex-col items-end gap-2 shrink-0 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                  {/* Assigned Engineer */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <User size={13} className="text-brand-primary" />
                    <span className="text-brand-muted">Engineer:</span>
                    <span className="font-bold text-brand-text">
                      {item.assignedEngineerName || <span className="text-brand-muted/50 font-normal italic">Not assigned</span>}
                    </span>
                  </div>

                  {/* Expected completion */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar size={13} className="text-brand-primary" />
                    <span className="text-brand-muted">Due:</span>
                    <span className="font-bold text-brand-text">
                      {item.targetDate ? new Date(item.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}
                    </span>
                  </div>

                  {/* Last updated */}
                  <div className="text-[10px] text-brand-muted">
                    Updated: {new Date(item.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>

                  {/* Expand button */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="mt-1 flex items-center gap-1.5 px-4 py-1.5 bg-brand-bg border border-brand-border hover:border-brand-primary/40 rounded-xl text-xs font-semibold transition-all"
                  >
                    {isExpanded ? <><ChevronUp size={13}/> Hide Details</> : <><ChevronDown size={13}/> View Details</>}
                  </button>
                </div>
              </div>

              {/* ── Progress bar row ── */}
              <div className="mx-5 mb-4 flex items-center gap-4 p-3 bg-brand-bg/50 border border-brand-border/60 rounded-xl">
                <TrendingUp size={14} className="text-brand-primary shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-bold text-brand-muted mb-1">
                    <span>PROGRESS</span>
                    <span className="text-brand-primary">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-brand-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-highlight rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Expanded details (read-only) ── */}
              {isExpanded && (
                <div className="border-t border-brand-border bg-brand-bg/30 p-5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* LEFT: info fields */}
                  <div className="space-y-4">

                    {/* Latest Update */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                        <Activity size={10}/> Latest Update
                      </label>
                      <div className="w-full p-3 bg-brand-card border border-brand-border rounded-xl text-xs text-brand-text min-h-[70px] whitespace-pre-wrap">
                        {item.notes || <span className="italic text-brand-muted/50">No update provided yet.</span>}
                      </div>
                    </div>

                    {/* Assigned Engineer (full card) */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                        <User size={10}/> Assigned Engineer
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-brand-card border border-brand-border rounded-xl">
                        <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <HardHat size={16} className="text-brand-primary" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-brand-text">
                            {item.assignedEngineerName || '—'}
                          </div>
                          <div className="text-[10px] text-brand-muted">Field Engineer</div>
                        </div>
                      </div>
                    </div>

                    {/* Status + Expected Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5 block">Status</label>
                        <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${sm.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                          {sm.label}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5">
                          <Calendar size={9}/> Expected Date
                        </label>
                        <div className="px-3 py-2 rounded-xl border border-brand-border text-xs font-bold text-brand-text bg-brand-card">
                          {item.targetDate
                            ? new Date(item.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : <span className="italic text-brand-muted/60 font-normal">Not set</span>}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div>
                      <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5 block">AI Recommended Fix</label>
                      <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-xs text-brand-text/80 leading-relaxed">
                        {item.hotspot.suggestedFix}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: photos */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                      <ImageIcon size={10}/> Site Photos (Engineer Uploaded)
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <PhotoSlot url={item.beforePhotoUrl}        label="Before Work" />
                      <PhotoSlot url={item.constructionPhotoUrl}  label="In Progress"  />
                      <PhotoSlot url={item.completionPhotoUrl}    label="Completion"   />
                    </div>

                    {/* completion summary */}
                    {item.completionPhotoUrl && item.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold mt-2">
                        <CheckCircle2 size={14}/> This project has been marked as completed by the engineer.
                      </div>
                    )}

                    {/* engineering notes — read only for gov */}
                    {item.engineeringNotes && (
                      <div className="mt-3">
                        <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1.5 block">Engineering Notes</label>
                        <div className="p-3 bg-brand-card border border-brand-border rounded-xl text-xs text-brand-text/80 whitespace-pre-wrap">
                          {item.engineeringNotes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
