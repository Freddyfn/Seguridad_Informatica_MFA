import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export function Register() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axios.post('/api/auth/register', { name, address, phone, email, password });
      toast.success('Registro exitoso. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <UserPlus size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
          <h2 className="card-title">Crear Cuenta</h2>
          <p className="card-desc">Regístrate para configurar tu seguridad MFA</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nombre Completo</label>
            <div className="icon-wrapper">
              <UserPlus size={18} />
              <input 
                type="text" 
                className="input-field input-field-icon" 
                placeholder="Carlos Valderrama"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Dirección de Envío</label>
            <div className="icon-wrapper">
              <UserPlus size={18} />
              <input 
                type="text" 
                className="input-field input-field-icon" 
                placeholder="Cra 52 # 14-30, Medellín"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Teléfono</label>
            <div className="icon-wrapper">
              <UserPlus size={18} />
              <input 
                type="tel" 
                className="input-field input-field-icon" 
                placeholder="+57 300 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

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
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <p>¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
