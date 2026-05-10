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

const SERIES_ORDER_R2 = ['NYK_PHI', 'DET_CLE', 'SAS_MIN', 'OKC_LAL'];
const SERIES_ORDER_R1 = ['BOS_PHI', 'NYK_ATL', 'CLE_TOR', 'DET_ORL', 'OKC_PHX', 'SAS_POR', 'DEN_MIN', 'LAL_HOU'];
const SERIES_ORDER = [...SERIES_ORDER_R2, ...SERIES_ORDER_R1];
const SERIES_CONF = {
  BOS_PHI: 'EST', NYK_ATL: 'EST', CLE_TOR: 'EST', DET_ORL: 'EST',
  OKC_PHX: 'OUEST', SAS_POR: 'OUEST', DEN_MIN: 'OUEST', LAL_HOU: 'OUEST',
  NYK_PHI: 'EST', DET_CLE: 'EST', SAS_MIN: 'OUEST', OKC_LAL: 'OUEST',
};
const SERIES_ROUND = { NYK_PHI: 2, DET_CLE: 2, SAS_MIN: 2, OKC_LAL: 2 };

const C = {
  bg: '#0D0D0D', card: '#141414', card2: '#1A1A1A',
  lilac: '#B794F4', lilacDim: 'rgba(183,148,244,0.12)', lilacBorder: 'rgba(183,148,244,0.2)',
  gold: '#D4AF37', goldDim: 'rgba(212,175,55,0.12)',
  text: '#fff', muted: '#555', border: 'rgba(255,255,255,0.06)',
  green: '#4ADE80', red: '#F87171',
};

function TeamLogo({ abbr, size = 52 }) {
  const [err, setErr] = useState(false);
  const FALLBACK = { BOS:'☘️',PHI:'🔔',NYK:'🗽',ATL:'🦅',CLE:'⚔️',TOR:'🦕',DET:'⚙️',ORL:'✨',OKC:'⚡',PHX:'☀️',SAS:'🤠',POR:'🌲',DEN:'⛰️',MIN:'🐺',LAL:'💜',HOU:'🚀' };
  if (err || !NBA_LOGOS[abbr]) return <div style={{ fontSize: size * 0.5, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{FALLBACK[abbr] || '🏀'}</div>;
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
    intervalRef.current = setInterval(loadGames, 60000); // refresh toutes les minutes
    return () => clearInterval(intervalRef.current);
  }, [profile.id]);

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

  const submitProno = async (gameId) => {
    const prono = pronos[gameId];
    if (!prono?.vainqueur) { showToast("Choisis une équipe !", 'error'); return; }
    const { error } = await supabase.from('pronostics').upsert({
      user_id: profile.id, nba_serie_id: gameId,
      vainqueur: prono.vainqueur, submitted: true,
    }, { onConflict: 'user_id,nba_serie_id' });
    if (error) { showToast('Erreur : ' + error.message, 'error'); return; }
    showToast('Prono validé ! 🎯');
    loadPronos();
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const now = new Date();

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
    const isR2 = SERIES_ROUND[sid] === 2;
    return { sid, conf: SERIES_CONF[sid], lastFinished, nextGame, live: !!live, isEliminated, record, nextDate: nextGame?.game_date || null, isR2 };
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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: C.muted, fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>;

  return (
    <div style={{ padding: '0 14px 100px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>

      {/* Banner compact */}
      <div style={{ background: 'linear-gradient(135deg, #1A1428, #141414)', borderRadius: 18, padding: '14px 16px', marginBottom: 14, border: '1px solid rgba(183,148,244,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: C.lilac, fontFamily: "'Space Mono', monospace", letterSpacing: 1, marginBottom: 3 }}>NBA · PLAYOFFS 2026</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{statusFilter === 'upcoming' ? 'Pronos à faire' : 'Mes résultats'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace" }}>{totalPronos}/{upcomingCount} pronos</div>
            <div style={{ marginTop: 6, width: 80, height: 3, background: 'rgba(183,148,244,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #B794F4, #D4AF37)', width: `${Math.min((totalPronos / Math.max(upcomingCount, 1)) * 100, 100)}%`, borderRadius: 2, transition: 'width .6s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', background: '#141414', borderRadius: 14, padding: 4, marginBottom: 12, border: `1px solid ${C.border}` }}>
        {[['upcoming', `⏳ À pronostiquer (${upcomingCount})`], ['finished', `✅ Résultats (${finishedCount})`]].map(([id, label]) => (
          <button key={id} onClick={() => setStatusFilter(id)} style={{
            flex: 1, padding: '9px 6px', borderRadius: 11, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: statusFilter === id ? 'linear-gradient(135deg, #B794F4, #9B6FD4)' : 'transparent',
            color: statusFilter === id ? '#fff' : C.muted,
            boxShadow: statusFilter === id ? '0 4px 12px rgba(183,148,244,0.4)' : 'none',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Filtre conf */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[['all', 'Toutes'], ['EST', '🏀 Est'], ['OUEST', '⚡ Ouest']].map(([id, label]) => (
          <button key={id} onClick={() => setConfFilter(id)} style={{
            flex: 1, padding: '7px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: confFilter === id ? C.goldDim : '#141414',
            color: confFilter === id ? C.gold : C.muted,
            border: confFilter === id ? `1px solid ${C.gold}44` : `1px solid ${C.border}`,
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── EN COURS / À PRONOSTIQUER ── */}
      {statusFilter === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeSeries.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <div style={{ fontSize: 15, color: C.muted }}>Aucune série active</div>
            </div>
          )}
          {activeSeries.map(({ sid, conf, lastFinished, nextGame, live, record, isR2 }, si) => {
            const activeGameId = nextGame?.id;
            const prono = pronos[activeGameId];
            const isSubmitted = prono?.submitted;
            const isPast = nextGame && new Date(nextGame.game_date) < now;
            const isBlocked = live || isSubmitted || isPast;

            const lastWinner = lastFinished ? (lastFinished.home_score > lastFinished.away_score ? lastFinished.home : lastFinished.away) : null;
            const lastProno = lastFinished ? pronos[lastFinished.id] : null;
            const lastPronoCorrect = lastProno?.submitted && lastProno.points_gagnes > 0;
            const lastPronoWrong = lastProno?.submitted && lastProno.points_gagnes === 0 && lastFinished?.status === 'finished';

            const nextHome = nextGame?.home;
            const nextAway = nextGame?.away;

            return (
              <div key={sid} style={{
                background: C.card, borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${live ? 'rgba(248,113,113,0.3)' : C.border}`,
                boxShadow: live ? '0 0 20px rgba(248,113,113,0.1)' : '0 2px 12px rgba(0,0,0,0.3)',
                animation: `slideUp 0.35s ease ${si * 0.05}s both`,
              }}>
                {/* Header série */}
                <div style={{ padding: '10px 14px', background: '#1A1A1A', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isR2 && <div style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: C.goldDim, padding: '2px 7px', borderRadius: 5, fontFamily: "'Space Mono', monospace", border: `1px solid ${C.gold}33` }}>DEMI-FINALE</div>}
                    <div style={{ fontSize: 9, fontWeight: 700, color: conf === 'EST' ? '#60A5FA' : C.gold, background: conf === 'EST' ? 'rgba(96,165,250,0.1)' : C.goldDim, padding: '2px 7px', borderRadius: 5, fontFamily: "'Space Mono', monospace" }}>{conf}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                      {(nextGame?.home_name || lastFinished?.home_name || '').split(' ').pop()} vs {(nextGame?.away_name || lastFinished?.away_name || '').split(' ').pop()}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, fontFamily: "'Space Mono', monospace" }}>{record}</div>
                </div>

                {/* Dernier résultat — compact */}
                {lastFinished && (
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: '#111' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>GAME {lastFinished.game_num}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <TeamLogo abbr={lastFinished.home} size={20} />
                        <span style={{ fontSize: 16, fontWeight: 900, color: lastWinner === lastFinished.home ? C.green : '#333' }}>{lastFinished.home_score}</span>
                        <span style={{ fontSize: 11, color: '#333', fontWeight: 700 }}>-</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: lastWinner === lastFinished.away ? C.green : '#333' }}>{lastFinished.away_score}</span>
                        <TeamLogo abbr={lastFinished.away} size={20} />
                      </div>
                      {lastPronoCorrect && <span style={{ fontSize: 14 }}>✅</span>}
                      {lastPronoWrong && <span style={{ fontSize: 14 }}>❌</span>}
                    </div>
                  </div>
                )}

                {/* Prochain match — MISE EN AVANT */}
                {nextGame && (
                  <div style={{ padding: '16px 14px' }}>
                    {/* Date et game */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: live ? C.red : isPast ? C.muted : C.lilac, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
                        {live ? '🔴 EN DIRECT' : isPast ? '⏸ MATCH PASSÉ' : `🎯 GAME ${nextGame.game_num} — TON PRONO`}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                        {new Date(nextGame.game_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Probabilités — plus claires */}
                    {nextGame.win_prob_home && !isBlocked && (
                      <div style={{ background: '#1A1A1A', borderRadius: 12, padding: '10px 12px', marginBottom: 14, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                          📊 PROBABILITÉ DE VICTOIRE (selon les experts)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.text, width: 30, textAlign: 'right', fontFamily: "'Space Mono', monospace" }}>{nextGame.win_prob_home}%</div>
                          <div style={{ flex: 1, height: 6, background: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${nextGame.win_prob_home}%`, height: '100%', background: 'linear-gradient(90deg, #B794F4, #9B6FD4)', borderRadius: 3, transition: 'width 1s ease' }} />
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.text, width: 30, fontFamily: "'Space Mono', monospace" }}>{nextGame.win_prob_away}%</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: 9, color: C.muted }}>{nextHome}</span>
                          <span style={{ fontSize: 9, color: C.muted }}>{nextAway}</span>
                        </div>
                      </div>
                    )}

                    {/* Boutons équipes — plus grands et clairs */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['home', 'away'].map(side => {
                        const abbr = side === 'home' ? nextHome : nextAway;
                        const name = side === 'home' ? nextGame.home_name : nextGame.away_name;
                        const picked = prono?.vainqueur === side;
                        return (
                          <button key={side}
                            onClick={() => !isBlocked && handlePick(activeGameId, side)}
                            disabled={isBlocked}
                            style={{
                              flex: 1, padding: '16px 8px', borderRadius: 16, textAlign: 'center',
                              border: picked ? `2px solid ${C.lilac}` : `1px solid ${C.border}`,
                              background: picked ? 'linear-gradient(135deg, #1A1428, #12102A)' : '#1A1A1A',
                              cursor: isBlocked ? 'default' : 'pointer',
                              boxShadow: picked ? `0 0 20px rgba(183,148,244,0.25)` : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                              <TeamLogo abbr={abbr} size={52} />
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: picked ? C.lilac : C.text, lineHeight: 1.3 }}>{name}</div>
                            <div style={{ fontSize: 9, color: picked ? `${C.lilac}88` : C.muted, marginTop: 3, fontFamily: "'Space Mono', monospace" }}>
                              {side === 'home' ? '🏠 DOMICILE' : '✈️ EXTÉRIEUR'}
                            </div>
                            {picked && !isBlocked && (
                              <div style={{ marginTop: 6, fontSize: 10, color: C.lilac, fontWeight: 700, background: 'rgba(183,148,244,0.1)', borderRadius: 8, padding: '4px 8px', fontFamily: "'Space Mono', monospace" }}>
                                ✓ MON CHOIX
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bouton valider */}
                    {!isBlocked && prono?.vainqueur && (
                      <button onClick={() => submitProno(activeGameId)} style={{
                        width: '100%', marginTop: 12, padding: '14px', borderRadius: 14, border: 'none',
                        background: 'linear-gradient(135deg, #B794F4, #9B6FD4)',
                        color: '#fff', fontSize: 15, fontWeight: 800,
                        cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        boxShadow: '0 4px 20px rgba(183,148,244,0.5)',
                      }}>
                        🎯 Valider mon prono — +100 pts si correct !
                      </button>
                    )}

                    {/* États */}
                    {live && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: C.red, fontWeight: 700 }}>🔴 Match en cours — pronos fermés</div>}
                    {isPast && !live && !isSubmitted && <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: C.muted }}>⏸ Match commencé — pronos fermés</div>}
                    {isSubmitted && !live && (
                      <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: C.green, fontWeight: 700 }}>
                        ✅ Prono soumis — résultat cette nuit !
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── RÉSULTATS ── */}
      {statusFilter === 'finished' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            const correct = hasProno && prono.points_gagnes > 0;
            const wrong = hasProno && prono.points_gagnes === 0;
            const conf = SERIES_CONF[game.serie_id];

            return (
              <div key={game.id} style={{
                background: C.card, borderRadius: 16, overflow: 'hidden',
                border: correct ? `1px solid ${C.green}44` : wrong ? `1px solid ${C.red}33` : `1px solid ${C.border}`,
                animation: `slideUp 0.3s ease ${i * 0.03}s both`,
              }}>
                <div style={{ padding: '9px 14px', background: '#1A1A1A', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: conf === 'EST' ? '#60A5FA' : C.gold, background: conf === 'EST' ? 'rgba(96,165,250,0.1)' : C.goldDim, padding: '2px 7px', borderRadius: 5, fontFamily: "'Space Mono', monospace" }}>{conf}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'Space Mono', monospace" }}>GAME {game.game_num}</div>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Space Mono', monospace" }}>
                    {new Date(game.game_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><TeamLogo abbr={game.home} size={36} /></div>
                    <div style={{ fontSize: 10, color: C.muted }}>{game.home_name?.split(' ').pop()}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, marginTop: 3, color: winner === 'home' ? C.green : '#333' }}>{game.home_score}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 48 }}>
                    {correct && <div style={{ background: 'rgba(74,222,128,0.1)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16 }}>✅</div>
                      <div style={{ fontSize: 9, color: C.green, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>+100</div>
                    </div>}
                    {wrong && <div style={{ background: 'rgba(248,113,113,0.1)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16 }}>❌</div>
                      <div style={{ fontSize: 9, color: C.red, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>0 pt</div>
                    </div>}
                    {!hasProno && <div style={{ background: '#1A1A1A', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14 }}>—</div>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: "'Space Mono', monospace" }}>pas de prono</div>
                    </div>}
                  </div>

                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><TeamLogo abbr={game.away} size={36} /></div>
                    <div style={{ fontSize: 10, color: C.muted }}>{game.away_name?.split(' ').pop()}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, marginTop: 3, color: winner === 'away' ? C.green : '#333' }}>{game.away_score}</div>
                  </div>
                </div>

                {hasProno && (
                  <div style={{ padding: '7px 14px', background: correct ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: correct ? C.green : C.red, fontWeight: 600 }}>
                      Tu avais choisi : {prono.vainqueur === 'home' ? game.home_name : game.away_name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? C.red : C.lilac, color: '#fff', padding: '12px 24px', borderRadius: 20, fontWeight: 700, fontSize: 14, fontFamily: "'Outfit', sans-serif", zIndex: 9999, boxShadow: `0 8px 32px rgba(0,0,0,0.4)`, whiteSpace: 'nowrap', animation: 'slideUp 0.3s ease' }}>{toast.msg}</div>
      )}
    </div>
  );
}
