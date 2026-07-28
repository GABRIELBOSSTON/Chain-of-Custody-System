import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';

export default function QrScanner() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error('Failed to clear scanner', error);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    
    try {
      const url = new URL(decodedText);
      const payload = url.searchParams.get('payload');
      
      if (!payload) {
        setError('Invalid QR code format. Missing payload.');
        return;
      }

      const res = await api.post('/evidences/decrypt-qr', { payload });
      if (res.data && res.data.route) {
        navigate(res.data.route);
      } else {
        setError('Failed to decrypt QR code payload.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid or malformed QR code.');
    }
  };

  const onScanFailure = () => {
    // html5-qrcode calls this frequently when no QR is in frame. Ignore it.
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass-panel">
        <h2 className="page-title text-center" style={{ marginBottom: 'var(--space-xl)' }}>Scan QR Code</h2>
        
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div className="error-message">{error}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
              <button onClick={() => window.location.reload()} className="btn-primary btn-full">
                Try Again
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary btn-full">
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div id="qr-reader" style={{ width: '100%', marginBottom: 'var(--space-lg)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />
            <button onClick={() => navigate('/dashboard')} className="btn-secondary btn-full">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
