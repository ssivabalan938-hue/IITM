import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Shield, AlertTriangle, List, PlusCircle, LogOut, Navigation, AlertCircle } from 'lucide-react';
import { complaintService } from '../../services/api';
import { Complaint } from '../../types';

// Custom SVG icon for complaints
const complaintIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div class="w-7 h-7 bg-brand-highlight border-2 border-brand-bg rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2">
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B0F19" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
             <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
             <line x1="12" y1="9" x2="12" y2="13"/>
             <line x1="12" y1="17" x2="12.01" y2="17"/>
           </svg>
         </div>`
});

// Map click event listener to show precautions
function MapClickEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Map click interaction state
  const [clickedLocation, setClickedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [zonePrecaution, setZonePrecaution] = useState<{status: string; advisory: string} | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('roadwatch_user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchComplaints();
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      const data = await complaintService.getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load citizen complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedLocation({ lat, lng });
    
    // Evaluate standard safety precaution based on location logic (strictly non-AI outputs)
    // E.g. Near town center features, samayapuram tolls, etc.
    let status = "Moderate Speed Zone";
    let advisory = "Normal road condition. Drive within speed limit and remain alert at junctions.";

    if (lat > 10.82 && lat < 10.84 && lng > 78.68 && lng < 78.70) {
      status = "High Congestion Area (Chathiram Bus Stand)";
      advisory = "Caution: Heavy bus and pedestrian traffic. Watch for passengers crossing and slow down to 20 km/h.";
    } else if (lat > 10.78 && lat < 10.80 && lng > 78.70 && lng < 78.72) {
      status = "Junction Heavy Lane (TVS Tollgate)";
      advisory = "Advisory: High junction lane switching. Avoid sudden lane merges and use indicators early.";
    } else if (lat > 10.90 && lng > 78.73) {
      status = "High Speed Corridor (Samayapuram Area)";
      advisory = "Advisory: High speed vehicles. Maintain safe gap distance (3-second rule) and avoid overtaking near turnings.";
    } else if (Math.random() > 0.5) {
      status = "Wet Surface / Low Visibility Advisory";
      advisory = "Caution: Night visibility drops here. Verify streetlights are functional and keep headlights on low beam.";
    }

    setZonePrecaution({ status, advisory });
  };

  const handleLogout = () => {
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_user');
    navigate('/auth');
  };

  // Convert status string to matching Tailwind styling class
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-yellow-500 bg-opacity-10 text-yellow-500 border-yellow-500/20';
      case 'UNDER_REVIEW': return 'bg-blue-500 bg-opacity-10 text-blue-500 border-blue-500/20';
      case 'ANALYZED': return 'bg-indigo-500 bg-opacity-10 text-indigo-500 border-indigo-500/20';
      case 'RESOLVED': return 'bg-emerald-500 bg-opacity-10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500 bg-opacity-10 text-slate-500 border-slate-500/20';
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Top Navigation */}
      <nav className="glass-panel border-b border-brand-border px-6 py-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-primary/10 border border-brand-primary/30 rounded-xl flex items-center justify-center">
            <Shield className="text-brand-primary" size={20} />
          </div>
          <div>
            <span className="font-bold text-lg text-brand-text">RoadWatch Citizen</span>
            <p className="text-[10px] text-brand-muted">Tiruchirappalli Safety Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <span className="text-sm font-semibold text-brand-text block">{user?.fullName}</span>
            <span className="text-[10px] text-brand-primary">Verified Citizen</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-brand-bg hover:bg-red-950/20 hover:text-red-400 border border-brand-border rounded-xl text-brand-muted transition-all"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* Left Side: Short-cuts & Action cards */}
        <div className="space-y-6 flex flex-col justify-start">
          {/* Welcome Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-brand-border">
            <h2 className="text-xl font-bold text-brand-text">Welcome back, {user?.fullName?.split(' ')[0]}!</h2>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Help keep Trichy's roads safe. Use this dashboard to check safety precautions, view active issues, or report road defects directly.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => navigate('/citizen/report')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-brand-primary bg-opacity-10 hover:bg-brand-primary hover:bg-opacity-20 border border-brand-primary border-opacity-20 rounded-xl transition-all"
              >
                <PlusCircle size={24} className="text-brand-primary" />
                <span className="text-xs font-semibold text-brand-text">Report Issue</span>
              </button>
              <button
                onClick={() => navigate('/citizen/tracker')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-brand-accent bg-opacity-10 hover:bg-brand-accent hover:bg-opacity-20 border border-brand-accent border-opacity-20 rounded-xl transition-all"
              >
                <List size={24} className="text-brand-accent" />
                <span className="text-xs font-semibold text-brand-text">Track Issues</span>
              </button>
            </div>
          </div>

          {/* Interactive Precaution Advisory */}
          <div className="glass-panel rounded-2xl p-6 border border-brand-border flex-1 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 text-brand-highlight font-bold text-sm mb-3">
                <AlertTriangle size={18} />
                Safety Precaution Advisory
              </div>
              
              {clickedLocation ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="text-xs font-semibold text-brand-muted">
                    LOCATION: {clickedLocation.lat.toFixed(4)}°N, {clickedLocation.lng.toFixed(4)}°E
                  </div>
                  <div className="p-3 bg-brand-bg rounded-xl border border-brand-border">
                    <span className="text-sm font-bold text-brand-text block mb-1">
                      {zonePrecaution?.status}
                    </span>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      {zonePrecaution?.advisory}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-brand-muted space-y-2">
                  <AlertCircle size={32} className="mx-auto text-brand-border opacity-70" />
                  <p className="text-xs">
                    Click anywhere on the map to query the local safety classification and driver precautions.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-brand-border text-[10px] text-brand-muted leading-tight">
              Note: This panel displays generic driver safety advisories. Detailed AI risk audits and technical reports are restricted to official engineering teams.
            </div>
          </div>
        </div>

        {/* Center/Right Map and Complaints List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Leaflet Map container */}
          <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden h-[400px] relative z-10">
            <div className="absolute top-4 right-4 z-[1000] bg-brand-card bg-opacity-90 border border-brand-border px-3 py-1.5 rounded-lg shadow-glass text-[10px] text-brand-text flex items-center gap-1.5 pointer-events-none">
              <Navigation size={12} className="text-brand-primary animate-pulse" />
              Tiruchirappalli (Trichy) District Active View
            </div>

            <MapContainer
              center={[10.7905, 78.7047]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapClickEvents onMapClick={handleMapClick} />

              {/* Display existing citizen complaints */}
              {complaints.map((c) => (
                <Marker 
                  key={c.id} 
                  position={[c.latitude, c.longitude]} 
                  icon={complaintIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 max-w-[200px]">
                      <span className="text-xs font-bold text-brand-text block border-b border-brand-border pb-1">
                        {c.issueType}
                      </span>
                      <p className="text-[11px] text-brand-muted leading-tight line-clamp-2">
                        {c.description}
                      </p>
                      <div className="flex justify-between items-center pt-1 text-[10px]">
                        <span className="text-brand-muted">{formatDate(c.createdAt)}</span>
                        <span className="font-semibold text-brand-primary">Report Registered</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Quick list of User's complaints */}
          <div className="glass-panel rounded-2xl border border-brand-border p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">My Recent Safety Reports</h3>
                <span className="text-xs text-brand-muted font-medium">{complaints.length} Total Reports</span>
              </div>

              {loading ? (
                <div className="text-center py-6 text-xs text-brand-muted">Loading reports...</div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-6 text-xs text-brand-muted border border-dashed border-brand-border rounded-xl">
                  You haven't filed any safety reports yet. Click "Report Issue" to log a road hazard.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-brand-muted font-semibold">
                        <th className="py-2">Date</th>
                        <th className="py-2">Issue</th>
                        <th className="py-2">Location</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border divide-opacity-30">
                      {complaints.slice(0, 3).map((c) => (
                        <tr key={c.id} className="text-brand-text hover:bg-brand-card hover:bg-opacity-40 transition-colors">
                          <td className="py-2.5 font-medium">{formatDate(c.createdAt)}</td>
                          <td className="py-2.5 font-semibold text-brand-primary">{c.issueType}</td>
                          <td className="py-2.5 text-brand-muted truncate max-w-[150px]">{c.locationName}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getStatusColor(c.status)}`}>
                              {c.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {complaints.length > 3 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => navigate('/citizen/tracker')}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  View all complaints
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
