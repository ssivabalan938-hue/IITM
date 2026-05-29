import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, Sliders, Play, Eye, ChevronRight, X } from 'lucide-react';
import { complaintService } from '../../services/api';
import { Complaint } from '../../types';

// Custom icons for complaints on Admin Map
const complaintYellowIcon = new L.DivIcon({
  className: 'custom-icon-yellow',
  html: `<div class="w-6 h-6 bg-brand-highlight border border-brand-bg rounded-full flex items-center justify-center shadow-lg">
           <div class="w-2.5 h-2.5 bg-brand-bg rounded-full animate-ping"></div>
         </div>`
});

const complaintRedIcon = new L.DivIcon({
  className: 'custom-icon-red',
  html: `<div class="w-6 h-6 bg-red-500 border border-brand-bg rounded-full flex items-center justify-center shadow-lg">
           <div class="w-2.5 h-2.5 bg-brand-bg rounded-full animate-pulse"></div>
         </div>`
});

interface ComplaintsTabProps {
  complaints: Complaint[];
  globalThreshold: number;
  onRefresh: () => void;
}

export default function ComplaintsTab({ complaints, globalThreshold, onRefresh }: ComplaintsTabProps) {
  const [thresholdInput, setThresholdInput] = useState(globalThreshold);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  // AI Inputs Form
  const [historicalAccidents, setHistoricalAccidents] = useState('15');
  const [roadClass, setRoadClass] = useState('National Highway (NH-45B)');
  const [junctionType, setJunctionType] = useState('4-Way Junction');
  const [pcuPerHour, setPcuPerHour] = useState('2800');
  const [envLighting, setEnvLighting] = useState('Poor');
  const [roadSurface, setRoadSurface] = useState('Potholes');
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingThreshold(true);
    try {
      await complaintService.updateThreshold(Number(thresholdInput));
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    setRunningAnalysis(true);
    try {
      await complaintService.analyzeComplaint(selectedComplaint.id, {
        historicalAccidents: Number(historicalAccidents),
        roadClass,
        junctionType,
        pcuPerHour: Number(pcuPerHour),
        envLighting,
        roadSurface
      });
      setShowAnalyzeModal(false);
      setSelectedComplaint(null);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to execute AI predictor.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
      
      {/* Column 1: Complaint Queue and Threshold config */}
      <div className="space-y-6 flex flex-col justify-start">
        {/* Threshold Configurator */}
        <div className="glass-panel rounded-2xl p-5 border border-brand-border">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-wider mb-4">
            <Sliders size={16} />
            Complaint Proximity Threshold
          </div>
          <form onSubmit={handleUpdateThreshold} className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                min={1}
                max={50}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text text-xs focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={updatingThreshold}
              className="py-2 px-4 bg-brand-primary hover:bg-blue-600 disabled:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-premium transition-all"
            >
              {updatingThreshold ? 'Saving...' : 'Set Threshold'}
            </button>
          </form>
          <span className="text-[10px] text-brand-muted mt-2 block leading-relaxed">
            Locations registering ≥ {globalThreshold} complaints will trigger alert flags to dispatch inspectors and run AI risk simulations.
          </span>
        </div>

        {/* Complaint Queue Board */}
        <div className="glass-panel rounded-2xl p-5 border border-brand-border flex-1 flex flex-col overflow-hidden max-h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-brand-text uppercase tracking-wider block">Complaint Queue</span>
            <span className="px-2 py-0.5 bg-brand-border rounded-full text-[10px] text-brand-muted font-bold">
              {complaints.filter(c => c.status !== 'ANALYZED').length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {complaints.filter(c => c.status !== 'ANALYZED').length === 0 ? (
              <div className="text-center py-12 text-xs text-brand-muted">
                No pending citizen reports in queue.
              </div>
            ) : (
              complaints.filter(c => c.status !== 'ANALYZED').map((c) => {
                const meetsThreshold = c.thresholdCount >= globalThreshold;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      selectedComplaint?.id === c.id
                        ? 'bg-brand-card border-brand-accent shadow-premium'
                        : 'bg-brand-bg border-brand-border hover:bg-brand-card hover:bg-opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-brand-text truncate max-w-[150px]">{c.issueType}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        meetsThreshold 
                          ? 'bg-red-500 bg-opacity-10 text-red-400 border-red-500/20' 
                          : 'bg-brand-highlight bg-opacity-10 text-brand-highlight border-brand-highlight/20'
                      }`}>
                        {c.thresholdCount} Reports
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-muted line-clamp-1">{c.locationName}</p>
                    
                    {meetsThreshold && (
                      <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-brand-border border-dashed text-[10px]">
                        <span className="text-red-400 font-medium flex items-center gap-1">
                          <AlertCircle size={10} /> Threshold Reached
                        </span>
                        <span className="text-brand-accent font-bold hover:underline flex items-center gap-0.5">
                          Run Predictor <ChevronRight size={10} />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Column 2 & 3: Map Overlay & Complaint Details */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-[500px]">
        {/* Leaflet Map Overlay */}
        <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden h-[320px] relative z-10">
          <MapContainer
            center={[10.7905, 78.7047]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {complaints.filter(c => c.status !== 'ANALYZED').map((c) => (
              <Marker
                key={c.id}
                position={[c.latitude, c.longitude]}
                icon={c.thresholdCount >= globalThreshold ? complaintRedIcon : complaintYellowIcon}
              >
                <Popup>
                  <div className="p-1 space-y-1 max-w-[180px]">
                    <span className="text-xs font-bold text-brand-text block">{c.issueType}</span>
                    <p className="text-[10px] text-brand-muted leading-tight">{c.locationName}</p>
                    <div className="text-[9px] text-brand-highlight font-semibold pt-1">
                      {c.thresholdCount} Citizen complaints filed
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Selected Complaint Detailed Card Panel */}
        <div className="glass-panel rounded-2xl border border-brand-border p-6 flex-1 flex flex-col justify-between">
          {selectedComplaint ? (
            <div className="flex flex-col md:flex-row gap-6 items-stretch justify-between h-full">
              <div className="flex-1 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Report Particulars</span>
                  <span className="text-[10px] text-brand-primary">{formatDate(selectedComplaint.createdAt)}</span>
                </div>
                
                <h3 className="text-base font-bold text-brand-text">{selectedComplaint.issueType}</h3>
                
                <div>
                  <span className="text-[10px] text-brand-muted font-bold block uppercase mb-0.5">Location Landmark</span>
                  <p className="text-brand-text leading-snug">{selectedComplaint.locationName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-brand-muted font-bold block uppercase mb-0.5">Latitude</span>
                    <span className="text-brand-text font-mono">{selectedComplaint.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-muted font-bold block uppercase mb-0.5">Longitude</span>
                    <span className="text-brand-text font-mono">{selectedComplaint.longitude.toFixed(6)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-brand-muted font-bold block uppercase mb-0.5">Reported By</span>
                  <span className="text-brand-text">{selectedComplaint.citizen?.fullName} ({selectedComplaint.citizen?.email})</span>
                </div>

                <div>
                  <span className="text-[10px] text-brand-muted font-bold block uppercase mb-0.5">Citizen Description</span>
                  <p className="text-brand-muted leading-relaxed bg-brand-bg p-3 rounded-xl border border-brand-border">
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.thresholdCount >= globalThreshold && (
                  <button
                    onClick={() => setShowAnalyzeModal(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-accent hover:bg-violet-600 text-white rounded-xl text-xs font-bold shadow-premium transition-all"
                  >
                    <Play size={14} />
                    Run AI Predictor & Add to Hotspots
                  </button>
                )}
              </div>

              {/* Photo Evidence on right side */}
              <div className="w-full md:w-56 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-brand-border pt-4 md:pt-0 md:pl-6">
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider mb-2 block">Photo Evidence</span>
                {selectedComplaint.imageUrl ? (
                  <div className="h-44 w-full rounded-xl border border-brand-border overflow-hidden bg-brand-bg relative">
                    <img 
                      src={`http://localhost:5000${selectedComplaint.imageUrl}`} 
                      alt="Hazard evidence" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full rounded-xl border border-dashed border-brand-border bg-brand-bg flex items-center justify-center text-center p-4 text-xs text-brand-muted">
                    No image uploaded by citizen.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <Eye size={36} className="text-brand-border opacity-70 mb-2" />
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Select report for Details</span>
              <p className="text-[11px] text-brand-muted mt-1 max-w-sm">
                Pick a citizen safety complaint from the queue panel on the left to review photos, coords, and trigger the AI prediction model.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Risk Predictor Execution Modal */}
      {showAnalyzeModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-brand-border overflow-hidden relative shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-brand-accent uppercase tracking-wider">
                <Sliders size={16} />
                Specify Road Audit Parameters
              </div>
              <button 
                onClick={() => setShowAnalyzeModal(false)}
                className="p-1 hover:bg-brand-border rounded-lg text-brand-muted hover:text-brand-text transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-brand-muted leading-relaxed">
              Verify road parameters for <span className="text-brand-text font-bold">{selectedComplaint.locationName}</span>. These inputs will feed the rule-based risk classification model to output risk indices and engineering measures.
            </p>

            <form onSubmit={handleRunAnalysis} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-brand-muted font-semibold mb-1">Historical Accidents (Annual)</label>
                <input
                  type="number"
                  required
                  value={historicalAccidents}
                  onChange={(e) => setHistoricalAccidents(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-brand-muted font-semibold mb-1">Passenger Car Units (PCU/hr)</label>
                <input
                  type="number"
                  required
                  value={pcuPerHour}
                  onChange={(e) => setPcuPerHour(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="block text-brand-muted font-semibold mb-1">Road Classification</label>
                <select
                  value={roadClass}
                  onChange={(e) => setRoadClass(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="National Highway (NH-45B)">National Highway (NH-45B)</option>
                  <option value="National Highway (NH-67)">National Highway (NH-67)</option>
                  <option value="State Highway (SH-9)">State Highway (SH-9)</option>
                  <option value="State Highway (SH-25)">State Highway (SH-25)</option>
                  <option value="Major District Road (MDR)">Major District Road (MDR)</option>
                  <option value="Rural Road">Rural Road</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-muted font-semibold mb-1">Junction Geometry</label>
                <select
                  value={junctionType}
                  onChange={(e) => setJunctionType(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="4-Way Junction">4-Way Junction</option>
                  <option value="T-Junction">T-Junction</option>
                  <option value="Y-Junction">Y-Junction</option>
                  <option value="Roundabout">Roundabout</option>
                  <option value="Straight Road">Straight Road</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-muted font-semibold mb-1">Environmental Lighting</label>
                <select
                  value={envLighting}
                  onChange={(e) => setEnvLighting(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="Good">Good Lighting (Functional Streetlights)</option>
                  <option value="Poor">Poor Lighting (Dim / Low Wattage)</option>
                  <option value="No Lighting">No Lighting (Dark Zones)</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-muted font-semibold mb-1">Road Surface Quality</label>
                <select
                  value={roadSurface}
                  onChange={(e) => setRoadSurface(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="Smooth">Smooth Bituminous</option>
                  <option value="Potholes">Potholes & Raveling</option>
                  <option value="Wet/Slippery">Wet / Poor Skid Resistance</option>
                  <option value="Gravel">Gravel / Under Repair</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={runningAnalysis}
                  className="w-full py-2.5 px-4 bg-brand-accent hover:bg-violet-600 disabled:bg-violet-800 text-white rounded-lg font-bold shadow-premium transition-all flex items-center justify-center gap-2"
                >
                  {runningAnalysis ? 'Executing Severity Engine...' : 'Run Predictor & Generate Interventions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
