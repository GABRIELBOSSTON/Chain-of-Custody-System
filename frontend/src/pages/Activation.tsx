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

  return (
    <div className="centered-page">
      <div className="auth-container glass-panel">
        <h1 className="auth-title">Account Activation</h1>
        <p className="auth-subtitle">Verify your identity to activate your account.</p>
        
        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="input-label">Registered Email</label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="input-label">Police Badge Number</label>
              <input type="text" className="input-field" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Request OTP'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p style={{marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem'}}>An OTP has been sent to your contact. Please enter it below.</p>
            <div className="form-group">
              <label className="input-label">6-Digit OTP</label>
              <input type="text" className="input-field" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required minLength={6} maxLength={6} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSetupAccount}>
            <p style={{marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem'}}>Setup a strong password to secure your account.</p>
            <div className="form-group">
              <label className="input-label">New Password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Complete Setup'}</button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--success-color)'}}>Activation successful! Scan this QR code with Google Authenticator.</p>
            {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Code" style={{ margin: '1rem auto', display: 'block', borderRadius: '8px', background: 'white', padding: '0.5rem' }} />}
            <button onClick={() => navigate('/login')} className="btn-primary" style={{marginTop: '1rem'}}>Proceed to Login</button>
          </div>
        )}

        {step < 4 && (
          <p className="text-center mt-4 text-sm text-secondary">
            Already activated? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
}
