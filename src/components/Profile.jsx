import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AVATARS = ['🏀', '🔥', '⭐', '⚡', '🦁', '🌙', '💫', '🎯', '👑', '🦅', '🐺', '☘️'];
const CATEGORIES_JOUEUR = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U18', 'U20', 'Senior', 'Vétéran'];
const CATEGORIES_PARENT = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U18', 'U20', 'Senior'];

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const inp = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  border: '2px solid #F0F0F0', background: '#FAFAFA',
  color: '#1A1A2E', fontSize: 15, fontFamily: "'Outfit', sans-serif",
  transition: 'border-color 0.2s',
};

const lbl = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#BBB',
  marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
};

function getCategorieLabel(profile) {
  if (!profile?.role) return '';
  if (profile.role === 'parent') return `Parent · ${profile.categorie || ''}`;
  return profile.categorie || '';
}

// ── SETTINGS MODAL ──
function SettingsModal({ profile, userId, onClose, onUpdate, onSignOut }) {
  const [section, setSection] = useState('main');
  const [pseudo, setPseudo] = useState(profile.pseudo || '');
  const [avatar, setAvatar] = useState(profile.avatar || '🏀');
  const [role, setRole] = useState(profile.role || 'joueur');
  const [categorie, setCategorie] = useState(profile.categorie || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [groupeAction, setGroupeAction] = useState('');
  const [groupeNom, setGroupeNom] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const showMsg = (text, isError = false) => {
    if (isError) setError(text); else setMsg(text);
    setTimeout(() => { setMsg(null); setError(null); }, 3000);
  };

  const categories = role === 'joueur' ? CATEGORIES_JOUEUR : CATEGORIES_PARENT;

  const saveProfil = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').update({ pseudo, avatar, role, categorie }).eq('id', userId).select().single();
    setLoading(false);
    if (error) showMsg(error.message, true);
    else { onUpdate(data); showMsg('Profil mis à jour ✅'); }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { showMsg('Les mots de passe ne correspondent pas', true); return; }
    if (newPassword.length < 6) { showMsg('Minimum 6 caractères', true); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) showMsg(error.message, true);
    else { showMsg('Mot de passe mis à jour ✅'); setNewPassword(''); setConfirmPassword(''); }
  };

  const createGroupe = async () => {
    if (!groupeNom) return;
    setLoading(true);
    const code = generateCode();
    await supabase.from('groupes').insert([{ code, nom: groupeNom, created_by: userId }]);
    const { data, error } = await supabase.from('profiles').update({ groupe_code: code, groupe_nom: groupeNom }).eq('id', userId).select().single();
    setLoading(false);
    if (error) showMsg(error.message, true);
    else { onUpdate(data); showMsg(`Groupe créé ! Code : ${code} ✅`); setGroupeAction(''); }
  };

  const joinGroupe = async () => {
    if (!joinCode) return;
    setLoading(true);
    const { data: groupe } = await supabase.from('groupes').select('*').eq('code', joinCode.toUpperCase()).single();
    if (!groupe) { showMsg('Code invalide', true); setLoading(false); return; }
    const { data, error } = await supabase.from('profiles').update({ groupe_code: groupe.code, groupe_nom: groupe.nom }).eq('id', userId).select().single();
    setLoading(false);
    if (error) showMsg(error.message, true);
    else { onUpdate(data); showMsg(`Groupe "${groupe.nom}" rejoint ✅`); setGroupeAction(''); }
  };

  const leaveGroupe = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').update({ groupe_code: null, groupe_nom: null }).eq('id', userId).select().single();
    setLoading(false);
    if (error) showMsg(error.message, true);
    else { onUpdate(data); showMsg('Groupe quitté'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {section !== 'main' && <button onClick={() => { setSection('main'); setGroupeAction(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#BBB' }}>←</button>}
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
              {section === 'main' && '⚙️ Paramètres'}
              {section === 'profil' && 'Modifier le profil'}
              {section === 'groupe' && 'Mon groupe'}
              {section === 'password' && 'Mot de passe'}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', fontSize: 14, color: '#999' }}>✕</button>
        </div>

        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#059669', fontSize: 13, marginBottom: 14, fontWeight: 600 }}>{msg}</div>}
        {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF0F0', border: '1px solid #FFD0D0', color: '#CC4444', fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {section === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '👤', label: 'Modifier le profil', sub: `${profile.pseudo} · ${getCategorieLabel(profile)}`, action: () => setSection('profil') },
              { icon: '👥', label: 'Mon groupe', sub: profile.groupe_nom || 'Créer ou rejoindre', action: () => setSection('groupe') },
              { icon: '🔑', label: 'Mot de passe', sub: 'Changer ton mot de passe', action: () => setSection('password') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: '#F8F7F4', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ fontSize: 22, width: 42, height: 42, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#BBB', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                </div>
                <div style={{ color: '#DDD', fontSize: 18 }}>›</div>
              </button>
            ))}
            <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: '#FFF5F5', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 4 }}>
              <div style={{ fontSize: 22, width: 42, height: 42, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🚪</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Se déconnecter</div></div>
            </button>
          </div>
        )}

        {section === 'profil' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>AVATAR</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {AVATARS.map(av => <button key={av} type="button" onClick={() => setAvatar(av)} style={{ padding: '10px', borderRadius: 12, fontSize: 22, cursor: 'pointer', border: avatar === av ? '2px solid #1A1A2E' : '2px solid #F0F0F0', background: avatar === av ? '#F8F7F4' : '#fff' }}>{av}</button>)}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>PSEUDO</label>
              <input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} maxLength={20} style={inp} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>JE SUIS</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['joueur', '🏀 Joueur'], ['parent', '👨‍👩‍👧 Parent']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => { setRole(v); setCategorie(''); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${role === v ? '#1A1A2E' : '#F0F0F0'}`, background: role === v ? '#1A1A2E' : '#FAFAFA', color: role === v ? '#FFD700' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>{role === 'joueur' ? 'MA CATÉGORIE' : 'CATÉGORIE DE MON ENFANT'}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(cat => (
                  <button key={cat} type="button" onClick={() => setCategorie(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${categorie === cat ? '#1A1A2E' : '#F0F0F0'}`, background: categorie === cat ? '#1A1A2E' : '#FAFAFA', color: categorie === cat ? '#FFD700' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>
                ))}
              </div>
            </div>
            <button onClick={saveProfil} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'Outfit', sans-serif" }}>
              {loading ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        )}

        {section === 'groupe' && (
          <div>
            {profile.groupe_code ? (
              <div>
                <div style={{ background: '#F8F7F4', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#BBB', fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>TON GROUPE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>{profile.groupe_nom}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A2E', letterSpacing: 4, fontFamily: "'Space Mono', monospace", background: '#fff', padding: '10px 16px', borderRadius: 10, border: '2px solid #F0F0F0', flex: 1, textAlign: 'center' }}>{profile.groupe_code}</div>
                    <button onClick={() => navigator.clipboard.writeText(`Rejoins-moi sur Hoop Prono ! 🏀\nCode du groupe : ${profile.groupe_code}\nhttps://hoop-prono.vercel.app`)} style={{ padding: '12px 14px', borderRadius: 10, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📤</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#BBB', marginTop: 8, textAlign: 'center' }}>Partage ce code à tes amis</div>
                </div>
                <button onClick={leaveGroupe} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid #FFE8E8', background: '#fff', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Quitter le groupe</button>
              </div>
            ) : (
              <div>
                {!groupeAction && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={() => setGroupeAction('create')} style={{ padding: '16px', borderRadius: 16, border: '2px solid #F0F0F0', background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit', sans-serif" }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>➕</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>Créer un groupe</div>
                      <div style={{ fontSize: 12, color: '#BBB', marginTop: 4 }}>Invite tes amis avec un code unique</div>
                    </button>
                    <button onClick={() => setGroupeAction('join')} style={{ padding: '16px', borderRadius: 16, border: '2px solid #F0F0F0', background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit', sans-serif" }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>🔗</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>Rejoindre un groupe</div>
                      <div style={{ fontSize: 12, color: '#BBB', marginTop: 4 }}>Entre le code reçu par un ami</div>
                    </button>
                  </div>
                )}
                {groupeAction === 'create' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={lbl}>NOM DU GROUPE</label>
                      <input type="text" value={groupeNom} onChange={e => setGroupeNom(e.target.value)} maxLength={30} style={inp} placeholder="Ex: Mon équipe, Les potes..." />
                    </div>
                    <button onClick={createGroupe} disabled={loading || !groupeNom} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 15, fontWeight: 700, cursor: (!groupeNom || loading) ? 'not-allowed' : 'pointer', opacity: (!groupeNom || loading) ? 0.6 : 1, fontFamily: "'Outfit', sans-serif" }}>
                      {loading ? 'Création...' : 'Créer le groupe'}
                    </button>
                  </div>
                )}
                {groupeAction === 'join' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={lbl}>CODE DU GROUPE</label>
                      <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inp, letterSpacing: 4, fontFamily: "'Space Mono', monospace", fontSize: 20, textAlign: 'center' }} placeholder="XXXXXX" />
                    </div>
                    <button onClick={joinGroupe} disabled={loading || joinCode.length < 6} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 15, fontWeight: 700, cursor: (joinCode.length < 6 || loading) ? 'not-allowed' : 'pointer', opacity: (joinCode.length < 6 || loading) ? 0.6 : 1, fontFamily: "'Outfit', sans-serif" }}>
                      {loading ? 'Vérification...' : 'Rejoindre'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {section === 'password' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>NOUVEAU MOT DE PASSE</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inp} placeholder="••••••••" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>CONFIRMER</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inp} placeholder="••••••••" />
            </div>
            <button onClick={savePassword} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'Outfit', sans-serif" }}>
              {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE PROFIL ──
export default function Profile({ userId, existingProfile, onProfileCreated, onProfileUpdated, showSettings, onCloseSettings, onSignOut }) {
  const [pronos, setPronos] = useState([]);
  const [nbaGames, setNbaGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [pseudo, setPseudo] = useState('');
  const [avatar, setAvatar] = useState('🏀');
  const [role, setRole] = useState('joueur');
  const [categorie, setCategorie] = useState('');
  const [groupeStep, setGroupeStep] = useState('choice');
  const [groupeNom, setGroupeNom] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const isCreating = !existingProfile;
  const categories = role === 'joueur' ? CATEGORIES_JOUEUR : CATEGORIES_PARENT;

  useEffect(() => {
    if (existingProfile) {
      loadAll();
      const channel = supabase.channel(`pronos-${existingProfile.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pronostics', filter: `user_id=eq.${existingProfile.id}` }, () => loadAll())
        .subscribe();
      return () => supabase.removeChannel(channel);
    } else setLoading(false);
  }, [existingProfile?.id]);

  const loadAll = async () => {
    await Promise.all([loadPronos(), loadNbaGames()]);
    setLoading(false);
  };

  const loadPronos = async () => {
    const { data } = await supabase.from('pronostics').select('*').eq('user_id', existingProfile.id).order('created_at', { ascending: false });
    if (data) setPronos(data);
  };

  const loadNbaGames = async () => {
    const { data } = await supabase.from('nba_games').select('id, home_name, away_name, game_num, serie_id, status, home_score, away_score, home, away');
    if (data) { const map = {}; data.forEach(g => { map[g.id] = g; }); setNbaGames(map); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!categorie) { setError('Choisis ta catégorie'); return; }
    setSaveLoading(true); setError(null);
    try {
      let finalGroupeCode = null, finalGroupeNom = null;
      if (groupeStep === 'create' && groupeNom) {
        const code = generateCode();
        await supabase.from('groupes').insert([{ code, nom: groupeNom, created_by: userId }]);
        finalGroupeCode = code; finalGroupeNom = groupeNom;
      } else if (groupeStep === 'join' && joinCode) {
        const { data: groupe } = await supabase.from('groupes').select('*').eq('code', joinCode.toUpperCase()).single();
        if (!groupe) throw new Error('Code de groupe invalide');
        finalGroupeCode = groupe.code; finalGroupeNom = groupe.nom;
      }
      const { data, error } = await supabase.from('profiles').upsert({ id: userId, pseudo, avatar, role, categorie, points: 0, groupe_code: finalGroupeCode, groupe_nom: finalGroupeNom }).select().single();
      if (error) throw error;
      onProfileCreated?.(data);
    } catch (err) { setError(err.message); }
    finally { setSaveLoading(false); }
  };

  const submitted = pronos.filter(p => p.submitted);
  const correct = pronos.filter(p => p.points_gagnes > 0);
  const pct = submitted.length > 0 ? Math.round((correct.length / submitted.length) * 100) : 0;
  const last5 = submitted.slice(0, 5);

  // ── CRÉATION ──
  if (isCreating) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap'); input:focus { outline: none; border-color: #1A1A2E !important; }`}</style>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>🏀</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1A1A2E', letterSpacing: -0.5 }}>Hoop Prono</div>
            <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Crée ton profil pour commencer</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>AVATAR</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {AVATARS.map(av => <button key={av} type="button" onClick={() => setAvatar(av)} style={{ padding: '10px', borderRadius: 12, fontSize: 22, cursor: 'pointer', border: avatar === av ? '2px solid #1A1A2E' : '2px solid #F0F0F0', background: avatar === av ? '#F8F7F4' : '#fff' }}>{av}</button>)}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>TON PSEUDO</label>
                <input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} required maxLength={20} style={inp} placeholder="Comment veux-tu apparaître ?" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>JE SUIS</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['joueur', '🏀 Joueur'], ['parent', '👨‍👩‍👧 Parent']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => { setRole(v); setCategorie(''); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${role === v ? '#1A1A2E' : '#F0F0F0'}`, background: role === v ? '#1A1A2E' : '#FAFAFA', color: role === v ? '#FFD700' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>{role === 'joueur' ? 'MA CATÉGORIE' : 'CATÉGORIE DE MON ENFANT'}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => setCategorie(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${categorie === cat ? '#1A1A2E' : '#F0F0F0'}`, background: categorie === cat ? '#1A1A2E' : '#FAFAFA', color: categorie === cat ? '#FFD700' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={lbl}>GROUPE (optionnel)</label>
                {groupeStep === 'choice' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setGroupeStep('create')} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: '2px solid #F0F0F0', background: '#FAFAFA', color: '#1A1A2E', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>➕ Créer</button>
                    <button type="button" onClick={() => setGroupeStep('join')} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: '2px solid #F0F0F0', background: '#FAFAFA', color: '#1A1A2E', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>🔗 Rejoindre</button>
                  </div>
                )}
                {groupeStep === 'create' && (
                  <div>
                    <input type="text" value={groupeNom} onChange={e => setGroupeNom(e.target.value)} maxLength={30} style={inp} placeholder="Ex: Mon équipe, Les potes..." />
                    <button type="button" onClick={() => setGroupeStep('choice')} style={{ marginTop: 8, background: 'none', border: 'none', color: '#BBB', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>← Retour</button>
                  </div>
                )}
                {groupeStep === 'join' && (
                  <div>
                    <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inp, letterSpacing: 4, fontFamily: "'Space Mono', monospace", fontSize: 20, textAlign: 'center' }} placeholder="XXXXXX" />
                    <button type="button" onClick={() => setGroupeStep('choice')} style={{ marginTop: 8, background: 'none', border: 'none', color: '#BBB', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>← Retour</button>
                  </div>
                )}
              </div>
              {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF0F0', border: '1px solid #FFD0D0', color: '#CC4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button type="submit" disabled={saveLoading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#1A1A2E', color: '#FFD700', fontSize: 15, fontWeight: 700, cursor: saveLoading ? 'not-allowed' : 'pointer', opacity: saveLoading ? 0.7 : 1, fontFamily: "'Outfit', sans-serif" }}>
                {saveLoading ? 'Enregistrement...' : "C'est parti 🏀"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── PAGE PROFIL PRINCIPALE ──
  return (
    <div style={{ padding: '0 16px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Card identité */}
      <div style={{ background: '#1A1A2E', borderRadius: 24, padding: '22px', marginBottom: 14, boxShadow: '0 4px 24px rgba(26,26,46,0.15)', animation: 'slideUp 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,215,0,0.1)', border: '2px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {existingProfile.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{existingProfile.pseudo}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,215,0,0.5)', fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
              {getCategorieLabel(existingProfile)}
            </div>
            {existingProfile.groupe_nom
              ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>👥 {existingProfile.groupe_nom} · {existingProfile.groupe_code}</div>
              : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>Pas de groupe — crées-en un via ⚙️</div>
            }
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,215,0,0.4)', fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>TOTAL</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#FFD700', lineHeight: 1 }}>{existingProfile.points || 0}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,215,0,0.4)', fontFamily: "'Space Mono', monospace" }}>pts</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'PRONOS', value: submitted.length, icon: '✏️' },
          { label: 'RÉUSSIS', value: correct.length, icon: '✅' },
          { label: 'RÉUSSITE', value: submitted.length > 0 ? `${pct}%` : '—', icon: '📊' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '16px 10px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', animation: `slideUp 0.3s ease ${0.05 + i * 0.05}s both` }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1A1A2E', fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#CCC', fontFamily: "'Space Mono', monospace", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 5 derniers pronos */}
      {submitted.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 14, animation: 'slideUp 0.3s ease 0.18s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#BBB', fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>5 DERNIERS PRONOS</div>
            <div style={{ fontSize: 10, color: '#CCC', fontFamily: "'Space Mono', monospace" }}>Temps réel</div>
          </div>
          {last5.map((p, i) => {
            const game = nbaGames[p.nba_serie_id];
            const serieLabel = game ? `${game.home_name} vs ${game.away_name}` : p.nba_serie_id || 'Match';
            const gameNum = game ? `Game ${game.game_num}` : '';
            const winnerLabel = game ? (p.vainqueur === 'home' ? game.home_name : game.away_name) : (p.vainqueur === 'home' ? 'Domicile' : 'Extérieur');
            const isFinished = game?.status === 'finished';
            const icon = !isFinished ? '⏳' : p.points_gagnes > 0 ? '✅' : '❌';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < last5.length - 1 ? '1px solid #F8F7F4' : 'none' }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{winnerLabel}</div>
                  <div style={{ fontSize: 10, color: '#CCC', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>{serieLabel}{gameNum ? ` · ${gameNum}` : ''}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.points_gagnes > 0 ? '#059669' : isFinished ? '#EF4444' : '#BBB', fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                  {p.points_gagnes > 0 ? `+${p.points_gagnes}` : isFinished ? '0' : '?'} pts
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 14, animation: 'slideUp 0.3s ease 0.15s both' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏀</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Aucun prono pour l'instant</div>
          <div style={{ fontSize: 13, color: '#BBB' }}>Va sur Matchs pour commencer !</div>
        </div>
      )}

      {/* Bouton WhatsApp */}
      <a
        href="https://wa.me/33760163497?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20l%27app%20Hoop%20Prono%20!"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: '#fff', borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          textDecoration: 'none', marginBottom: 14,
          animation: 'slideUp 0.3s ease 0.22s both',
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💬</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>Aide & Feedback</div>
          <div style={{ fontSize: 12, color: '#BBB', marginTop: 2 }}>Contacte-nous sur WhatsApp</div>
        </div>
        <div style={{ color: '#25D366', fontSize: 20 }}>›</div>
      </a>

      {showSettings && <SettingsModal profile={existingProfile} userId={userId} onClose={onCloseSettings} onUpdate={data => onProfileUpdated?.(data)} onSignOut={onSignOut} />}
    </div>
  );
}
