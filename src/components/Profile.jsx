import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AVATARS = ['🏀', '🔥', '⭐', '⚡', '🦁', '🌙', '💫', '🎯', '👑', '🦅', '🐺', '☘️'];
const CATEGORIES_JOUEUR = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U18', 'U20', 'Senior', 'Vétéran'];
const CATEGORIES_PARENT = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U18', 'U20', 'Senior'];

const C = {
  bg: '#0D0D0D', card: '#141414', card2: '#1A1A1A',
  lilac: '#B794F4', lilacDim: 'rgba(183,148,244,0.12)', lilacBorder: 'rgba(183,148,244,0.2)',
  gold: '#D4AF37', goldDim: 'rgba(212,175,55,0.12)',
  text: '#fff', muted: '#555', border: 'rgba(255,255,255,0.06)',
  green: '#4ADE80', red: '#F87171',
};

function generateCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

const inp = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(183,148,244,0.2)', background: '#0A0A0A', color: '#fff', fontSize: 15, fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s' };
const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#B794F4', marginBottom: 8, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 };

function getCategorieLabel(profile) {
  if (!profile) return '';
  if (profile.is_child) return profile.categorie || '';
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
  const [mesGroupes, setMesGroupes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const categories = role === 'joueur' ? CATEGORIES_JOUEUR : CATEGORIES_PARENT;

  useEffect(() => {
    if (section === 'groupe') loadMesGroupes();
  }, [section]);

  const loadMesGroupes = async () => {
    const { data } = await supabase.from('groupe_membres').select('*').eq('user_id', userId);
    if (data) setMesGroupes(data);
  };

  const showMsg = (text, isError = false) => {
    if (isError) setError(text); else setMsg(text);
    setTimeout(() => { setMsg(null); setError(null); }, 3000);
  };

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
    // Ajouter dans groupe_membres
    await supabase.from('groupe_membres').upsert({ user_id: userId, groupe_code: code, groupe_nom: groupeNom }, { onConflict: 'user_id,groupe_code' });
    setLoading(false);
    showMsg(`Groupe créé ! Code : ${code} ✅`);
    setGroupeAction('');
    loadMesGroupes();
  };

  const joinGroupe = async () => {
    if (joinCode.length < 6) return;
    setLoading(true);
    const { data: groupe, error: gErr } = await supabase.from('groupes').select('*').eq('code', joinCode.toUpperCase()).single();
    if (gErr || !groupe) { showMsg('Code invalide — vérifie et réessaie', true); setLoading(false); return; }
    const { error } = await supabase.from('groupe_membres').upsert({ user_id: userId, groupe_code: groupe.code, groupe_nom: groupe.nom }, { onConflict: 'user_id,groupe_code' });
    setLoading(false);
    if (error) showMsg(error.message, true);
    else { showMsg(`"${groupe.nom}" rejoint ✅`); setJoinCode(''); setGroupeAction(''); loadMesGroupes(); }
  };

  const leaveGroupe = async (code) => {
    setLoading(true);
    await supabase.from('groupe_membres').delete().eq('user_id', userId).eq('groupe_code', code);
    setLoading(false);
    showMsg('Groupe quitté');
    loadMesGroupes();
  };

  const btnStyle = (active) => ({
    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #B794F4, #9B6FD4)', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed',
    opacity: active ? 1 : 0.5, fontFamily: "'Outfit', sans-serif",
    boxShadow: active ? '0 4px 16px rgba(183,148,244,0.4)' : 'none',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 480, background: '#141414', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(183,148,244,0.15)', borderBottom: 'none' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#333', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {section !== 'main' && <button onClick={() => { setSection('main'); setGroupeAction(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.muted }}>←</button>}
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
              {section === 'main' && '⚙️ Paramètres'}
              {section === 'profil' && 'Modifier le profil'}
              {section === 'groupe' && 'Mes groupes'}
              {section === 'password' && 'Mot de passe'}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#2A2A2A', border: 'none', cursor: 'pointer', fontSize: 14, color: C.muted }}>✕</button>
        </div>

        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: C.green, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>{msg}</div>}
        {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: C.red, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {section === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '👤', label: 'Modifier le profil', sub: `${profile.pseudo} · ${getCategorieLabel(profile)}`, action: () => setSection('profil') },
              { icon: '👥', label: 'Mes groupes', sub: 'Créer ou rejoindre des groupes', action: () => setSection('groupe') },
              { icon: '🔑', label: 'Mot de passe', sub: 'Changer ton mot de passe', action: () => setSection('password') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: '#1A1A1A', border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ fontSize: 22, width: 42, height: 42, borderRadius: 12, background: C.lilacDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                </div>
                <div style={{ color: '#333', fontSize: 18 }}>›</div>
              </button>
            ))}

            {/* WhatsApp dans les paramètres */}
            <a href="https://wa.me/33760163497?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20l%27app%20Hoop%20Prono%20CSLR%20!" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: '#1A1A1A', border: '1px solid rgba(37,211,102,0.2)', textDecoration: 'none' }}>
              <div style={{ fontSize: 22, width: 42, height: 42, borderRadius: 12, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Aide & Feedback</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Nous contacter sur WhatsApp</div>
              </div>
              <div style={{ color: '#25D366', fontSize: 18 }}>›</div>
            </a>

            <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 4 }}>
              <div style={{ fontSize: 22, width: 42, height: 42, borderRadius: 12, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🚪</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.red }}>Se déconnecter</div></div>
            </button>
          </div>
        )}

        {section === 'profil' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>AVATAR</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {AVATARS.map(av => <button key={av} type="button" onClick={() => setAvatar(av)} style={{ padding: '10px', borderRadius: 12, fontSize: 22, cursor: 'pointer', border: avatar === av ? `2px solid ${C.lilac}` : `1px solid ${C.border}`, background: avatar === av ? C.lilacDim : '#1A1A1A' }}>{av}</button>)}
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
                  <button key={v} type="button" onClick={() => { setRole(v); setCategorie(''); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${role === v ? C.lilac : C.border}`, background: role === v ? C.lilacDim : '#1A1A1A', color: role === v ? C.lilac : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>{role === 'joueur' ? 'MA CATÉGORIE' : 'CATÉGORIE DE MON ENFANT'}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(cat => <button key={cat} type="button" onClick={() => setCategorie(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${categorie === cat ? C.lilac : C.border}`, background: categorie === cat ? C.lilacDim : '#1A1A1A', color: categorie === cat ? C.lilac : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>)}
              </div>
            </div>
            <button onClick={saveProfil} disabled={loading} style={btnStyle(!loading)}>{loading ? 'Enregistrement...' : 'Mettre à jour'}</button>
          </div>
        )}

        {section === 'groupe' && (
          <div>
            {/* Mes groupes existants */}
            {mesGroupes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.lilac, fontFamily: "'Space Mono', monospace", marginBottom: 10, letterSpacing: 0.5 }}>MES GROUPES ({mesGroupes.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mesGroupes.map(g => (
                    <div key={g.groupe_code} style={{ background: '#1A1A1A', borderRadius: 14, padding: '12px 14px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{g.groupe_nom}</div>
                        <div style={{ fontSize: 12, color: '#444', letterSpacing: 2, fontFamily: "'Space Mono', monospace", marginTop: 2 }}>{g.groupe_code}</div>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(`Rejoins mon groupe sur Hoop Prono CSLR ! 🏀\nCode : ${g.groupe_code}\nhttps://hoop-prono.vercel.app`)} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: C.lilacDim, color: C.lilac, fontSize: 12, cursor: 'pointer' }}>📤</button>
                      <button onClick={() => leaveGroupe(g.groupe_code)} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: 'rgba(248,113,113,0.1)', color: C.red, fontSize: 11, cursor: 'pointer' }}>Quitter</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!groupeAction && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setGroupeAction('create')} style={{ padding: '16px', borderRadius: 16, border: `1px solid ${C.border}`, background: '#1A1A1A', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>➕</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Créer un nouveau groupe</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Génère un code unique à partager</div>
                </button>
                <button onClick={() => setGroupeAction('join')} style={{ padding: '16px', borderRadius: 16, border: `1px solid ${C.border}`, background: '#1A1A1A', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>🔗</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Rejoindre un groupe</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Entre le code reçu par un ami</div>
                </button>
              </div>
            )}

            {groupeAction === 'create' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>NOM DU GROUPE</label>
                  <input type="text" value={groupeNom} onChange={e => setGroupeNom(e.target.value)} maxLength={30} style={inp} placeholder="Ex: Seniors CSLR, Les parents U13..." />
                </div>
                <button onClick={createGroupe} disabled={loading || !groupeNom} style={btnStyle(!loading && !!groupeNom)}>{loading ? 'Création...' : 'Créer le groupe'}</button>
                <button onClick={() => setGroupeAction('')} style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 12, border: 'none', background: 'transparent', color: C.muted, fontSize: 13, cursor: 'pointer' }}>← Retour</button>
              </div>
            )}

            {groupeAction === 'join' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>CODE DU GROUPE</label>
                  <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inp, letterSpacing: 4, fontFamily: "'Space Mono', monospace", fontSize: 20, textAlign: 'center' }} placeholder="XXXXXX" />
                </div>
                <button onClick={joinGroupe} disabled={loading || joinCode.length < 6} style={btnStyle(!loading && joinCode.length >= 6)}>{loading ? 'Vérification...' : 'Rejoindre'}</button>
                <button onClick={() => setGroupeAction('')} style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 12, border: 'none', background: 'transparent', color: C.muted, fontSize: 13, cursor: 'pointer' }}>← Retour</button>
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
            <button onClick={savePassword} disabled={loading} style={btnStyle(!loading)}>{loading ? 'Mise à jour...' : 'Changer le mot de passe'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE PROFIL ──
export default function Profile({ userId, existingProfile, allProfiles, onProfileCreated, onProfileUpdated, onChildAdded, showSettings, onCloseSettings, onSignOut }) {
  const [pronos, setPronos] = useState([]);
  const [nbaGames, setNbaGames] = useState({});
  const [loading, setLoading] = useState(true);
  // Création
  const [pseudo, setPseudo] = useState('');
  const [avatar, setAvatar] = useState('🏀');
  const [role, setRole] = useState('joueur');
  const [categorie, setCategorie] = useState('');
  const [prenom, setPrenom] = useState('');
  const [enfants, setEnfants] = useState([]); // [{prenom, categorie}]
  const [groupeStep, setGroupeStep] = useState('choice');
  const [groupeNom, setGroupeNom] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childPrenom, setChildPrenom] = useState('');
  const [childCategorie, setChildCategorie] = useState('');
  const [childAvatar, setChildAvatar] = useState('⭐');

  const isCreating = !existingProfile;
  const categories = role === 'joueur' ? CATEGORIES_JOUEUR : CATEGORIES_PARENT;

  useEffect(() => {
    if (existingProfile) {
      loadAll();
      const channel = supabase.channel(`pronos-${existingProfile.id}-${Date.now()}`)
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
    if (role === 'joueur' && !categorie) { setError('Choisis ta catégorie'); return; }
    if (role === 'parent' && enfants.length === 0) { setError('Ajoute au moins un enfant'); return; }
    setSaveLoading(true); setError(null);
    try {
      let finalGroupeCode = null, finalGroupeNom = null;
      if (groupeStep === 'create' && groupeNom) {
        const code = generateCode();
        await supabase.from('groupes').insert([{ code, nom: groupeNom, created_by: userId }]);
        await supabase.from('groupe_membres').upsert({ user_id: userId, groupe_code: code, groupe_nom: groupeNom }, { onConflict: 'user_id,groupe_code' });
        finalGroupeCode = code; finalGroupeNom = groupeNom;
      } else if (groupeStep === 'join' && joinCode) {
        const { data: groupe } = await supabase.from('groupes').select('*').eq('code', joinCode.toUpperCase()).single();
        if (!groupe) throw new Error('Code de groupe invalide');
        await supabase.from('groupe_membres').upsert({ user_id: userId, groupe_code: groupe.code, groupe_nom: groupe.nom }, { onConflict: 'user_id,groupe_code' });
        finalGroupeCode = groupe.code; finalGroupeNom = groupe.nom;
      }

      const { data, error } = await supabase.from('profiles').upsert({
        id: userId, pseudo: pseudo || prenom, prenom, avatar, role, categorie, points: 0,
        groupe_code: finalGroupeCode, groupe_nom: finalGroupeNom, is_child: false,
      }).select().single();
      if (error) throw error;

      // Créer les profils enfants
      for (const enfant of enfants) {
        await supabase.from('profiles').insert({
          pseudo: enfant.prenom, prenom: enfant.prenom, avatar: enfant.avatar || '⭐',
          role: 'joueur', categorie: enfant.categorie, points: 0,
          parent_id: userId, is_child: true,
        });
      }

      onProfileCreated?.(data);
    } catch (err) { setError(err.message); }
    finally { setSaveLoading(false); }
  };

  const addChildProfile = async () => {
    if (!childPrenom || !childCategorie) return;
    setChildLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').insert({
        pseudo: childPrenom, prenom: childPrenom, avatar: childAvatar,
        role: 'joueur', categorie: childCategorie, points: 0,
        parent_id: userId, is_child: true,
      }).select().single();
      if (error) throw error;
      if (data) {
        onChildAdded?.(data);
        setShowAddChild(false);
        setChildPrenom(''); setChildCategorie(''); setChildAvatar('⭐');
      }
    } catch (err) {
      console.error('Erreur ajout enfant:', err.message);
    } finally {
      setChildLoading(false);
    }
  };

  // Stats — uniquement les pronos sur matchs terminés
  const submitted = pronos.filter(p => p.submitted);
  const finished = submitted.filter(p => {
    const game = nbaGames[p.nba_serie_id];
    return game?.status === 'finished';
  });
  const correct = finished.filter(p => p.points_gagnes > 0);
  const pct = finished.length > 0 ? Math.round((correct.length / finished.length) * 100) : 0;
  const last5 = submitted.slice(0, 5);
  const pending = submitted.filter(p => {
    const game = nbaGames[p.nba_serie_id];
    return game?.status !== 'finished';
  });

  const btnStyle = (active) => ({ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #B794F4, #9B6FD4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed', opacity: active ? 1 : 0.5, fontFamily: "'Outfit', sans-serif", boxShadow: active ? '0 4px 20px rgba(183,148,244,0.4)' : 'none' });

  // ── CRÉATION ──
  if (isCreating) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Outfit', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap'); input:focus { outline: none; border-color: #B794F4 !important; }`}</style>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#141414', border: '2px solid rgba(183,148,244,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', overflow: 'hidden' }}>
              <img src="/logo-cslr.png" alt="CSLR" style={{ width: '85%', height: '85%', objectFit: 'contain' }} onError={e => { e.target.style.display='none'; }} />
            </div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: C.lilac, fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>CERCLE SPORTIF LILAS ROMAINVILLE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>Crée ton profil</div>
          </div>
          <div style={{ background: '#141414', borderRadius: 24, padding: '24px', border: '1px solid rgba(183,148,244,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>AVATAR</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {AVATARS.map(av => <button key={av} type="button" onClick={() => setAvatar(av)} style={{ padding: '10px', borderRadius: 12, fontSize: 22, cursor: 'pointer', border: avatar === av ? `2px solid ${C.lilac}` : `1px solid ${C.border}`, background: avatar === av ? C.lilacDim : '#1A1A1A' }}>{av}</button>)}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>TON PRÉNOM</label>
                <input type="text" value={prenom} onChange={e => { setPrenom(e.target.value); setPseudo(e.target.value); }} required maxLength={20} style={inp} placeholder="Comment on t'appelle ?" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>JE SUIS</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['joueur', '🏀 Joueur'], ['parent', '👨‍👩‍👧 Parent']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => { setRole(v); setCategorie(''); setEnfants([]); }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${role === v ? C.lilac : C.border}`, background: role === v ? C.lilacDim : '#1A1A1A', color: role === v ? C.lilac : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{l}</button>
                  ))}
                </div>
              </div>

              {role === 'joueur' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>MA CATÉGORIE</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES_JOUEUR.map(cat => <button key={cat} type="button" onClick={() => setCategorie(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${categorie === cat ? C.lilac : C.border}`, background: categorie === cat ? C.lilacDim : '#1A1A1A', color: categorie === cat ? C.lilac : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>)}
                  </div>
                </div>
              )}

              {role === 'parent' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>MES ENFANTS AU CLUB</label>
                  {enfants.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1A1A1A', borderRadius: 12, padding: '10px 12px', marginBottom: 8, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 18 }}>{e.avatar || '⭐'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{e.prenom}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace" }}>{e.categorie}</div>
                      </div>
                      <button type="button" onClick={() => setEnfants(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ background: '#1A1A1A', borderRadius: 14, padding: '14px', border: `1px dashed ${C.lilacBorder}` }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Ajouter un enfant</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input type="text" value={childPrenom} onChange={e => setChildPrenom(e.target.value)} maxLength={20} style={{ ...inp, flex: 1, padding: '9px 12px', fontSize: 13 }} placeholder="Prénom" />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {CATEGORIES_PARENT.map(cat => <button key={cat} type="button" onClick={() => setChildCategorie(cat)} style={{ padding: '6px 12px', borderRadius: 16, border: `2px solid ${childCategorie === cat ? C.lilac : C.border}`, background: childCategorie === cat ? C.lilacDim : '#141414', color: childCategorie === cat ? C.lilac : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>)}
                    </div>
                    <button type="button" disabled={!childPrenom || !childCategorie} onClick={() => { if (childPrenom && childCategorie) { setEnfants(prev => [...prev, { prenom: childPrenom, categorie: childCategorie, avatar: '⭐' }]); setChildPrenom(''); setChildCategorie(''); } }} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: childPrenom && childCategorie ? C.lilacDim : '#0A0A0A', color: childPrenom && childCategorie ? C.lilac : C.muted, fontSize: 13, fontWeight: 700, cursor: childPrenom && childCategorie ? 'pointer' : 'not-allowed', fontFamily: "'Outfit', sans-serif" }}>
                      + Ajouter cet enfant
                    </button>
                  </div>
                  {/* Catégorie du parent lui-même */}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ ...lbl, marginBottom: 8 }}>TA CATÉGORIE (optionnel)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {CATEGORIES_PARENT.map(cat => <button key={cat} type="button" onClick={() => setCategorie(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${categorie === cat ? C.lilac : C.border}`, background: categorie === cat ? C.lilacDim : '#1A1A1A', color: categorie === cat ? C.lilac : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>GROUPE (optionnel)</label>
                {groupeStep === 'choice' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setGroupeStep('create')} style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#1A1A1A', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>➕ Créer</button>
                    <button type="button" onClick={() => setGroupeStep('join')} style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#1A1A1A', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>🔗 Rejoindre</button>
                  </div>
                )}
                {groupeStep === 'create' && (
                  <div>
                    <input type="text" value={groupeNom} onChange={e => setGroupeNom(e.target.value)} maxLength={30} style={inp} placeholder="Nom du groupe" />
                    <button type="button" onClick={() => setGroupeStep('choice')} style={{ marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>← Retour</button>
                  </div>
                )}
                {groupeStep === 'join' && (
                  <div>
                    <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inp, letterSpacing: 4, fontFamily: "'Space Mono', monospace", fontSize: 20, textAlign: 'center' }} placeholder="XXXXXX" />
                    <button type="button" onClick={() => setGroupeStep('choice')} style={{ marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>← Retour</button>
                  </div>
                )}
              </div>

              {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button type="submit" disabled={saveLoading} style={btnStyle(!saveLoading)}>
                {saveLoading ? 'Enregistrement...' : "C'est parti 🏀"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── PAGE PROFIL ──
  const isChild = existingProfile.is_child;
  const childProfiles = allProfiles?.filter(p => p.is_child) || [];

  return (
    <div style={{ padding: '0 14px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Card identité */}
      <div style={{ background: 'linear-gradient(135deg, #1A1428, #12102A)', borderRadius: 22, padding: '20px', marginBottom: 12, border: '1px solid rgba(183,148,244,0.25)', boxShadow: '0 4px 24px rgba(183,148,244,0.1)', animation: 'slideUp 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.lilacDim, border: `2px solid ${C.lilacBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{existingProfile.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{existingProfile.prenom || existingProfile.pseudo}</div>
            <div style={{ fontSize: 11, color: C.lilac, fontFamily: "'Space Mono', monospace", marginTop: 3 }}>{getCategorieLabel(existingProfile)}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: C.lilac, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>TOTAL</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{existingProfile.points || 0}</div>
            <div style={{ fontSize: 9, color: '#444', fontFamily: "'Space Mono', monospace" }}>pts</div>
          </div>
        </div>
      </div>

      {/* Stats — % uniquement sur matchs terminés */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'PRONOS', value: submitted.length, sub: `${pending.length} en attente`, icon: '✏️' },
          { label: 'RÉUSSIS', value: correct.length, sub: `sur ${finished.length} terminés`, icon: '✅' },
          { label: 'RÉUSSITE', value: finished.length > 0 ? `${pct}%` : '—', sub: 'matchs joués', icon: '📊' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: `1px solid ${C.border}`, animation: `slideUp 0.3s ease ${0.05 + i * 0.05}s both` }}>
            <div style={{ fontSize: 18, marginBottom: 5 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace", marginTop: 3, lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: 8, color: '#333', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Ajouter un profil enfant (pour les parents) */}
      {existingProfile.role === 'parent' && !isChild && (
        <div style={{ marginBottom: 12 }}>
          {!showAddChild ? (
            <button onClick={() => setShowAddChild(true)} style={{ width: '100%', padding: '12px', borderRadius: 14, border: `1px dashed ${C.lilacBorder}`, background: C.lilacDim, color: C.lilac, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
              + Ajouter un profil enfant
            </button>
          ) : (
            <div style={{ background: C.card, borderRadius: 16, padding: '16px', border: `1px solid ${C.lilacBorder}`, animation: 'slideUp 0.3s ease' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Nouveau profil enfant</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 10 }}>
                  {AVATARS.map(av => <button key={av} type="button" onClick={() => setChildAvatar(av)} style={{ padding: '8px', borderRadius: 10, fontSize: 20, cursor: 'pointer', border: childAvatar === av ? `2px solid ${C.lilac}` : `1px solid ${C.border}`, background: childAvatar === av ? C.lilacDim : '#1A1A1A' }}>{av}</button>)}
                </div>
                <input type="text" value={childPrenom} onChange={e => setChildPrenom(e.target.value)} maxLength={20} style={{ ...inp, marginBottom: 10 }} placeholder="Prénom de l'enfant" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {CATEGORIES_PARENT.map(cat => <button key={cat} type="button" onClick={() => setChildCategorie(cat)} style={{ padding: '7px 12px', borderRadius: 16, border: `2px solid ${childCategorie === cat ? C.lilac : C.border}`, background: childCategorie === cat ? C.lilacDim : '#1A1A1A', color: childCategorie === cat ? C.lilac : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{cat}</button>)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addChildProfile} disabled={!childPrenom || !childCategorie || childLoading} style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: childPrenom && childCategorie ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : '#1A1A1A', color: childPrenom && childCategorie ? '#fff' : C.muted, fontSize: 13, fontWeight: 700, cursor: childPrenom && childCategorie ? 'pointer' : 'not-allowed', fontFamily: "'Outfit', sans-serif" }}>
                    {childLoading ? 'Création...' : 'Créer le profil'}
                  </button>
                  <button onClick={() => { setShowAddChild(false); setChildPrenom(''); setChildCategorie(''); setChildAvatar('⭐'); }} style={{ padding: '11px 14px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#1A1A1A', color: C.muted, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5 derniers pronos */}
      {submitted.length > 0 ? (
        <div style={{ background: C.card, borderRadius: 18, padding: '14px 16px', border: `1px solid ${C.border}`, animation: 'slideUp 0.3s ease 0.18s both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.lilac, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>5 DERNIERS PRONOS</div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace" }}>Temps réel</div>
          </div>
          {last5.map((p, i) => {
            const game = nbaGames[p.nba_serie_id];
            const isFinished = game?.status === 'finished';
            const winnerLabel = game ? (p.vainqueur === 'home' ? game.home_name : game.away_name) : (p.vainqueur === 'home' ? 'Domicile' : 'Extérieur');
            const serieLabel = game ? `${game.home_name?.split(' ').pop()} vs ${game.away_name?.split(' ').pop()}` : '';
            const icon = !isFinished ? '⏳' : p.points_gagnes > 0 ? '✅' : '❌';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < last5.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontSize: 15, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{winnerLabel}</div>
                  <div style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace", marginTop: 1 }}>{serieLabel}{game ? ` · Game ${game.game_num}` : ''}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.points_gagnes > 0 ? C.green : isFinished ? C.red : C.muted, fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                  {p.points_gagnes > 0 ? `+${p.points_gagnes}` : isFinished ? '0' : '?'} pts
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, animation: 'slideUp 0.3s ease 0.15s both' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏀</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Aucun prono pour l'instant</div>
          <div style={{ fontSize: 13, color: C.muted }}>Va sur NBA pour commencer !</div>
        </div>
      )}

      {showSettings && <SettingsModal profile={existingProfile} userId={userId} onClose={onCloseSettings} onUpdate={data => onProfileUpdated?.(data)} onSignOut={onSignOut} />}
    </div>
  );
}
