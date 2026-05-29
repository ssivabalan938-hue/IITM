import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, LogOut, CheckSquare, BrainCircuit, HardHat, BarChart3, AlertTriangle, ShieldAlert, Users } from 'lucide-react';

import ComplaintsTab from './Complaints';
import RiskIntelligenceTab from './RiskIntelligence';
import InterventionTab from './Intervention';
import EngineersTab from './Engineers';

import { complaintService, riskService, interventionService } from '../../services/api';
import { Complaint, Hotspot, ConstructionStatus } from '../../types';

export default function GovernmentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'complaints' | 'risk' | 'construction' | 'engineers'>('complaints');
  const [user, setUser] = useState<any>(null);

  // Data states passed down to keep tabs in sync
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [constructions, setConstructions] = useState<ConstructionStatus[]>([]);
  const [threshold, setThreshold] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('roadwatch_user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'government') {
      navigate('/auth');
      return;
    }
    if (parsed.approvalStatus === 'PENDING') {
      navigate('/government/pending');
      return;
    }
    setUser(parsed);
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch complaints queue and threshold config
      const compRes = await complaintService.getComplaintQueue();
      setComplaints(compRes.complaints);
      setThreshold(compRes.globalThreshold);

      // 2. Fetch AI hotspots
      const spots = await riskService.getHotspots();
      setHotspots(spots);

      // 3. Fetch construction list
      const constList = await interventionService.getConstructionList();
      setConstructions(constList);
    } catch (error) {
      console.error("Failed to load portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_user');
    navigate('/auth');
  };

  // KPI Calculations
  const totalHotspots = hotspots.length;
  const pendingComplaints = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;
  const activeWork = constructions.filter(c => c.status === 'UNDER_CONSTRUCTION').length;
  const completedWork = constructions.filter(c => c.status === 'COMPLETED').length;

  const avgRisk = hotspots.length > 0 
    ? (hotspots.reduce((sum, h) => sum + h.predictedRiskScore, 0) / hotspots.length).toFixed(1) 
    : '0.0';

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col text-brand-text">
      {/* Top Navbar */}
      <nav className="glass-panel border-b border-brand-border px-6 py-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent/10 border border-brand-accent/30 rounded-xl flex items-center justify-center">
            <Landmark className="text-brand-accent" size={22} />
          </div>
          <div>
            <span className="font-extrabold text-xl text-brand-text tracking-wide">RoadWatch Admin</span>
            <p className="text-[10px] text-brand-accent font-semibold tracking-wider uppercase">Municipal Safety & Engineering Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <span className="text-sm font-bold text-brand-text block">{user?.designation}</span>
            <span className="text-[10px] text-brand-muted">{user?.department}</span>
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

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 pt-6">
        <div className="glass-panel rounded-2xl p-5 border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block">Total Safety Hotspots</span>
            <span className="text-2xl font-black text-brand-text mt-1 block">{totalHotspots}</span>
          </div>
          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl">
            <ShieldAlert className="text-red-400" size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block">Complaints Queue</span>
            <span className="text-2xl font-black text-brand-text mt-1 block">{pendingComplaints}</span>
          </div>
          <div className="p-3 bg-yellow-950/30 border border-brand-highlight/20 rounded-xl">
            <AlertTriangle className="text-brand-highlight" size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block">Active Road Work</span>
            <span className="text-2xl font-black text-brand-text mt-1 block">{activeWork} <span className="text-xs text-brand-muted font-normal">/ {completedWork} done</span></span>
          </div>
          <div className="p-3 bg-emerald-950/30 border border-brand-secondary/20 rounded-xl">
            <HardHat className="text-brand-secondary" size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider block">District Avg Risk Score</span>
            <span className="text-2xl font-black text-brand-primary mt-1 block">{avgRisk} <span className="text-xs text-brand-muted font-normal">/ 100</span></span>
          </div>
          <div className="p-3 bg-blue-950/30 border border-brand-primary/20 rounded-xl">
            <BarChart3 className="text-brand-primary" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="px-6 pt-6">
        <div className="flex border-b border-brand-border gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all tab-transition ${
              activeTab === 'complaints'
                ? 'border-brand-primary text-brand-primary bg-brand-primary bg-opacity-5'
                : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-card hover:bg-opacity-20'
            }`}
          >
            <CheckSquare size={16} />
            Citizen Complaints
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all tab-transition ${
              activeTab === 'risk'
                ? 'border-brand-accent text-brand-accent bg-brand-accent bg-opacity-5'
                : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-card hover:bg-opacity-20'
            }`}
          >
            <BrainCircuit size={16} />
            AI Risk Prediction
          </button>
          <button
            onClick={() => setActiveTab('construction')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all tab-transition ${
              activeTab === 'construction'
                ? 'border-brand-secondary text-brand-secondary bg-brand-secondary bg-opacity-5'
                : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-card hover:bg-opacity-20'
            }`}
          >
            <HardHat size={16} />
            Construction Status
          </button>
          <button
            onClick={() => setActiveTab('engineers')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all tab-transition ${
              activeTab === 'engineers'
                ? 'border-brand-primary text-brand-primary bg-brand-primary bg-opacity-5'
                : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-brand-card hover:bg-opacity-20'
            }`}
          >
            <Users size={16} />
            Engineers
          </button>
        </div>
      </div>

      {/* Main Tab Render Container */}
      <div className="flex-1 p-6 min-h-0">
        {loading ? (
          <div className="h-96 flex items-center justify-center text-sm text-brand-muted">
            Fetching safety logs and initializing GIS layers...
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'complaints' && (
              <ComplaintsTab 
                complaints={complaints} 
                globalThreshold={threshold} 
                onRefresh={loadAllData} 
              />
            )}
            {activeTab === 'risk' && (
              <RiskIntelligenceTab 
                hotspots={hotspots} 
              />
            )}
            {activeTab === 'construction' && (
              <InterventionTab 
                constructions={constructions} 
              />
            )}
            {activeTab === 'engineers' && (
              <EngineersTab />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
