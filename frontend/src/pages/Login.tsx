import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      if (res.data.status === '2FA_REQUIRED') {
        setPendingUserId(res.data.userId);
        setShow2FA(true);
      } else if (res.data.status === 'SUCCESS') {
        login(res.data.token, { id: res.data.userId, email: res.data.email, twofaEnabled: false });
        toast.success('Inicio de sesión exitoso');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (otpCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/auth/2fa/login-verify', {
        userId: pendingUserId,
        code: otpCode
      });

      if (res.data.status === 'SUCCESS') {
        login(res.data.token, { id: res.data.userId, email: res.data.email, twofaEnabled: true });
        toast.success('Autenticación de dos pasos exitosa');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código incorrecto');
      setOtpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  if (show2FA) {
    return (
      <div className="center-screen">
        <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
            <h2 className="card-title">Verificación 2FA</h2>
            <p className="card-desc">Ingresa el código de 6 dígitos de tu aplicación autenticadora.</p>
          </div>
          
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleVerify2FA}>
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
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <button type="submit" className="btn" disabled={otpCode.length !== 6 || isLoading}>
              {isLoading ? 'Verificando...' : 'Verificar Código'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn-outline" 
                style={{ border: 'none', fontSize: '0.875rem' }}
                onClick={() => {
                  setShow2FA(false);
                  setOtpCode('');
                  setPendingUserId(null);
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="card-title">Iniciar Sesión</h2>
        <p className="card-desc">Acceso seguro al sistema de operaciones</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <div className="icon-wrapper">
              <Mail size={18} />
              <input 
                type="email" 
                className="input-field input-field-icon" 
                placeholder="agente@seguridad.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div className="icon-wrapper">
              <Lock size={18} />
              <input 
                type="password" 
                className="input-field input-field-icon" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Autenticando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <p>¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Regístrate</Link></p>
        </div>
      </div>
    </div>
  );
}
