import React, { useState, useEffect } from 'react';
import { LogOut, ShieldAlert, ShieldCheck, User as UserIcon, ShoppingBag, ShoppingCart, X, Plus, Minus, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ActivateMFA } from '../components/ActivateMFA';
import axios from 'axios';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [showMFAConfig, setShowMFAConfig] = useState(!user?.twofaEnabled);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados del Carrito y Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.twofaEnabled) {
      fetchProducts();
    }
  }, [user?.twofaEnabled]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      toast.error('Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    // Simular tiempo de procesamiento de pasarela de pago (2 segundos)
    await new Promise(r => setTimeout(r, 2000));

    try {
      // Registrar la orden en el backend enviando el total y el primer ID de producto del carrito
      await axios.post('/api/orders', { product_id: cart[0].product.id, total: cartTotal });
      
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setCart([]);
      toast.success('¡Compra realizada con éxito! Tu pedido está en camino.');
    } catch (err) {
      setIsProcessing(false);
      toast.error('No se pudo procesar la compra.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1200px', position: 'relative' }}>
      <nav className="navbar" style={{ marginBottom: '2rem' }}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck color="var(--primary)" />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Colombia Store <span style={{fontSize: '1rem', fontWeight: 'normal', opacity: 0.7}}>| Protected by 2FA</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {user?.twofaEnabled && (
            <div 
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s', color: cartCount > 0 ? 'var(--primary)' : 'var(--text-main)' }} 
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={28} />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </div>
          )}
          <button onClick={logout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </nav>

      {!user?.twofaEnabled ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="alert alert-error" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={24} />
            <div>
              <strong>Acceso Denegado a la Tienda</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>Por motivos de seguridad, debes configurar la autenticación de dos pasos (2FA) antes de poder acceder al catálogo y realizar compras.</p>
            </div>
          </div>
          <div className="glass-card">
            <ActivateMFA onComplete={() => setShowMFAConfig(false)} onCancel={() => {}} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)', padding: '1rem', borderRadius: '50%' }}>
                <UserIcon size={32} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>Bienvenido, {user?.name || user?.email}</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>
                  <strong>Envío a:</strong> {user?.address || 'Dirección no registrada'} | <strong>Tel:</strong> {user?.phone || 'N/A'}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 'bold' }}>
                <ShieldCheck size={18} /> Cuenta Segura
              </span>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag color="var(--primary)" /> Nueva Colección
            </h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando catálogo...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {products.map(product => (
                  <div key={product.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '300px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 'bold' }}>{product.category}</span>
                      <h3 style={{ margin: '0.5rem 0', fontSize: '1.25rem' }}>{product.name}</h3>
                      <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1 }}>{product.description}</p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                          ${product.price.toLocaleString('es-CO')}
                        </span>
                        <button 
                          className="btn" 
                          style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.9rem', width: 'auto' }}
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart size={18} /> Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="overlay" onClick={() => setIsCartOpen(false)}>
          <div className="sidebar" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart /> Tu Carrito
              </h2>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#1a1a1a', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                       <img src={item.product.image_url} alt={item.product.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{item.product.name}</h4>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        ${item.product.price.toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}><Minus size={14} /></button>
                      <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }}><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}>
                      <X size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span>Subtotal:</span>
                <span style={{ color: 'var(--primary)' }}>${cartTotal.toLocaleString('es-CO')}</span>
              </div>
              <button 
                className="btn" 
                disabled={cart.length === 0}
                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="overlay overlay-center" onClick={() => !isProcessing && setIsCheckoutOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard color="var(--primary)" /> Checkout Seguro
              </h2>
              {!isProcessing && (
                <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Resumen del Envío</h4>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{user?.name}</p>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{user?.address}</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Tel: {user?.phone}</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total a Pagar ({cartCount} artículos):</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>${cartTotal.toLocaleString('es-CO')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} /> Tu compra está protegida con cifrado bancario.
              </p>
            </div>

            {isProcessing ? (
              <button className="btn" disabled style={{ width: '100%', padding: '1rem', background: 'rgba(250, 204, 21, 0.5)' }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span> Procesando tarjeta...
              </button>
            ) : (
              <button 
                className="btn" 
                onClick={handleCheckout}
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              >
                Confirmar y Pagar
              </button>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
