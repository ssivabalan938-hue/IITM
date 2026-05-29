import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, Landmark, Users, CheckCircle, Info } from 'lucide-react';

import { authService } from '../services/api';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'citizen' | 'government'>('citizen');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        if (userType === 'citizen') {
          const res = await authService.citizenLogin({ email, password });
          localStorage.setItem('roadwatch_token', res.token);
          localStorage.setItem('roadwatch_user', JSON.stringify(res.user));
          navigate('/citizen');
        } else {
          const res = await authService.governmentLogin({ officialEmail: email, password });
          localStorage.setItem('roadwatch_token', res.token);
          localStorage.setItem('roadwatch_user', JSON.stringify(res.user));
          
          if (res.user.approvalStatus === 'PENDING') {
            navigate('/government/pending');
          } else if (res.user.govRole === 'ENGINEER') {
            navigate('/engineer/dashboard');
          } else {
            navigate('/government');
          }
        }
      } else {
        // Registering
        if (userType === 'citizen') {
          if (aadharNo.length !== 12 || isNaN(Number(aadharNo))) {
            throw new Error("Aadhar Number must be exactly 12 numeric digits.");
          }
          const res = await authService.citizenRegister({
            fullName, aadharNo, mobile, email, dob, address, password
          });
          localStorage.setItem('roadwatch_token', res.token);
          localStorage.setItem('roadwatch_user', JSON.stringify(res.user));
          setSuccess("Citizen account created! Redirecting...");
          setTimeout(() => navigate('/citizen'), 1500);
        } else {
          // Government Official Register
          const res = await authService.governmentRegister({
            employeeId, department, officialEmail: email, designation, password
          });
          localStorage.setItem('roadwatch_token', res.token);
          localStorage.setItem('roadwatch_user', JSON.stringify(res.user));
          setSuccess("Registration submitted! Awaiting admin approval. Redirecting...");
          setTimeout(() => navigate('/government/pending'), 2000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary opacity-10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brand-accent opacity-10 rounded-full blur-[100px]" />

      <div className="max-w-md w-full space-y-8 glass-panel rounded-2xl p-8 border border-brand-border shadow-glass relative z-10">
        <div>
          <div className="flex justify-center">
            <div className="p-3 bg-brand-primary bg-opacity-20 rounded-2xl border border-brand-primary border-opacity-30">
              <Shield className="h-10 w-10 text-brand-primary animate-pulse" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-text tracking-tight">
            RoadWatch AI
          </h2>
          <p className="mt-2 text-center text-sm text-brand-muted">
            Predictive Road Safety & Interventions
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-brand-bg rounded-xl border border-brand-border">
          <button
            onClick={() => { setUserType('citizen'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              userType === 'citizen'
                ? 'bg-brand-primary text-white shadow-premium'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <Users size={14} />
            Citizen
          </button>
          <button
            onClick={() => { setUserType('government'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              userType === 'government'
                ? 'bg-brand-accent text-white shadow-premium'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <Landmark size={14} />
            Government Official
          </button>
        </div>

        {/* Form Selection Indicator */}
        <div className="text-center">
          <span className="text-sm text-brand-muted">
            {isLogin ? "Log in to your account" : "Create a new portal access account"}
          </span>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3.5 bg-red-900 bg-opacity-20 border border-red-500 border-opacity-30 rounded-xl text-red-400 text-xs flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-brand-secondary bg-opacity-20 border border-brand-secondary border-opacity-30 rounded-xl text-brand-secondary text-xs flex items-start gap-2">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Registration Fields */}
          {!isLogin && (
            <>
              {/* Citizen registration extra fields */}
              {userType === 'citizen' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-brand-muted mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Siva Balan"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-muted mb-1">Aadhar Number (12 digit)</label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={aadharNo}
                      onChange={(e) => setAadharNo(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456789012"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-muted mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-muted mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-brand-muted mb-1">Address</label>
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="12 Main St, Cantonment, Tiruchirappalli"
                      rows={2}
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                    />
                  </div>
                </div>
              ) : (
                // Government official registration fields
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-brand-muted mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="GOV-TRICHY-022"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-muted mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Highways Department"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-brand-muted mb-1">Designation / Role</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Divisional Engineer (Road Safety)"
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent text-sm"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Common Login / Register credentials */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">
                {userType === 'citizen' ? 'Email Address' : 'Official Government Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={16} className="text-brand-muted" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userType === 'citizen' ? 'citizen@gmail.com' : 'engineer@trichy.gov.in'}
                  className="w-full pl-10 pr-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key size={16} className="text-brand-muted" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white shadow-premium focus:outline-none transition-all flex justify-center items-center gap-2 ${
                userType === 'citizen'
                  ? 'bg-brand-primary hover:bg-blue-600 disabled:bg-blue-800'
                  : 'bg-brand-accent hover:bg-violet-600 disabled:bg-violet-800'
              }`}
            >
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </div>
        </form>

        <div className="text-center text-xs mt-6">
          <span className="text-brand-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className={`font-semibold underline ${
              userType === 'citizen' ? 'text-brand-primary' : 'text-brand-accent'
            }`}
          >
            {isLogin ? "Register now" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
