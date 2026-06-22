import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ActivateMFAProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function ActivateMFA({ onComplete, onCancel }: ActivateMFAProps) {
  const { user, updateUser } = useAuth();
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      setIsLoadingQr(true);
      setError('');
      try {
        const response = await axios.post('/api/auth/2fa/generate-qr');
        setQrCodeBase64(response.data.qrCodeBase64);
        setSecretKey(response.data.secret);
      } catch (err: any) {
        setError(err.response?.data?.error || 'No se pudo generar el código QR.');
      } finally {
        setIsLoadingQr(false);
      }
    };
    generateQR();
  }, []);

  const handleVerify2FA = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifying(true);
    setError('');
    try {
      await axios.post('/api/auth/2fa/enable-verify', { code: otpCode });
      if (user) {
        updateUser({ ...user, twofaEnabled: true });
      }
      toast.success('¡2FA activado exitosamente!');
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código incorrecto. Intenta de nuevo.');
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Paso 1: Escanear QR</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Abre Google Authenticator o Authy y escanea este código. Si no puedes escanearlo, ingresa la clave manual: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{secretKey}</code>
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        {isLoadingQr ? (
          <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: '1rem' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : qrCodeBase64 ? (
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '1rem' }}>
            <img src={qrCodeBase64} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
          </div>
        ) : (
          <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--error)', borderRadius: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={32} />
          </div>
        )}
      </div>

      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Paso 2: Verificar Código</h3>
      <div className="input-group otp-container">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otpCode}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setOtpCode(val);
          }}
          className="input-field otp-input"
          placeholder="••••••"
          disabled={isVerifying || isLoadingQr || !qrCodeBase64}
        />
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn-outline" onClick={onCancel} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem' }}>
          Cancelar
        </button>
        <button 
          className="btn" 
          style={{ flex: 1 }} 
          onClick={handleVerify2FA}
          disabled={otpCode.length !== 6 || isVerifying || isLoadingQr || !qrCodeBase64}
        >
          {isVerifying ? 'Verificando...' : 'Activar 2FA'}
        </button>
      </div>
    </div>
  );
}
