import React, { useState, useEffect } from 'react';
import { Users, UserPlus, HardHat, Shield, Phone, Mail, CheckCircle } from 'lucide-react';
import { engineerService } from '../../services/api';

export default function EngineersTab() {
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Highway Construction');
  const [designation, setDesignation] = useState('Field Engineer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      const data = await engineerService.getEngineers();
      setEngineers(data);
    } catch (error) {
      console.error('Failed to load engineers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await engineerService.createEngineer({
        name,
        employeeId,
        officialEmail: email,
        phoneNumber: phone,
        department,
        designation
      });
      setShowAddModal(false);
      // Reset form
      setName('');
      setEmployeeId('');
      setEmail('');
      setPhone('');
      fetchEngineers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add engineer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 min-h-[500px]">
      <div className="flex justify-between items-center bg-brand-card p-5 rounded-2xl border border-brand-border">
        <div>
          <h2 className="text-lg font-black text-brand-text flex items-center gap-2 uppercase tracking-wide">
            <Users size={20} className="text-brand-primary" />
            Engineering Resources
          </h2>
          <p className="text-xs text-brand-muted mt-1">Manage construction engineers and field officers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-premium"
        >
          <UserPlus size={16} />
          Add Engineer
        </button>
      </div>

      <div className="flex-1 glass-panel rounded-2xl border border-brand-border overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-brand-muted">
            Loading engineer directory...
          </div>
        ) : engineers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-brand-bg rounded-full border border-brand-border flex items-center justify-center mb-4">
              <HardHat size={24} className="text-brand-muted" />
            </div>
            <span className="text-sm font-bold text-brand-text">No Engineers Found</span>
            <p className="text-xs text-brand-muted mt-2 max-w-sm">
              Add engineering resources to the system. These engineers can be assigned to construction interventions by the admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 overflow-y-auto">
            {engineers.map((eng) => (
              <div key={eng.id} className="bg-brand-bg border border-brand-border rounded-xl p-5 hover:border-brand-primary/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <HardHat size={18} className="text-brand-primary" />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle size={10} /> Active
                  </span>
                </div>
                <h3 className="text-sm font-bold text-brand-text mb-1">{eng.name || eng.employeeId}</h3>
                <span className="text-[11px] text-brand-primary font-semibold uppercase tracking-wider block mb-4">{eng.designation}</span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-brand-muted">
                    <Shield size={14} />
                    <span className="font-mono text-[10px]">{eng.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-muted">
                    <Mail size={14} />
                    <span className="truncate">{eng.officialEmail}</span>
                  </div>
                  {eng.phoneNumber && (
                    <div className="flex items-center gap-2 text-brand-muted">
                      <Phone size={14} />
                      <span>{eng.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-brand-border overflow-hidden shadow-premium">
            <div className="p-5 border-b border-brand-border">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">Register New Engineer</h3>
            </div>
            
            <form onSubmit={handleAddEngineer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-brand-muted font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-brand-muted font-semibold mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
                  placeholder="e.g. ENG-001"
                />
              </div>
              <div>
                <label className="block text-brand-muted font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
                  placeholder="john.doe@roadwatch.ai"
                />
              </div>
              <div>
                <label className="block text-brand-muted font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-brand-bg hover:bg-brand-card text-brand-muted rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-600 disabled:bg-blue-800 text-white rounded-lg font-bold transition-all"
                >
                  {isSubmitting ? 'Adding...' : 'Add Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
