import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function getCategorieLabel(user) {
  if (!user?.role) return '';
  if (user.is_child) return user.categorie || '';
  if (user.role === 'parent') return `Parent · ${user.categorie || ''}`;
  return user.categorie || '';
}

export default function Classement({ profile, allProfiles }) {
  const [classement, setClassement] = useState([]);
  const [mesGroupes, setMesGroupes] = useState([]);
  const [groupeClassements, setGroupeClassements] = useState({});
  const [tab, setTab] = useState('mondial');
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
    const channel = supabase.channel('classement-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => loadAll())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profile.id]);

  const loadAll = async () => {
    // Classement général
    const { data: mondial } = await supabase.from('profiles').select('*').eq('is_child', false).order('points', { ascending: false });
    if (mondial) setClassement(mondial);

    // Mes groupes
    const { data: membres } = await supabase.from('groupe_membres').select('*').eq('user_id', profile.id);
    if (membres?.length) {
      setMesGroupes(membres);
      if (!selectedGroupe) setSelectedGroupe(membres[0]?.groupe_code);

      // Charger classement de chaque groupe
      const classements = {};
      for (const m of membres) {
        const { data: gmembres } = await supabase.from('groupe_membres').select('user_id').eq('groupe_code', m.groupe_code);
        if (gmembres) {
          const ids = gmembres.map(gm => gm.user_id);
          const { data: gprofiles } = await supabase.from('profiles').select('*').in('id', ids).order('points', { ascending: false });
          if (gprofiles) classements[m.groupe_code] = { nom: m.groupe_nom, members: gprofiles };
        }
      }
      setGroupeClassements(classements);
    }
    setLoading(false);
  };

  const activeList = tab === 'mondial' ? classement : (groupeClassements[selectedGroupe]?.members || []);
  const myRank = activeList.findIndex(p => p.id === profile.id) + 1;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>;

  return (
    <div style={{ padding: '0 14px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#141414', borderRadius: 14, padding: 4, marginBottom: 14, border: '1px solid rgba(183,148,244,0.1)' }}>
        <button onClick={() => setTab('mondial')} style={{ flex: 1, padding: '9px 6px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: tab === 'mondial' ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent', color: tab === 'mondial' ? '#fff' : '#555', boxShadow: tab === 'mondial' ? '0 4px 12px rgba(183,148,244,0.4)' : 'none', transition: 'all 0.2s' }}>
          🌍 Général
        </button>
        {mesGroupes.length > 0 && (
          <button onClick={() => setTab('groupes')} style={{ flex: 1, padding: '9px 6px', borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: tab === 'groupes' ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent', color: tab === 'groupes' ? '#fff' : '#555', boxShadow: tab === 'groupes' ? '0 4px 12px rgba(183,148,244,0.4)' : 'none', transition: 'all 0.2s' }}>
            👥 Mes groupes ({mesGroupes.length})
          </button>
        )}
      </div>

      {/* Sélecteur de groupe */}
      {tab === 'groupes' && mesGroupes.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {mesGroupes.map(g => (
            <button key={g.groupe_code} onClick={() => setSelectedGroupe(g.groupe_code)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 700,
              background: selectedGroupe === g.groupe_code ? 'rgba(212,175,55,0.15)' : '#141414',
              color: selectedGroupe === g.groupe_code ? '#D4AF37' : '#555',
              border: selectedGroupe === g.groupe_code ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}>{g.groupe_nom}</button>
          ))}
        </div>
      )}

      {/* Pas de groupe */}
      {tab === 'groupes' && mesGroupes.length === 0 && (
        <div style={{ background: '#141414', borderRadius: 20, padding: '24px', textAlign: 'center', border: '1px solid rgba(183,148,244,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Pas encore de groupe</div>
          <div style={{ fontSize: 13, color: '#555' }}>Crée ou rejoins un groupe depuis les ⚙️ paramètres</div>
        </div>
      )}

      {/* My rank */}
      {(tab === 'mondial' || (tab === 'groupes' && mesGroupes.length > 0)) && (
        <div style={{ background: 'linear-gradient(135deg, #1A1428, #141420)', borderRadius: 18, padding: '16px 20px', marginBottom: 16, border: '1px solid rgba(183,148,244,0.2)', boxShadow: '0 4px 24px rgba(183,148,244,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#B794F4', fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>
              {tab === 'groupes' ? (groupeClassements[selectedGroupe]?.nom || 'TON GROUPE').toUpperCase() : 'CLASSEMENT GÉNÉRAL'}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>#{myRank || '—'}</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 4, fontFamily: "'Space Mono', monospace" }}>sur {activeList.length} joueur{activeList.length > 1 ? 's' : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#B794F4', fontFamily: "'Space Mono', monospace", marginBottom: 4, letterSpacing: 1 }}>TES POINTS</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{profile.points || 0}</div>
          </div>
        </div>
      )}

      {/* Podium */}
      {activeList.length >= 3 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
            {/* #2 gauche */}
            {[1, 0, 2].map((idx, pos) => {
              const user = activeList[idx];
              if (!user) return null;
              const heights = [80, 110, 62];
              const colors = ['#C0C0C0', '#D4AF37', '#CD7F32'];
              const medals = ['🥈', '🥇', '🥉'];
              const isMe = user.id === profile.id;
              return (
                <div key={idx} style={{ textAlign: 'center', flex: 1, animation: `slideUp 0.4s ease ${pos * 0.1}s both` }}>
                  <div style={{ fontSize: pos === 1 ? 26 : 22, marginBottom: 3 }}>{user.avatar}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 1, color: isMe ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMe ? 'Toi' : (user.prenom || user.pseudo)}</div>
                  <div style={{ fontSize: 9, color: '#555', marginBottom: 5, fontFamily: "'Space Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCategorieLabel(user)}</div>
                  <div style={{ height: heights[pos], background: isMe ? 'linear-gradient(180deg, #B794F4, #7B4FD4)' : '#1A1A1A', border: `2px solid ${colors[pos]}`, borderRadius: '10px 10px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: `0 -3px 12px ${colors[pos]}44` }}>
                    <div style={{ fontSize: pos === 1 ? 20 : 16 }}>{medals[pos]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? '#fff' : colors[pos], fontFamily: "'Space Mono', monospace" }}>{user.points}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(183,148,244,0.3), transparent)', borderRadius: 1 }} />
        </div>
      )}

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeList.map((user, i) => {
          const isMe = user.id === profile.id;
          return (
            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isMe ? 'linear-gradient(135deg, #1A1428, #12122A)' : '#141414', borderRadius: 14, padding: '11px 14px', border: isMe ? '1px solid rgba(183,148,244,0.4)' : '1px solid rgba(255,255,255,0.04)', boxShadow: isMe ? '0 4px 20px rgba(183,148,244,0.15)' : 'none', animation: `slideUp 0.35s ease ${i * 0.04}s both` }}>
              <div style={{ width: 26, textAlign: 'center', fontSize: 15, fontWeight: 800, color: i === 0 ? '#D4AF37' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#333', fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: isMe ? 'rgba(183,148,244,0.15)' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: isMe ? '2px solid rgba(183,148,244,0.4)' : '1px solid #222' }}>
                {user.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: isMe ? '#B794F4' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMe ? 'Toi 👈' : (user.prenom || user.pseudo)}
                </div>
                <div style={{ fontSize: 10, color: '#444', fontFamily: "'Space Mono', monospace", marginTop: 1 }}>{getCategorieLabel(user)}</div>
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
