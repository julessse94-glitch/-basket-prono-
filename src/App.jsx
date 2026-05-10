import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Classement from './components/Classement';

function ClubPage() {
  return (
    <div style={{ padding: '0 16px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div style={{ background: 'linear-gradient(135deg, #1A1428, #141420)', borderRadius: 20, padding: '20px', border: '1px solid rgba(183,148,244,0.2)', marginBottom: 20, animation: 'slideUp 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
            <img src="/logo-cslr.png" alt="CSLR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display='none'; }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#B794F4', fontFamily: "'Space Mono', monospace", letterSpacing: 1, marginBottom: 4 }}>CERCLE SPORTIF LILAS ROMAINVILLE</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Matchs du Club</div>
          </div>
        </div>
      </div>
      <div style={{ background: '#141414', borderRadius: 22, padding: '40px 24px', border: '1px solid rgba(183,148,244,0.1)', textAlign: 'center', animation: 'slideUp 0.35s ease 0.05s both' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏀</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Bientôt disponible !</div>
        <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>Les pronostics sur les matchs du CSLR arrivent la saison prochaine !</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{ icon: '📅', label: 'Pronostics match par match' }, { icon: '👕', label: 'Classement par équipe' }, { icon: '🏆', label: 'Récompenses de fin de saison' }].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1A1A1A', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 20, width: 36, height: 36, borderRadius: 10, background: 'rgba(183,148,244,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]); // tous les profils du compte
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nba');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const channelRef = useRef(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfiles(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfiles(session.user.id);
      else { setProfiles([]); setActiveProfileId(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeProfile) return;
    // Nettoyage propre du canal précédent
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel(`profile-${activeProfile.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${activeProfile.id}` },
        payload => setProfiles(prev => prev.map(p => p.id === payload.new.id ? payload.new : p)))
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [activeProfile?.id]);

  const loadProfiles = async (userId) => {
    // Charger le profil principal + les profils enfants
    const { data: main } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!main) { setLoading(false); return; }

    const { data: children } = await supabase.from('profiles').select('*').eq('parent_id', userId);
    const all = [main, ...(children || [])];
    setProfiles(all);
    setActiveProfileId(userId);
    setLoading(false);
  };

  const updateProfile = (updated) => {
    setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const addChildProfile = (child) => {
    setProfiles(prev => [...prev, child]);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏀</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#555' }}>Chargement...</div>
      </div>
    </div>
  );

  if (!session) return <Auth />;
  if (!activeProfile) return (
    <Profile
      userId={session.user.id}
      onProfileCreated={(p) => { setProfiles([p]); setActiveProfileId(p.id); }}
    />
  );

  const TABS = [
    { id: 'nba', icon: '🏀', label: 'NBA' },
    { id: 'club', icon: '👕', label: 'Club' },
    { id: 'classement', icon: '🏆', label: 'Classement' },
    { id: 'profil', icon: '👤', label: 'Profil' },
  ];

  const titles = { nba: 'NBA Playoffs 🏀', club: 'CSLR 👕', classement: 'Classement 🏆', profil: 'Mon Profil' };

  const hasMultipleProfiles = profiles.length > 1;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#0D0D0D', minHeight: '100vh', color: '#fff', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(183,148,244,0.1)', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#141414', border: '1px solid rgba(183,148,244,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/logo-cslr.png" alt="CSLR" style={{ width: '85%', height: '85%', objectFit: 'contain' }} onError={e => { e.target.style.display='none'; }} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#B794F4', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>HOOP PRONO · CSLR</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginTop: 1 }}>{titles[activeTab]}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Switcher de profil */}
            {hasMultipleProfiles && (
              <button onClick={() => setShowProfileSwitcher(!showProfileSwitcher)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 12,
                background: '#1A1A1A', border: '1px solid rgba(183,148,244,0.2)',
                cursor: 'pointer', maxWidth: 120,
              }}>
                <span style={{ fontSize: 16 }}>{activeProfile.avatar}</span>
                <span style={{ fontSize: 11, color: '#B794F4', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeProfile.prenom || activeProfile.pseudo}
                </span>
                <span style={{ fontSize: 10, color: '#555' }}>▾</span>
              </button>
            )}

            {activeTab === 'profil' && (
              <button onClick={() => setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A1A1A', border: '1px solid rgba(183,148,244,0.2)', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
            )}

            <div style={{ background: 'linear-gradient(135deg, #B794F4, #9B6FD4)', borderRadius: 12, padding: '5px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 16px rgba(183,148,244,0.3)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: 1 }}>PTS</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{activeProfile.points || 0}</div>
            </div>
          </div>
        </div>

        {/* Menu switcher de profil */}
        {showProfileSwitcher && (
          <div style={{ position: 'absolute', top: '100%', right: 16, left: 16, background: '#1A1A1A', borderRadius: 16, border: '1px solid rgba(183,148,244,0.2)', padding: '8px', zIndex: 200, animation: 'slideDown 0.2s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 10, color: '#555', fontFamily: "'Space Mono', monospace", padding: '6px 8px 8px', letterSpacing: 1 }}>CHANGER DE PROFIL</div>
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setActiveProfileId(p.id); setShowProfileSwitcher(false); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: p.id === activeProfileId ? 'rgba(183,148,244,0.15)' : 'transparent',
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 22 }}>{p.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.id === activeProfileId ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.prenom || p.pseudo} {p.id === activeProfileId ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: '#555', fontFamily: "'Space Mono', monospace" }}>
                    {p.is_child ? `Enfant · ${p.categorie}` : p.categorie} · {p.points || 0} pts
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay pour fermer le switcher */}
      {showProfileSwitcher && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowProfileSwitcher(false)} />}

      {/* Content */}
      <div style={{ padding: '16px 0', minHeight: 'calc(100vh - 130px)', animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'nba' && <Matches profile={activeProfile} />}
        {activeTab === 'club' && <ClubPage />}
        {activeTab === 'classement' && <Classement profile={activeProfile} allProfiles={profiles} />}
        {activeTab === 'profil' && (
          <Profile
            userId={session.user.id}
            existingProfile={activeProfile}
            allProfiles={profiles}
            onProfileUpdated={updateProfile}
            onChildAdded={addChildProfile}
            showSettings={showSettings}
            onCloseSettings={() => setShowSettings(false)}
            onSignOut={() => supabase.auth.signOut()}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(183,148,244,0.15)', display: 'flex', justifyContent: 'space-around', padding: '8px 0 24px', zIndex: 200 }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 10px', transition: 'all 0.2s', position: 'relative' }}>
              {t.id === 'club' && <div style={{ position: 'absolute', top: 0, right: 2, background: '#D4AF37', borderRadius: 6, fontSize: 7, fontWeight: 800, color: '#000', padding: '1px 4px', fontFamily: "'Space Mono', monospace" }}>NEW</div>}
              <div style={{ width: 42, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 18, background: active ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent', boxShadow: active ? '0 4px 16px rgba(183,148,244,0.4)' : 'none', transition: 'all 0.2s' }}>{t.icon}</div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, fontFamily: "'Space Mono', monospace", color: active ? '#B794F4' : '#444', letterSpacing: 0.5 }}>{t.label.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
