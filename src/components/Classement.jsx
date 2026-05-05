import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function getCategorieLabel(user) {
  if (!user?.role) return '';
  if (user.role === 'parent') return `Parent ${user.categorie || ''}`;
  return user.categorie || '';
}

export default function Classement({ profile }) {
  const [classement, setClassement] = useState([]);
  const [groupeClassement, setGroupeClassement] = useState([]);
  const [tab, setTab] = useState(profile.groupe_code ? 'groupe' : 'mondial');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassement();
    const channel = supabase.channel('classement-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => loadClassement())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const loadClassement = async () => {
    const { data: mondial } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    if (mondial) setClassement(mondial);
    if (profile.groupe_code) {
      const { data: groupe } = await supabase.from('profiles').select('*').eq('groupe_code', profile.groupe_code).order('points', { ascending: false });
      if (groupe) setGroupeClassement(groupe);
    }
    setLoading(false);
  };

  const activeList = tab === 'groupe' ? groupeClassement : classement;
  const myRank = activeList.findIndex(p => p.id === profile.id) + 1;

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontFamily: "'Outfit', sans-serif" }}>
      Chargement...
    </div>
  );

  return (
    <div style={{ padding: '0 12px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#141414', borderRadius: 14, padding: 4, marginBottom: 16, border: '1px solid rgba(183,148,244,0.1)' }}>
        {profile.groupe_code && (
          <button onClick={() => setTab('groupe')} style={{
            flex: 1, padding: '9px 6px', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: tab === 'groupe' ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent',
            color: tab === 'groupe' ? '#fff' : '#555',
            boxShadow: tab === 'groupe' ? '0 4px 12px rgba(183,148,244,0.4)' : 'none',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            👥 {profile.groupe_nom || 'Mon groupe'}
          </button>
        )}
        <button onClick={() => setTab('mondial')} style={{
          flex: 1, padding: '9px 6px', borderRadius: 11, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700,
          background: tab === 'mondial' ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent',
          color: tab === 'mondial' ? '#fff' : '#555',
          boxShadow: tab === 'mondial' ? '0 4px 12px rgba(183,148,244,0.4)' : 'none',
          transition: 'all 0.2s',
        }}>
          🌍 Général
        </button>
      </div>

      {/* My rank */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1428, #141420)',
        borderRadius: 18, padding: '18px 20px', marginBottom: 20,
        border: '1px solid rgba(183,148,244,0.2)',
        boxShadow: '0 4px 24px rgba(183,148,244,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 10, color: '#B794F4', fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>
            {tab === 'groupe' ? 'DANS TON GROUPE' : 'CLASSEMENT GÉNÉRAL'}
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>#{myRank}</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
            sur {activeList.length} joueur{activeList.length > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#B794F4', fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>TES POINTS</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{profile.points || 0}</div>
        </div>
      </div>

      {/* Invite groupe */}
      {tab === 'groupe' && profile.groupe_code && (
        <div style={{
          background: '#141414', borderRadius: 14, padding: '12px 14px', marginBottom: 16,
          border: '1px solid rgba(183,148,244,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#B794F4', fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>CODE DU GROUPE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: 3, fontFamily: "'Space Mono', monospace" }}>{profile.groupe_code}</div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(`Rejoins-moi sur Hoop Prono CSLR ! 🏀\nCode du groupe : ${profile.groupe_code}\nhttps://hoop-prono.vercel.app`)}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #B794F4, #9B6FD4)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            📤 Inviter
          </button>
        </div>
      )}

      {/* ── PODIUM ── */}
      {activeList.length >= 3 && (
        <div style={{ marginBottom: 24 }}>
          {/* Podium : #2 gauche, #1 centre (plus haut), #3 droite */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>

            {/* #2 — gauche */}
            {(() => {
              const user = activeList[1];
              const isMe = user?.id === profile.id;
              return user ? (
                <div style={{ textAlign: 'center', flex: 1, animation: 'slideUp 0.4s ease 0.1s both' }}>
                  <div style={{ fontSize: 24, marginBottom: 3 }}>{user.avatar}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, color: isMe ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMe ? 'Toi' : user.pseudo}
                  </div>
                  <div style={{ fontSize: 9, color: '#555', marginBottom: 5, fontFamily: "'Space Mono', monospace" }}>{getCategorieLabel(user)}</div>
                  <div style={{
                    height: 80, background: isMe ? 'linear-gradient(180deg, #B794F4, #7B4FD4)' : '#1A1A1A',
                    border: '2px solid #C0C0C0', borderRadius: '10px 10px 0 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 -3px 12px rgba(192,192,192,0.3)',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#C0C0C0' }}>🥈</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? '#fff' : '#C0C0C0', fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* #1 — centre, plus haut */}
            {(() => {
              const user = activeList[0];
              const isMe = user?.id === profile.id;
              return user ? (
                <div style={{ textAlign: 'center', flex: 1, animation: 'slideUp 0.4s ease 0s both' }}>
                  <div style={{ fontSize: 28, marginBottom: 3 }}>{user.avatar}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: isMe ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMe ? 'Toi' : user.pseudo}
                  </div>
                  <div style={{ fontSize: 9, color: '#555', marginBottom: 5, fontFamily: "'Space Mono', monospace" }}>{getCategorieLabel(user)}</div>
                  <div style={{
                    height: 108, background: isMe ? 'linear-gradient(180deg, #B794F4, #7B4FD4)' : '#1A1A1A',
                    border: '2px solid #D4AF37', borderRadius: '10px 10px 0 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 -4px 20px rgba(212,175,55,0.4)',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#D4AF37' }}>🥇</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isMe ? '#fff' : '#D4AF37', fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* #3 — droite */}
            {(() => {
              const user = activeList[2];
              const isMe = user?.id === profile.id;
              return user ? (
                <div style={{ textAlign: 'center', flex: 1, animation: 'slideUp 0.4s ease 0.2s both' }}>
                  <div style={{ fontSize: 22, marginBottom: 3 }}>{user.avatar}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, color: isMe ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMe ? 'Toi' : user.pseudo}
                  </div>
                  <div style={{ fontSize: 9, color: '#555', marginBottom: 5, fontFamily: "'Space Mono', monospace" }}>{getCategorieLabel(user)}</div>
                  <div style={{
                    height: 62, background: isMe ? 'linear-gradient(180deg, #B794F4, #7B4FD4)' : '#1A1A1A',
                    border: '2px solid #CD7F32', borderRadius: '10px 10px 0 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    boxShadow: '0 -3px 12px rgba(205,127,50,0.3)',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#CD7F32' }}>🥉</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? '#fff' : '#CD7F32', fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
          {/* Ligne de sol */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(183,148,244,0.3), transparent)', borderRadius: 1 }} />
        </div>
      )}

      {/* Liste complète */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeList.map((user, i) => {
          const isMe = user.id === profile.id;
          return (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: isMe ? 'linear-gradient(135deg, #1A1428, #12122A)' : '#141414',
              borderRadius: 14, padding: '11px 14px',
              border: isMe ? '1px solid rgba(183,148,244,0.4)' : '1px solid rgba(255,255,255,0.04)',
              boxShadow: isMe ? '0 4px 20px rgba(183,148,244,0.15)' : 'none',
              animation: `slideUp 0.35s ease ${i * 0.04}s both`,
            }}>
              <div style={{ width: 26, textAlign: 'center', fontSize: 15, fontWeight: 800, color: i === 0 ? '#D4AF37' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#333', fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: isMe ? 'rgba(183,148,244,0.15)' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: isMe ? '2px solid rgba(183,148,244,0.4)' : '1px solid #222' }}>
                {user.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: isMe ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMe ? 'Toi 👈' : user.pseudo}
                </div>
                <div style={{ fontSize: 10, color: '#444', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                  {getCategorieLabel(user)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: isMe ? '#D4AF37' : '#fff', fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                <div style={{ fontSize: 9, color: '#444', fontFamily: "'Space Mono', monospace" }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {activeList.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 16, color: '#555' }}>Sois le premier à pronostiquer !</div>
        </div>
      )}
    </div>
  );
}
