import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const NBA_LOGOS = {
  BOS: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg',
  PHI: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg',
  NYK: 'https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg',
  ATL: 'https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg',
  CLE: 'https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg',
  TOR: 'https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg',
  DET: 'https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg',
  ORL: 'https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg',
  OKC: 'https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg',
  PHX: 'https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg',
  SAS: 'https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg',
  POR: 'https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg',
  DEN: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg',
  MIN: 'https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg',
  LAL: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg',
  HOU: 'https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg',
};

const SERIES_ORDER_R1 = ['BOS_PHI', 'NYK_ATL', 'CLE_TOR', 'DET_ORL', 'OKC_PHX', 'SAS_POR', 'DEN_MIN', 'LAL_HOU'];
const SERIES_ORDER_R2 = ['NYK_PHI', 'DET_CLE', 'SAS_MIN', 'OKC_LAL'];
const SERIES_ORDER = [...SERIES_ORDER_R2, ...SERIES_ORDER_R1];
const SERIES_CONF = {
  BOS_PHI: 'EST', NYK_ATL: 'EST', CLE_TOR: 'EST', DET_ORL: 'EST',
  OKC_PHX: 'OUEST', SAS_POR: 'OUEST', DEN_MIN: 'OUEST', LAL_HOU: 'OUEST',
  // Demi-finales
  NYK_PHI: 'EST', DET_CLE: 'EST', SAS_MIN: 'OUEST', OKC_LAL: 'OUEST',
};

// Couleurs CSLR
const C = {
  bg: '#0D0D0D',
  card: '#141414',
  card2: '#1A1A1A',
  lilac: '#B794F4',
  lilacDim: 'rgba(183,148,244,0.15)',
  lilacBorder: 'rgba(183,148,244,0.2)',
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.15)',
  text: '#fff',
  muted: '#555',
  border: 'rgba(255,255,255,0.06)',
  red: '#F87171',
  green: '#4ADE80',
};

function TeamLogo({ abbr, size = 52 }) {
  const [err, setErr] = useState(false);
  const FALLBACK = { BOS:'☘️',PHI:'🔔',NYK:'🗽',ATL:'🦅',CLE:'⚔️',TOR:'🦕',DET:'⚙️',ORL:'✨',OKC:'⚡',PHX:'☀️',SAS:'🤠',POR:'🌲',DEN:'⛰️',MIN:'🐺',LAL:'💜',HOU:'🚀' };
  if (err || !NBA_LOGOS[abbr]) return <div style={{ fontSize: size * 0.55, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{FALLBACK[abbr] || '🏀'}</div>;
  return <img src={NBA_LOGOS[abbr]} alt={abbr} width={size} height={size} onError={() => setErr(true)} style={{ objectFit: 'contain', display: 'block' }} />;
}

export default function Matches({ profile }) {
  const [games, setGames] = useState([]);
  const [pronos, setPronos] = useState({});
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [confFilter, setConfFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(loadAll, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadAll = async () => {
    await Promise.all([loadGames(), loadPronos()]);
    setLoading(false);
  };

  const loadGames = async () => {
    const { data } = await supabase.from('nba_games').select('*').order('game_date', { ascending: true });
    if (data) setGames(data);
  };

  const loadPronos = async () => {
    const { data } = await supabase.from('pronostics').select('*').eq('user_id', profile.id);
    if (data) {
      const map = {};
      data.forEach(p => { if (p.nba_serie_id) map[p.nba_serie_id] = p; });
      setPronos(map);
    }
  };

  const handlePick = (gameId, pick) => {
    if (pronos[gameId]?.submitted) return;
    setPronos(prev => ({ ...prev, [gameId]: { ...prev[gameId], vainqueur: pick } }));
  };

  const submitProno = async (gameId, game) => {
    const prono = pronos[gameId];
    if (!prono?.vainqueur) { showToast("Choisis une équipe !", 'error'); return; }
    const { error } = await supabase.from('pronostics').upsert({
      user_id: profile.id, nba_serie_id: gameId,
      vainqueur: prono.vainqueur, submitted: true,
    }, { onConflict: 'user_id,nba_serie_id' });
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast('Prono validé ! 🎯');
    loadAll();
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const bySerieId = {};
  games.forEach(g => {
    if (!bySerieId[g.serie_id]) bySerieId[g.serie_id] = [];
    bySerieId[g.serie_id].push(g);
  });

  const seriesData = SERIES_ORDER.map(sid => {
    const serieGames = (bySerieId[sid] || []).sort((a, b) => a.game_num - b.game_num);
    const finished = serieGames.filter(g => g.status === 'finished');
    const upcoming = serieGames.filter(g => g.status === 'upcoming' || g.status === 'scheduled');
    const live = serieGames.find(g => g.status === 'inprogress');
    const lastFinished = finished[finished.length - 1] || null;
    const nextGame = live || upcoming[0] || null;
    const isEliminated = finished.length > 0 && !nextGame && !live;
    const record = lastFinished?.serie_record || '';
    return { sid, conf: SERIES_CONF[sid], lastFinished, nextGame, live: !!live, isEliminated, record, nextDate: nextGame?.game_date || null };
  });

  const finishedGames = games
    .filter(g => g.status === 'finished')
    .filter(g => confFilter === 'all' || SERIES_CONF[g.serie_id] === confFilter)
    .sort((a, b) => new Date(b.game_date) - new Date(a.game_date));

  const activeSeries = seriesData
    .filter(s => !s.isEliminated)
    .filter(s => confFilter === 'all' || s.conf === confFilter)
    .sort((a, b) => {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return new Date(a.nextDate) - new Date(b.nextDate);
    });

  const upcomingCount = seriesData.filter(s => !s.isEliminated).length;
  const finishedCount = finishedGames.length;
  const activeGameIds = activeSeries.map(s => s.nextGame?.id).filter(Boolean);
  const totalPronos = activeGameIds.filter(id => pronos[id]?.submitted).length;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: C.muted, fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>;

  return (
    <div style={{ padding: '0 16px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1420, #141414)',
        borderRadius: 20, padding: '16px 20px', marginBottom: 16,
        border: '1px solid rgba(183,148,244,0.2)',
        boxShadow: '0 4px 24px rgba(183,148,244,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: C.lilac, fontFamily: "'Space Mono', monospace", letterSpacing: 1, marginBottom: 4 }}>NBA · PLAYOFFS 2026 · 1ER TOUR</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
              {statusFilter === 'upcoming' ? 'Prochain match de chaque série' : 'Historique des résultats'}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontFamily: "'Space Mono', monospace" }}>
              {totalPronos}/{upcomingCount} pronos posés · 100 pts par bon prono
            </div>
          </div>
          <div style={{ fontSize: 30 }}>🏆</div>
        </div>
        <div style={{ marginTop: 12, height: 3, background: 'rgba(183,148,244,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #B794F4, #D4AF37)', width: `${Math.min((totalPronos / Math.max(upcomingCount,1)) * 100, 100)}%`, transition: 'width .6s ease' }} />
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', background: '#141414', borderRadius: 14, padding: 4, marginBottom: 14, border: `1px solid ${C.border}` }}>
        {[['upcoming', `⏳ En cours (${upcomingCount})`], ['finished', `✅ Résultats (${finishedCount})`]].map(([id, label]) => (
          <button key={id} onClick={() => setStatusFilter(id)} style={{
            flex: 1, padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: statusFilter === id ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent',
            color: statusFilter === id ? '#fff' : C.muted,
            boxShadow: statusFilter === id ? '0 4px 12px rgba(183,148,244,0.4)' : 'none',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Conf filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', 'Toutes'], ['EST', '🏀 Est'], ['OUEST', '⚡ Ouest']].map(([id, label]) => (
          <button key={id} onClick={() => setConfFilter(id)} style={{
            flex: 1, padding: '8px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: confFilter === id ? C.goldDim : '#141414',
            color: confFilter === id ? C.gold : C.muted,
            border: confFilter === id ? `1px solid ${C.gold}44` : `1px solid ${C.border}`,
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── EN COURS ── */}
      {statusFilter === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeSeries.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <div style={{ fontSize: 15, color: C.muted }}>Aucune série active</div>
            </div>
          )}
          {activeSeries.map(({ sid, conf, lastFinished, nextGame, live, record }, si) => {
            const activeGameId = nextGame?.id;
            const prono = pronos[activeGameId];
            const isSubmitted = prono?.submitted;
            const lastWinner = lastFinished ? (lastFinished.home_score > lastFinished.away_score ? lastFinished.home : lastFinished.away) : null;
            const lastProno = lastFinished ? pronos[lastFinished.id] : null;
            const lastPronoCorrect = lastProno?.submitted && lastProno.points_gagnes > 0;
			const lastPronoWrong = lastProno?.submitted && lastProno.points_gagnes === 0 && lastProno.points_gagnes !== null;
            const nextHome = nextGame?.home;
            const nextAway = nextGame?.away;

            return (
              <div key={sid} style={{
                background: C.card, borderRadius: 22, overflow: 'hidden',
                border: `1px solid ${C.border}`,
                boxShadow: live ? `0 0 24px rgba(248,113,113,0.15)` : '0 2px 12px rgba(0,0,0,0.3)',
                animation: `slideUp 0.35s ease ${si * 0.05}s both`,
              }}>
                {/* Header */}
                <div style={{ padding: '11px 16px', background: '#1A1A1A', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: conf === 'EST' ? '#60A5FA' : C.gold,
                      background: conf === 'EST' ? 'rgba(96,165,250,0.1)' : C.goldDim,
                      padding: '3px 8px', borderRadius: 6, fontFamily: "'Space Mono', monospace",
                      border: conf === 'EST' ? '1px solid rgba(96,165,250,0.2)' : `1px solid ${C.gold}33`,
                    }}>{conf}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TeamLogo abbr={lastFinished?.home || nextGame?.home} size={18} />
                      <span style={{ fontSize: 10, color: C.muted }}>vs</span>
                      <TeamLogo abbr={lastFinished?.away || nextGame?.away} size={18} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>
                      {(nextGame?.home_name || lastFinished?.home_name || '').split(' ').pop()} vs {(nextGame?.away_name || lastFinished?.away_name || '').split(' ').pop()}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'Space Mono', monospace" }}>{record}</div>
                </div>

                {/* Dernier résultat */}
                {lastFinished && (
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace", marginBottom: 8, letterSpacing: 1 }}>DERNIER RÉSULTAT — GAME {lastFinished.game_num}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <TeamLogo abbr={lastFinished.home} size={36} />
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{lastFinished.home}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, marginTop: 3, color: lastWinner === lastFinished.home ? C.green : '#333' }}>{lastFinished.home_score}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 10, color: '#333' }}>—</div>
                        {lastPronoCorrect && <div style={{ fontSize: 16 }}>✅</div>}
                        {lastPronoWrong && <div style={{ fontSize: 16 }}>❌</div>}
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <TeamLogo abbr={lastFinished.away} size={36} />
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{lastFinished.away}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, marginTop: 3, color: lastWinner === lastFinished.away ? C.green : '#333' }}>{lastFinished.away_score}</div>
                      </div>
                    </div>
                    {lastPronoCorrect && <div style={{ marginTop: 6, textAlign: 'center', fontSize: 11, color: C.green, fontWeight: 700 }}>Ton prono était bon ! +100 pts 🎉</div>}
                    {lastPronoWrong && <div style={{ marginTop: 6, textAlign: 'center', fontSize: 11, color: C.red, fontWeight: 700 }}>Raté sur ce match</div>}
                  </div>
                )}

                {/* Prochain match */}
                {nextGame && (
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: live ? C.red : C.lilac, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                        {live ? `🔴 EN DIRECT — GAME ${nextGame.game_num}` : `PROCHAIN — GAME ${nextGame.game_num}`}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                        {new Date(nextGame.game_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {nextGame.win_prob_home && !live && !isSubmitted && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', background: '#1A1A1A' }}>
                          <div style={{ width: `${nextGame.win_prob_home}%`, background: 'linear-gradient(90deg, #B794F4, #9B6FD4)' }} />
                          <div style={{ flex: 1, background: '#2A2A2A' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace" }}>{nextHome} {nextGame.win_prob_home}%</span>
                          <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace" }}>{nextAway} {nextGame.win_prob_away}%</span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      {['home', 'away'].map(side => {
                        const abbr = side === 'home' ? nextHome : nextAway;
                        const name = side === 'home' ? nextGame.home_name : nextGame.away_name;
                        const picked = prono?.vainqueur === side;
                        return (
                          <button key={side}
                            onClick={() => !live && !isSubmitted && handlePick(activeGameId, side)}
                            disabled={live || isSubmitted}
                            style={{
                              flex: 1, padding: '14px 8px', borderRadius: 16, textAlign: 'center',
                              border: picked ? `2px solid ${C.lilac}` : `1px solid ${C.border}`,
                              background: picked ? 'linear-gradient(135deg, #1A1428, #12102A)' : '#1A1A1A',
                              cursor: live || isSubmitted ? 'default' : 'pointer',
                              boxShadow: picked ? `0 0 20px rgba(183,148,244,0.2)` : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                              <TeamLogo abbr={abbr} size={44} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: picked ? C.lilac : C.text }}>{name}</div>
                            <div style={{ fontSize: 9, color: picked ? `${C.lilac}88` : C.muted, marginTop: 3, fontFamily: "'Space Mono', monospace" }}>
                              {side === 'home' ? 'DOM' : 'EXT'}
                            </div>
                            {picked && !live && <div style={{ fontSize: 9, color: C.lilac, marginTop: 4, fontFamily: "'Space Mono', monospace" }}>✓ MON PRONO</div>}
                          </button>
                        );
                      })}
                    </div>

                    {!live && prono?.vainqueur && !isSubmitted && (
                      <button onClick={() => submitProno(activeGameId, nextGame)} style={{
                        width: '100%', marginTop: 10, padding: '13px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #B794F4, #9B6FD4)',
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        boxShadow: '0 4px 16px rgba(183,148,244,0.4)',
                      }}>🎯 Valider — 100 pts si correct !</button>
                    )}
                    {live && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: C.red, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>🔴 MATCH EN COURS — PRONOS FERMÉS</div>}
                    {isSubmitted && !live && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: C.green, fontWeight: 700 }}>Prono soumis ✅ — Résultat cette nuit !</div>}
                  </div>
                )}
                {!nextGame && <div style={{ padding: '14px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Prochain match bientôt annoncé...</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── RÉSULTATS ── */}
      {statusFilter === 'finished' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {finishedGames.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏀</div>
              <div style={{ fontSize: 15, color: C.muted }}>Aucun résultat pour l'instant</div>
            </div>
          )}
          {finishedGames.map((game, i) => {
            const prono = pronos[game.id];
            const winner = game.home_score > game.away_score ? 'home' : 'away';
            const hasProno = prono?.submitted;
            const correct = hasProno && prono.vainqueur === winner;
            const wrong = hasProno && prono.vainqueur !== winner;
            const conf = SERIES_CONF[game.serie_id];

            return (
              <div key={game.id} style={{
                background: C.card, borderRadius: 18, overflow: 'hidden',
                border: correct ? `1px solid ${C.green}44` : wrong ? `1px solid ${C.red}33` : `1px solid ${C.border}`,
                boxShadow: correct ? `0 2px 16px rgba(74,222,128,0.08)` : wrong ? `0 2px 16px rgba(248,113,113,0.06)` : '0 1px 8px rgba(0,0,0,0.2)',
                animation: `slideUp 0.3s ease ${i * 0.03}s both`,
              }}>
                <div style={{ padding: '10px 14px', background: '#1A1A1A', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: conf === 'EST' ? '#60A5FA' : C.gold, background: conf === 'EST' ? 'rgba(96,165,250,0.1)' : C.goldDim, padding: '2px 7px', borderRadius: 5, fontFamily: "'Space Mono', monospace" }}>{conf}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: "'Space Mono', monospace" }}>GAME {game.game_num}</div>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                    {new Date(game.game_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><TeamLogo abbr={game.home} size={38} /></div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>{game.home_name}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4, color: winner === 'home' ? C.green : '#333' }}>{game.home_score}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 52 }}>
                    <div style={{ fontSize: 10, color: '#333', fontFamily: "'Space Mono', monospace" }}>VS</div>
                    {correct && <div style={{ background: 'rgba(74,222,128,0.1)', borderRadius: 10, padding: '6px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18 }}>✅</div>
                      <div style={{ fontSize: 10, color: C.green, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>+100</div>
                    </div>}
                    {wrong && <div style={{ background: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: '6px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18 }}>❌</div>
                      <div style={{ fontSize: 10, color: C.red, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>0 pt</div>
                    </div>}
                    {!hasProno && <div style={{ background: '#1A1A1A', borderRadius: 10, padding: '6px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14 }}>—</div>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace" }}>pas de prono</div>
                    </div>}
                  </div>

                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><TeamLogo abbr={game.away} size={38} /></div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>{game.away_name}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4, color: winner === 'away' ? C.green : '#333' }}>{game.away_score}</div>
                  </div>
                </div>

                {hasProno && (
                  <div style={{ padding: '8px 16px', background: correct ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: correct ? C.green : C.red, fontWeight: 600 }}>
                      Tu avais pronostiqué : <strong>{prono.vainqueur === 'home' ? game.home_name : game.away_name}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? C.red : C.lilac,
          color: '#fff',
          padding: '12px 24px', borderRadius: 20, fontWeight: 700, fontSize: 14,
          fontFamily: "'Outfit', sans-serif", zIndex: 9999,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4)`, whiteSpace: 'nowrap',
          animation: 'slideUp 0.3s ease',
        }}>{toast.msg}</div>
      )}
    </div>
  );
}
