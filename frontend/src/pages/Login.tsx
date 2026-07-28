import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [step, setStep] = useState(1);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.mfaRequired) {
        setTempToken(response.data.tempToken);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await api.post('/auth/login/mfa', { tempToken, mfaCode });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid MFA code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-container glass-panel">
        <h1 className="auth-title">Chain of Custody</h1>
        <p className="auth-subtitle">Welcome back! Please login to your account.</p>
        
        {error && <div className="error-message">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            
            <div className="form-group">
              <label className="input-label">Password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Sign In'}</button>
          </form>
        ) : (
          <form onSubmit={handleMfa}>
            <div className="form-group">
              <label className="input-label">6-Digit Google Authenticator Code</label>
              <input type="text" className="input-field" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} required minLength={6} maxLength={6} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify MFA'}</button>
          </form>
        )}
        
        {step === 1 && (
          <p className="text-center mt-4 text-sm text-secondary">
            Unactivated Account? <Link to="/activation" className="auth-link">Activate Here</Link>
          </p>
        )}
      </div>
    </div>
  );
}
