import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('/auth/register', { email, password });
      // Successfully registered, redirect to login
      navigate('/login');
    } catch (err: any) {
      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        setError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-container glass-panel">
        <h1 className="auth-title">Register Account</h1>
        <p className="auth-subtitle">Create a new secure access credential.</p>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="new.officer@police.gov"
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
              placeholder="Min 8 characters"
              minLength={8}
              required 
            />
          </div>

          <button type="submit" className="btn-primary">Register</button>
        </form>
        
        <p className="text-center mt-4 text-sm text-secondary">
          Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
