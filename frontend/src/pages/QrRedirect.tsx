import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function QrRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const payload = searchParams.get('payload');
    if (!payload) {
      setError('Invalid QR code. No payload found.');
      return;
    }

    const decryptAndNavigate = async () => {
      try {
        const res = await api.post('/evidences/decrypt-qr', { payload });
        if (res.data && res.data.route) {
          navigate(res.data.route, { replace: true });
        } else {
          setError('Failed to decrypt QR code.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or malformed QR code.');
      }
    };

    decryptAndNavigate();
  }, [searchParams, navigate]);

  return (
    <div className="centered-page">
      <div className="auth-container glass-panel" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Processing QR Code...</h2>
        {error ? (
          <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Decrypting secure payload, please wait...</p>
        )}
        {error && (
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ marginTop: '2rem' }}>
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
