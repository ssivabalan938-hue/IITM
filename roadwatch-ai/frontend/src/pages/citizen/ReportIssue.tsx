import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, AlertTriangle, Upload, Info, CheckCircle } from 'lucide-react';
import { complaintService } from '../../services/api';

const pickerIcon = new L.DivIcon({
  className: 'picker-icon',
  html: `<div class="w-8 h-8 bg-brand-primary border-2 border-brand-bg rounded-full flex items-center justify-center shadow-lg animate-bounce transform -translate-x-1/2 -translate-y-1/2">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
             <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
             <circle cx="12" cy="10" r="3"/>
           </svg>
         </div>`
});

function MapPickerEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ReportIssue() {
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState('Pothole');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [thresholdAlert, setThresholdAlert] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('roadwatch_token');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);

  const handleMapPick = (latitude: number, longitude: number) => {
    setLat(latitude);
    setLng(longitude);
    // Set auto location name placeholder
    if (!locationName) {
      setLocationName(`Road near Trichy Area (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setThresholdAlert(null);

    if (lat === null || lng === null) {
      setError("Please click on the map to pinpoint the exact issue location.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('issueType', issueType);
      formData.append('locationName', locationName);
      formData.append('latitude', lat.toString());
      formData.append('longitude', lng.toString());
      formData.append('description', description);
      if (image) {
        formData.append('image', image);
      }

      const res = await complaintService.submitComplaint(formData);
      setSuccess("Complaint submitted successfully! Your tracking ID is registered.");
      
      if (res.thresholdMet) {
        setThresholdAlert({
          count: res.currentThresholdCount,
          required: res.requiredThreshold
        });
      }

      // Reset form
      setDescription('');
      setLocationName('');
      setLat(null);
      setLng(null);
      setImage(null);
      setImagePreview(null);
      
      setTimeout(() => {
        navigate('/citizen');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please check input parameters.');
    } finally {
      setLoading(false);
    }
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
          <span className="font-bold text-lg text-brand-text">Report Safety Issue</span>
          <p className="text-[10px] text-brand-muted">Submit infrastructure damage or traffic hazards</p>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Form panel */}
        <div className="glass-panel rounded-2xl p-6 border border-brand-border h-fit">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm mb-6 uppercase tracking-wider">
            <AlertTriangle size={18} />
            Road Hazard Particulars
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-900 bg-opacity-20 border border-red-500 border-opacity-30 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-emerald-950 bg-opacity-30 border border-brand-secondary border-opacity-30 rounded-xl text-brand-secondary text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle size={16} />
                  {success}
                </div>
                {thresholdAlert && (
                  <p className="text-[11px] text-brand-muted">
                    Proximity Warning: Location complaint threshold reached ({thresholdAlert.count}/{thresholdAlert.required}). This area has been queued for official risk analysis.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1.5">Issue Classification</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-text text-sm focus:outline-none focus:border-brand-primary"
              >
                <option value="Pothole">Pothole / Road Surface Cracking</option>
                <option value="Streetlight Failure">Streetlight Outage / Dark Zones</option>
                <option value="Lack of Signage">Missing Warning Signs / Markings</option>
                <option value="Poor Junction Design">Poor Turning Geometry / Conflict Zone</option>
                <option value="Damaged Road">Slippery Surface / Waterlogging / Drainage Leak</option>
                <option value="High-speed Zone">Lack of Speed Calmers near Schools/Hospitals</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1.5">Location Landmark/Address</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Near Toll Plaza, Samayapuram, Trichy"
                className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-text text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">Latitude</label>
                <input
                  type="text"
                  readOnly
                  required
                  value={lat !== null ? lat.toFixed(6) : ''}
                  placeholder="Click Map"
                  className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-muted text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-muted mb-1.5">Longitude</label>
                <input
                  type="text"
                  readOnly
                  required
                  value={lng !== null ? lng.toFixed(6) : ''}
                  placeholder="Click Map"
                  className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-muted text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1.5">Description & Observations</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the severity. E.g. Deep crater in middle lane causing motorists to swerve suddenly at night."
                className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-brand-text text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Road Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-brand-muted mb-1.5">Attach Hazard Image</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-4 bg-brand-bg border border-dashed border-brand-border hover:border-brand-primary rounded-xl cursor-pointer transition-all">
                  <Upload className="text-brand-muted mb-2" size={20} />
                  <span className="text-xs text-brand-muted">Upload photo (.jpg, .png)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                
                {imagePreview && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-brand-border relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-primary hover:bg-blue-600 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-premium transition-all"
            >
              {loading ? 'Registering Safety Hazard...' : 'Submit Safety Report'}
            </button>
          </form>
        </div>

        {/* Map Picker panel */}
        <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden h-[500px] lg:h-auto relative">
          <div className="absolute top-4 left-4 z-[1000] bg-brand-card bg-opacity-95 border border-brand-border px-3 py-2 rounded-xl text-xs text-brand-text flex items-start gap-2 max-w-[320px] pointer-events-none shadow-glass">
            <Info size={16} className="text-brand-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Locate Hazard:</span> Click anywhere on the open map of Trichy to auto-capture latitude and longitude coordinate variables.
            </div>
          </div>

          <MapContainer
            center={[10.7905, 78.7047]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapPickerEvents onPick={handleMapPick} />
            
            {lat !== null && lng !== null && (
              <Marker position={[lat, lng]} icon={pickerIcon} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
