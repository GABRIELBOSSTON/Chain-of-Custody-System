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
      // The decoded text is expected to be a URL containing ?payload=...
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
    <div className="centered-page" style={{ paddingTop: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        <h2 className="auth-title" style={{ textAlign: 'center' }}>Scan QR Code</h2>
        
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <p className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginBottom: '1rem' }}>
              Try Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ width: '100%' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" style={{ width: '100%', marginBottom: '1.5rem' }}></div>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ width: '100%' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
