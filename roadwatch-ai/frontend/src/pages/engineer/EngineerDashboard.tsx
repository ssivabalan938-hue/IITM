import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, LogOut, Save, Clock, AlertTriangle, Camera,
  CheckCircle2, UploadCloud, Image as ImageIcon, CalendarDays,
  Activity, MapPin, Wrench, X, Trash2
} from 'lucide-react';
import { interventionService } from "../../services/api";
import { ConstructionStatus } from '../../types';

/* ─── tiny helper: encode file as base64 data-url ─── */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function safeFormatDate(dateStr: any): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/* ─── status badge colours ─── */
const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:           { label: 'Pending',           color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',   dot: 'bg-amber-400' },
  APPROVED:          { label: 'Approved',           color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',     dot: 'bg-blue-400' },
  UNDER_CONSTRUCTION:{ label: 'Under Construction', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400 animate-pulse' },
  COMPLETED:         { label: 'Completed',          color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400' },
};

export default function EngineerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<ConstructionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEdits, setTaskEdits] = useState<Record<string, ConstructionStatus>>({});
  const [savingTaskIds, setSavingTaskIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  /* Refs for file inputs inside modal */
  const beforeInputRef = useRef<HTMLInputElement | null>(null);
  const duringInputRef = useRef<HTMLInputElement | null>(null);
  const afterInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('roadwatch_user');
    if (!storedUser) { navigate('/auth'); return; }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    const emailPrefix = parsed.officialEmail ? parsed.officialEmail.split('@')[0] : '';
    fetchTasks(parsed.id, parsed.name || parsed.employeeId, emailPrefix);
  }, [navigate]);

  const fetchTasks = async (engineerId: string, engineerName: string, emailPrefix: string) => {
    setLoading(true);
    try {
      const all = await interventionService.getConstructionList();
      console.log('Fetching tasks for Engineer:', { engineerId, engineerName, emailPrefix });
      console.log('Loaded all constructions:', all);
      /* match by id OR by name OR by email prefix */
      const mine = all.filter(
        (c: any) =>
          c.assignedEngineerId === engineerId ||
          (c.assignedEngineerName && engineerName &&
           c.assignedEngineerName.toLowerCase() === engineerName.toLowerCase()) ||
          (c.assignedEngineerName && emailPrefix &&
           c.assignedEngineerName.toLowerCase() === emailPrefix.toLowerCase())
      );
      console.log('Filtered assigned tasks for current engineer:', mine);
      setTasks(mine);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_user');
    navigate('/auth');
  };

// Modal editing functions removed – inline edit UI is implemented per card.

  // Helper: start editing a task (initialize edit state)
  const startEdit = (task: ConstructionStatus) => {
    setTaskEdits(prev => ({ ...prev, [task.id]: { ...task } }));
    setEditingTaskId(task.id);
  };

  // Helper: cancel edit for a task
  const cancelEdit = (taskId: string) => {
    setTaskEdits(prev => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
    setEditingTaskId(null);
  };

  // Helper: save edit for a task
  const saveEdit = async (taskId: string) => {
    const edit = taskEdits[taskId];
    if (!edit) return;
    setSavingTaskIds(prev => [...prev, taskId]);
    try {
      await interventionService.updateConstructionStatus(edit.hotspotId, edit);
      // Refresh tasks list
      if (user) {
        const emailPrefix = user.officialEmail ? user.officialEmail.split('@')[0] : '';
        fetchTasks(user.id, user.name || user.employeeId, emailPrefix);
      }
      alert('✅ Details saved successfully!');
    } catch (err) {
      console.error('Save failed', err);
      alert('❌ Failed to save. Please try again.');
    } finally {
      setSavingTaskIds(prev => prev.filter(id => id !== taskId));
      cancelEdit(taskId);
    }
  };

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col text-brand-text">

      {/* ── Navbar ── */}
      <nav className="glass-panel border-b border-brand-border px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/30 rounded-xl flex items-center justify-center">
            <HardHat className="text-brand-primary" size={22} />
          </div>
          <div>
            <span className="font-extrabold text-xl text-brand-text tracking-wide">Engineer Portal</span>
            <p className="text-[10px] text-brand-primary font-semibold tracking-widest uppercase">Field Construction &amp; Updates</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-brand-text">{user?.name || user?.employeeId}</span>
            <span className="text-[10px] text-brand-muted">{user?.designation || 'Field Engineer'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-brand-bg hover:bg-red-950/20 hover:text-red-400 border border-brand-border rounded-xl text-brand-muted transition-all"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-brand-text uppercase tracking-wider mb-1">My Assigned Projects</h2>
            <p className="text-xs text-brand-muted">Update construction progress, upload site photos, set status and expected completion date.</p>
          </div>
          <span className="text-xs px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full font-bold">
            {tasks.length} Project{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-brand-muted gap-3">
            <Clock size={18} className="animate-spin" /> Loading your assigned projects…
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-muted border-2 border-dashed border-brand-border rounded-2xl glass-panel">
            <HardHat size={52} className="mb-4 opacity-30" />
            <p className="text-sm font-bold text-brand-text mb-1">No projects assigned yet</p>
            <p className="text-xs text-brand-muted">A government official will assign you to a construction project.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {tasks.map(item => {
              const curStatus  = item.status as string;
              const curProgress= item.progress ?? 0;
              const statusInfo = statusMeta[curStatus] ?? statusMeta['PENDING'];

              return (
                <div key={item.id} className="glass-panel border border-brand-border rounded-2xl overflow-hidden transition-all hover:border-brand-primary/30">

                  {/* progress stripe at top */}
                  <div
                    className="h-1 bg-gradient-to-r from-brand-primary to-brand-highlight transition-all duration-700"
                    style={{ width: `${curProgress}%` }}
                  />

                  {/* ── Card Header ── */}
                  <div className="p-5 flex flex-col items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[10px] font-mono text-brand-muted px-2 py-1 bg-brand-bg rounded-lg border border-brand-border">
                          #{item.hotspot.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-1 bg-brand-bg border border-brand-border rounded-full text-brand-muted">
                          {curProgress}% complete
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                        <MapPin size={14} className="text-brand-primary shrink-0" />
                        {item.hotspot.locationName}
                      </h3>
                      <p className="text-xs text-brand-muted mt-1 flex items-center gap-1.5">
                        <Wrench size={12} className="text-brand-accent" />
                        AI Fix: <span className="text-brand-text/70 font-medium">{item.hotspot.suggestedFix}</span>
                      </p>
                    </div>

                    {/* Always show edit form directly below engineer name */}
                    <div className="w-full flex flex-col gap-3 p-3 bg-brand-bg border border-brand-border rounded-xl">
                      {/* Status Dropdown */}
                      <select
                        value={taskEdits[item.id]?.status || item.status}
                        onChange={e => setTaskEdits(prev => ({
                          ...prev,
                          [item.id]: { ...(prev[item.id] || item), status: e.target.value as any }
                        }))}
                        className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold focus:border-brand-primary/60 outline-none text-brand-text"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved — Ready for Setup</option>
                        <option value="UNDER_CONSTRUCTION">Under Construction (Active)</option>
                        <option value="COMPLETED">Completed ✓</option>
                      </select>
                      {/* Progress Slider */}
                      <div>
                        <label className="field-label !mb-0">Progress %</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={taskEdits[item.id]?.progress ?? item.progress ?? 0}
                          onChange={e => setTaskEdits(prev => ({
                            ...prev,
                            [item.id]: { ...(prev[item.id] || item), progress: parseInt(e.target.value) }
                          }))}
                          className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-primary"
                        />
                      </div>
                      {/* Notes */}
                      <textarea
                        rows={3}
                        value={taskEdits[item.id]?.notes ?? item.notes ?? ''}
                        onChange={e => setTaskEdits(prev => ({
                          ...prev,
                          [item.id]: { ...(prev[item.id] || item), notes: e.target.value }
                        }))}
                        placeholder="Progress notes..."
                        className="w-full p-2 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text focus:border-brand-primary/60 outline-none resize-none"
                      />
                      {/* Expected Completion Date */}
                      <input
                        type="date"
                        value={taskEdits[item.id]?.targetDate ?? item.targetDate ?? ''}
                        onChange={e => setTaskEdits(prev => ({
                          ...prev,
                          [item.id]: { ...(prev[item.id] || item), targetDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-text focus:border-brand-primary/60 outline-none"
                      />
                      {/* Photo Uploads – three slots */}
                      <div className="grid grid-cols-3 gap-2">
                        {(['before','during','after'] as const).map(key => {
                          const photoUrl = taskEdits[item.id]?.[key === 'before' ? 'beforePhotoUrl' : key === 'during' ? 'constructionPhotoUrl' : 'completionPhotoUrl'] || item[key === 'before' ? 'beforePhotoUrl' : key === 'during' ? 'constructionPhotoUrl' : 'completionPhotoUrl'] || '';
                          const setPhoto = (url: string) => {
                            const field = key === 'before' ? 'beforePhotoUrl' : key === 'during' ? 'constructionPhotoUrl' : 'completionPhotoUrl';
                            setTaskEdits(prev => ({
                              ...prev,
                              [item.id]: { ...(prev[item.id] || item), [field]: url }
                            }));
                          };
                          const inputRef = key === 'before' ? beforeInputRef : key === 'during' ? duringInputRef : afterInputRef;
                          return (
                            <div key={key} className="relative border border-brand-border rounded-lg overflow-hidden p-1">
                              {photoUrl ? (
                                <>
                                  <img src={photoUrl} alt={key} className="w-full h-20 object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setPhoto('')}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded px-1"
                                  >×</button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-brand-muted/50 h-20">
                                  <ImageIcon size={24} />
                                  <span className="text-[10px]">{key} photo</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                ref={inputRef as any}
                                className="hidden"
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const dataUrl = await readFileAsDataURL(file);
                                    setPhoto(dataUrl);
                                  }
                                  e.target.value = '';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => (inputRef.current as any)?.click()}
                                className="mt-1 w-full text-xs bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary hover:text-white rounded"
                              >Upload</button>
                            </div>
                          );
                        })}
                      </div>
                      {/* Save Button */}
                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          disabled={savingTaskIds.includes(item.id)}
                          className="w-full px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold disabled:bg-brand-bg disabled:text-brand-muted"
                        >{savingTaskIds.includes(item.id) ? 'Saving…' : 'Save Changes'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
