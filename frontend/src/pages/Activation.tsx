import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Activation() {
  const [step, setStep] = useState(1);
  
  // Step 1
  const [email, setEmail] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  
  // Step 2
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  // Step 3
  const [password, setPassword] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/activation/request', { email, badgeNumber });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request activation');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/activation/verify', { email, otpCode });
      setTempToken(res.data.tempToken);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/activation/setup', { tempToken, password });
      setQrCodeUrl(res.data.qrCodeUrl);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [1, 2, 3, 4];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="glass-panel animate-scale-in">
          {/* Brand */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          <h1 className="auth-title">Account Activation</h1>
          <p className="auth-subtitle">Verify your identity to activate your account</p>

          {/* Step Progress */}
          <div className="steps-indicator">
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div className={`step-dot ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`} />
                {i < steps.length - 1 && <div className={`step-line ${step > s ? 'completed' : ''}`} />}
              </div>
            ))}
          </div>
          
          {error && <div className="error-message">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="animate-fade-in">
              <div className="form-group">
                <label className="input-label">Registered Email</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@department.gov" required />
              </div>
              <div className="form-group">
                <label className="input-label">Police Badge Number</label>
                <input type="text" className="input-field" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder="Enter your badge number" required />
              </div>
              <button type="submit" className="btn-primary btn-full btn-lg" disabled={loading}>{loading ? 'Verifying...' : 'Request OTP'}</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="animate-fade-in">
              <p className="text-center text-sm text-secondary mb-3">An OTP has been sent to your contact. Please enter it below.</p>
              <div className="form-group">
                <label className="input-label">6-Digit OTP</label>
                <input
                  type="text"
                  className="input-field"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  required
                  minLength={6}
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
                />
              </div>
              <button type="submit" className="btn-primary btn-full btn-lg" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSetupAccount} className="animate-fade-in">
              <p className="text-center text-sm text-secondary mb-3">Set up a strong password to secure your account.</p>
              <div className="form-group">
                <label className="input-label">New Password</label>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required minLength={8} />
              </div>
              <button type="submit" className="btn-primary btn-full btn-lg" disabled={loading}>{loading ? 'Saving...' : 'Complete Setup'}</button>
            </form>
          )}

          {step === 4 && (
            <div className="animate-fade-in" style={{ textAlign: 'center' }}>
              <div className="success-message">Activation successful! Scan this QR code with Google Authenticator.</div>
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="MFA QR Code"
                  style={{
                    margin: 'var(--space-lg) auto',
                    display: 'block',
                    borderRadius: 'var(--radius-md)',
                    background: 'white',
                    padding: 'var(--space-sm)',
                    maxWidth: '200px'
                  }}
                />
              )}
              <button onClick={() => navigate('/login')} className="btn-primary btn-full btn-lg mt-2">
                Proceed to Login
              </button>
            </div>
          )}

          {step < 4 && (
            <p className="text-center mt-4 text-sm text-secondary">
              Already activated? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
