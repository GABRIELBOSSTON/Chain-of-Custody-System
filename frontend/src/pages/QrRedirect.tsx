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
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '460px', margin: 'var(--space-3xl) auto', textAlign: 'center' }}>
      <div className="glass-panel">
        <h2 className="page-title" style={{ marginBottom: 'var(--space-lg)' }}>Processing QR Code</h2>
        {error ? (
          <>
            <div className="error-message">{error}</div>
            <button onClick={() => navigate('/dashboard')} className="btn-primary btn-full mt-4">
              Back to Dashboard
            </button>
          </>
        ) : (
          <div className="loading-state" style={{ padding: 'var(--space-lg)' }}>
            <div className="spinner" />
            <p className="text-secondary">Decrypting secure payload, please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
}
