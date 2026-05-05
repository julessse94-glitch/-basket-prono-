import { useState } from 'react';
import { supabase } from '../supabase';

// 3 états : 'landing' | 'login' | 'signup'
export default function Auth() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const back = () => { setError(null); setEmail(''); setPassword(''); setScreen('landing'); };

  const sharedStyle = {
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: "'Outfit', sans-serif",
    position: 'relative', overflow: 'hidden',
  };

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1px solid rgba(183,148,244,0.2)', background: '#0A0A0A',
    color: '#fff', fontSize: 15, fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s', outline: 'none',
  };

  // ── LOGO COMMUN ──
  const Logo = () => (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: '#141414', border: '2px solid rgba(183,148,244,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', overflow: 'hidden',
        boxShadow: '0 0 40px rgba(183,148,244,0.2)',
      }}>
        <img src="./logo-cslr.png" alt="CSLR" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: 4, color: '#B794F4', fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 10 }}>
        CERCLE SPORTIF LILAS ROMAINVILLE
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Hoop Prono</div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 6, fontFamily: "'Space Mono', monospace" }}>NBA PLAYOFFS 2026 🏆</div>
    </div>
  );

  // ── ÉCRAN D'ACCUEIL ──
  if (screen === 'landing') return (
    <div style={sharedStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 30px rgba(183,148,244,0.2) } 50% { box-shadow: 0 0 50px rgba(183,148,244,0.4) } }
      `}</style>

      {/* Ambiance lumineuse */}
      <div style={{ position: 'absolute', top: -150, left: -150, width: 400, height: 400, background: 'radial-gradient(circle, rgba(183,148,244,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -150, right: -150, width: 350, height: 350, background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.5s ease' }}>
        <Logo />

        {/* Description */}
        <div style={{
          background: '#141414', borderRadius: 20, padding: '20px',
          border: '1px solid rgba(183,148,244,0.1)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🎯', text: 'Pronostique chaque match des playoffs' },
              { icon: '🏆', text: '100 pts par bon prono' },
              { icon: '👥', text: 'Classement entre membres du club' },
              { icon: '🎁', text: 'Des récompenses pour les meilleurs !' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20, width: 36, height: 36, borderRadius: 10, background: 'rgba(183,148,244,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ fontSize: 13, color: '#AAA', fontWeight: 500 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Boutons principaux */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setScreen('signup')} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #B794F4, #9B6FD4)',
            color: '#fff', fontSize: 16, fontWeight: 800,
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 24px rgba(183,148,244,0.4)',
            animation: 'glow 3s ease infinite',
          }}>
            🏀 Je m'inscris
          </button>

          <button onClick={() => setScreen('login')} style={{
            width: '100%', padding: '15px', borderRadius: 16,
            border: '1px solid rgba(183,148,244,0.3)',
            background: 'transparent',
            color: '#B794F4', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
          }}>
            J'ai déjà un compte
          </button>
        </div>
      </div>
    </div>
  );

  // ── FORMULAIRE COMMUN ──
  const isSignup = screen === 'signup';
  return (
    <div style={sharedStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #444; }
        input:focus { border-color: #B794F4 !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.4s ease' }}>
        <Logo />

        <div style={{
          background: '#141414', borderRadius: 24, padding: '28px 24px',
          border: '1px solid rgba(183,148,244,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Titre */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              {isSignup ? '👋 Créer mon compte' : '🔓 Se connecter'}
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>
              {isSignup ? 'Rejoins le classement du CSLR' : 'Content de te revoir !'}
            </div>
          </div>

          <form onSubmit={isSignup ? handleSignup : handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#B794F4', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} placeholder="ton@email.com" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#B794F4', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>MOT DE PASSE</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inp} placeholder="••••••••" />
              {isSignup && <div style={{ fontSize: 11, color: '#444', marginTop: 6 }}>Minimum 6 caractères</div>}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #B794F4, #9B6FD4)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 20px rgba(183,148,244,0.4)',
              marginBottom: 14,
            }}>
              {loading ? 'Chargement...' : isSignup ? "Créer mon compte 🏀" : "Se connecter"}
            </button>
          </form>

          <button onClick={back} style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
            color: '#555', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
          }}>
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
}
