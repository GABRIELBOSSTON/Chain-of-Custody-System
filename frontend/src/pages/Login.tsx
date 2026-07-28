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

          <h1 className="auth-title">Chain of Custody</h1>
          <p className="auth-subtitle">
            {step === 1
              ? 'Sign in to your secure account'
              : 'Enter your authentication code'
            }
          </p>

          {/* Step Indicator */}
          <div className="steps-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`} />
            <div className={`step-line ${step > 1 ? 'completed' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
          </div>
          
          {error && <div className="error-message">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleLogin} className="animate-fade-in">
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@department.gov"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" className="btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="animate-fade-in">
              <div className="form-group">
                <label className="input-label">6-Digit Google Authenticator Code</label>
                <input
                  type="text"
                  className="input-field"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  required
                  minLength={6}
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
                />
              </div>
              <button type="submit" className="btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify MFA'}
              </button>
            </form>
          )}
          
          {step === 1 && (
            <p className="text-center mt-4 text-sm text-secondary">
              Unactivated Account?{' '}
              <Link to="/activation" className="auth-link">Activate Here</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
