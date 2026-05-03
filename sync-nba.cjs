// sync-nba.cjs — Mise à jour au 3 mai 2026
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aukmjbgbukxwmvgymiau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a21qYmdidWt4d212Z3ltaWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAzNjQzMCwiZXhwIjoyMDkyNjEyNDMwfQ.UPVN9iLaY_62LZo8a7JfHNc4NkxeFLyNrox9tfNdZ9Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getAllGames() {
  return [
    // ══ BOS vs PHI — PHI 4-3 ✅ ══
    { id: 'g_bos1', serie_id: 'BOS_PHI', conf: 'EST', game_num: 1, home: 'BOS', away: 'PHI', home_name: 'Boston Celtics', away_name: 'Philadelphia 76ers', game_date: '2026-04-19T17:00:00Z', status: 'finished', home_score: 123, away_score: 91,  serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_bos2', serie_id: 'BOS_PHI', conf: 'EST', game_num: 2, home: 'BOS', away: 'PHI', home_name: 'Boston Celtics', away_name: 'Philadelphia 76ers', game_date: '2026-04-21T23:00:00Z', status: 'finished', home_score: 97,  away_score: 111, serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_bos3', serie_id: 'BOS_PHI', conf: 'EST', game_num: 3, home: 'PHI', away: 'BOS', home_name: 'Philadelphia 76ers', away_name: 'Boston Celtics', game_date: '2026-04-24T23:00:00Z', status: 'finished', home_score: 100, away_score: 108, serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_bos4', serie_id: 'BOS_PHI', conf: 'EST', game_num: 4, home: 'PHI', away: 'BOS', home_name: 'Philadelphia 76ers', away_name: 'Boston Celtics', game_date: '2026-04-26T23:00:00Z', status: 'finished', home_score: 96,  away_score: 128, serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_bos5', serie_id: 'BOS_PHI', conf: 'EST', game_num: 5, home: 'BOS', away: 'PHI', home_name: 'Boston Celtics', away_name: 'Philadelphia 76ers', game_date: '2026-04-28T23:00:00Z', status: 'finished', home_score: 97,  away_score: 113, serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_bos6', serie_id: 'BOS_PHI', conf: 'EST', game_num: 6, home: 'PHI', away: 'BOS', home_name: 'Philadelphia 76ers', away_name: 'Boston Celtics', game_date: '2026-05-01T00:00:00Z', status: 'finished', home_score: 106, away_score: 93,  serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_bos7', serie_id: 'BOS_PHI', conf: 'EST', game_num: 7, home: 'BOS', away: 'PHI', home_name: 'Boston Celtics', away_name: 'Philadelphia 76ers', game_date: '2026-05-02T23:30:00Z', status: 'finished', home_score: 100, away_score: 109, serie_record: 'PHI 4-3 ✅', win_prob_home: null, win_prob_away: null },

    // ══ NYK vs ATL — NYK 4-2 ✅ ══
    { id: 'g_nyk1', serie_id: 'NYK_ATL', conf: 'EST', game_num: 1, home: 'NYK', away: 'ATL', home_name: 'New York Knicks', away_name: 'Atlanta Hawks', game_date: '2026-04-18T22:00:00Z', status: 'finished', home_score: 113, away_score: 102, serie_record: 'NYK 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_nyk2', serie_id: 'NYK_ATL', conf: 'EST', game_num: 2, home: 'NYK', away: 'ATL', home_name: 'New York Knicks', away_name: 'Atlanta Hawks', game_date: '2026-04-21T00:00:00Z', status: 'finished', home_score: 106, away_score: 107, serie_record: 'NYK 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_nyk3', serie_id: 'NYK_ATL', conf: 'EST', game_num: 3, home: 'ATL', away: 'NYK', home_name: 'Atlanta Hawks', away_name: 'New York Knicks', game_date: '2026-04-23T23:00:00Z', status: 'finished', home_score: 109, away_score: 108, serie_record: 'NYK 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_nyk4', serie_id: 'NYK_ATL', conf: 'EST', game_num: 4, home: 'ATL', away: 'NYK', home_name: 'Atlanta Hawks', away_name: 'New York Knicks', game_date: '2026-04-25T22:00:00Z', status: 'finished', home_score: 98,  away_score: 114, serie_record: 'NYK 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_nyk5', serie_id: 'NYK_ATL', conf: 'EST', game_num: 5, home: 'NYK', away: 'ATL', home_name: 'New York Knicks', away_name: 'Atlanta Hawks', game_date: '2026-04-29T00:00:00Z', status: 'finished', home_score: 126, away_score: 97,  serie_record: 'NYK 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_nyk6', serie_id: 'NYK_ATL', conf: 'EST', game_num: 6, home: 'ATL', away: 'NYK', home_name: 'Atlanta Hawks', away_name: 'New York Knicks', game_date: '2026-04-30T23:00:00Z', status: 'finished', home_score: 89,  away_score: 140, serie_record: 'NYK 4-2 ✅', win_prob_home: null, win_prob_away: null },

    // ══ CLE vs TOR — Game 7 ce soir ══
    { id: 'g_cle1', serie_id: 'CLE_TOR', conf: 'EST', game_num: 1, home: 'CLE', away: 'TOR', home_name: 'Cleveland Cavaliers', away_name: 'Toronto Raptors', game_date: '2026-04-18T17:00:00Z', status: 'finished', home_score: 126, away_score: 113, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_cle2', serie_id: 'CLE_TOR', conf: 'EST', game_num: 2, home: 'CLE', away: 'TOR', home_name: 'Cleveland Cavaliers', away_name: 'Toronto Raptors', game_date: '2026-04-20T23:00:00Z', status: 'finished', home_score: 115, away_score: 105, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_cle3', serie_id: 'CLE_TOR', conf: 'EST', game_num: 3, home: 'TOR', away: 'CLE', home_name: 'Toronto Raptors', away_name: 'Cleveland Cavaliers', game_date: '2026-04-24T00:00:00Z', status: 'finished', home_score: 126, away_score: 104, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_cle4', serie_id: 'CLE_TOR', conf: 'EST', game_num: 4, home: 'TOR', away: 'CLE', home_name: 'Toronto Raptors', away_name: 'Cleveland Cavaliers', game_date: '2026-04-26T17:00:00Z', status: 'finished', home_score: 93,  away_score: 89,  serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_cle5', serie_id: 'CLE_TOR', conf: 'EST', game_num: 5, home: 'CLE', away: 'TOR', home_name: 'Cleveland Cavaliers', away_name: 'Toronto Raptors', game_date: '2026-04-29T23:30:00Z', status: 'finished', home_score: 125, away_score: 120, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_cle6', serie_id: 'CLE_TOR', conf: 'EST', game_num: 6, home: 'TOR', away: 'CLE', home_name: 'Toronto Raptors', away_name: 'Cleveland Cavaliers', game_date: '2026-05-01T23:30:00Z', status: 'finished', home_score: 112, away_score: 110, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_cle7', serie_id: 'CLE_TOR', conf: 'EST', game_num: 7, home: 'CLE', away: 'TOR', home_name: 'Cleveland Cavaliers', away_name: 'Toronto Raptors', game_date: '2026-05-03T23:30:00Z', status: 'upcoming', home_score: null, away_score: null, serie_record: 'Egalité 3-3', win_prob_home: 73.5, win_prob_away: 26.5 },

    // ══ DET vs ORL — Game 7 ce soir ══
    { id: 'g_det1', serie_id: 'DET_ORL', conf: 'EST', game_num: 1, home: 'DET', away: 'ORL', home_name: 'Detroit Pistons', away_name: 'Orlando Magic', game_date: '2026-04-19T22:30:00Z', status: 'finished', home_score: 101, away_score: 112, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_det2', serie_id: 'DET_ORL', conf: 'EST', game_num: 2, home: 'DET', away: 'ORL', home_name: 'Detroit Pistons', away_name: 'Orlando Magic', game_date: '2026-04-22T23:00:00Z', status: 'finished', home_score: 98,  away_score: 83,  serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_det3', serie_id: 'DET_ORL', conf: 'EST', game_num: 3, home: 'ORL', away: 'DET', home_name: 'Orlando Magic', away_name: 'Detroit Pistons', game_date: '2026-04-25T17:00:00Z', status: 'finished', home_score: 113, away_score: 105, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_det4', serie_id: 'DET_ORL', conf: 'EST', game_num: 4, home: 'ORL', away: 'DET', home_name: 'Orlando Magic', away_name: 'Detroit Pistons', game_date: '2026-04-28T00:00:00Z', status: 'finished', home_score: 94,  away_score: 88,  serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_det5', serie_id: 'DET_ORL', conf: 'EST', game_num: 5, home: 'DET', away: 'ORL', home_name: 'Detroit Pistons', away_name: 'Orlando Magic', game_date: '2026-04-29T23:00:00Z', status: 'finished', home_score: 116, away_score: 109, serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_det6', serie_id: 'DET_ORL', conf: 'EST', game_num: 6, home: 'ORL', away: 'DET', home_name: 'Orlando Magic', away_name: 'Detroit Pistons', game_date: '2026-05-01T23:00:00Z', status: 'finished', home_score: 79,  away_score: 93,  serie_record: 'Egalité 3-3', win_prob_home: null, win_prob_away: null },
    { id: 'g_det7', serie_id: 'DET_ORL', conf: 'EST', game_num: 7, home: 'DET', away: 'ORL', home_name: 'Detroit Pistons', away_name: 'Orlando Magic', game_date: '2026-05-03T19:30:00Z', status: 'upcoming', home_score: null, away_score: null, serie_record: 'Egalité 3-3', win_prob_home: 75.3, win_prob_away: 24.7 },

    // ══ OKC 4-0 PHX ✅ ══
    { id: 'g_okc1', serie_id: 'OKC_PHX', conf: 'OUEST', game_num: 1, home: 'OKC', away: 'PHX', home_name: 'OKC Thunder', away_name: 'Phoenix Suns', game_date: '2026-04-19T19:30:00Z', status: 'finished', home_score: 119, away_score: 84,  serie_record: 'OKC 4-0 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_okc2', serie_id: 'OKC_PHX', conf: 'OUEST', game_num: 2, home: 'OKC', away: 'PHX', home_name: 'OKC Thunder', away_name: 'Phoenix Suns', game_date: '2026-04-23T01:30:00Z', status: 'finished', home_score: 120, away_score: 107, serie_record: 'OKC 4-0 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_okc3', serie_id: 'OKC_PHX', conf: 'OUEST', game_num: 3, home: 'PHX', away: 'OKC', home_name: 'Phoenix Suns', away_name: 'OKC Thunder', game_date: '2026-04-25T19:30:00Z', status: 'finished', home_score: 109, away_score: 121, serie_record: 'OKC 4-0 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_okc4', serie_id: 'OKC_PHX', conf: 'OUEST', game_num: 4, home: 'PHX', away: 'OKC', home_name: 'Phoenix Suns', away_name: 'OKC Thunder', game_date: '2026-04-28T01:30:00Z', status: 'finished', home_score: 122, away_score: 131, serie_record: 'OKC 4-0 ✅', win_prob_home: null, win_prob_away: null },

    // ══ SAS 4-1 POR ✅ ══
    { id: 'g_sas1', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 1, home: 'SAS', away: 'POR', home_name: 'San Antonio Spurs', away_name: 'Portland T. Blazers', game_date: '2026-04-20T01:00:00Z', status: 'finished', home_score: 111, away_score: 98,  serie_record: 'SAS 4-1 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_sas2', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 2, home: 'SAS', away: 'POR', home_name: 'San Antonio Spurs', away_name: 'Portland T. Blazers', game_date: '2026-04-22T00:00:00Z', status: 'finished', home_score: 103, away_score: 106, serie_record: 'SAS 4-1 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_sas3', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 3, home: 'POR', away: 'SAS', home_name: 'Portland T. Blazers', away_name: 'San Antonio Spurs', game_date: '2026-04-25T02:30:00Z', status: 'finished', home_score: 108, away_score: 120, serie_record: 'SAS 4-1 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_sas4', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 4, home: 'POR', away: 'SAS', home_name: 'Portland T. Blazers', away_name: 'San Antonio Spurs', game_date: '2026-04-26T19:30:00Z', status: 'finished', home_score: 93,  away_score: 114, serie_record: 'SAS 4-1 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_sas5', serie_id: 'SAS_POR', conf: 'OUEST', game_num: 5, home: 'SAS', away: 'POR', home_name: 'San Antonio Spurs', away_name: 'Portland T. Blazers', game_date: '2026-04-29T01:30:00Z', status: 'finished', home_score: 114, away_score: 95,  serie_record: 'SAS 4-1 ✅', win_prob_home: null, win_prob_away: null },

    // ══ MIN 4-2 DEN ✅ ══
    { id: 'g_den1', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 1, home: 'DEN', away: 'MIN', home_name: 'Denver Nuggets', away_name: 'Minnesota T-Wolves', game_date: '2026-04-18T19:30:00Z', status: 'finished', home_score: 116, away_score: 105, serie_record: 'MIN 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_den2', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 2, home: 'DEN', away: 'MIN', home_name: 'Denver Nuggets', away_name: 'Minnesota T-Wolves', game_date: '2026-04-21T02:30:00Z', status: 'finished', home_score: 114, away_score: 119, serie_record: 'MIN 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_den3', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 3, home: 'MIN', away: 'DEN', home_name: 'Minnesota T-Wolves', away_name: 'Denver Nuggets', game_date: '2026-04-24T01:30:00Z', status: 'finished', home_score: 113, away_score: 96,  serie_record: 'MIN 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_den4', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 4, home: 'MIN', away: 'DEN', home_name: 'Minnesota T-Wolves', away_name: 'Denver Nuggets', game_date: '2026-04-26T00:30:00Z', status: 'finished', home_score: 112, away_score: 96,  serie_record: 'MIN 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_den5', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 5, home: 'DEN', away: 'MIN', home_name: 'Denver Nuggets', away_name: 'Minnesota T-Wolves', game_date: '2026-04-28T02:30:00Z', status: 'finished', home_score: 125, away_score: 113, serie_record: 'MIN 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_den6', serie_id: 'DEN_MIN', conf: 'OUEST', game_num: 6, home: 'MIN', away: 'DEN', home_name: 'Minnesota T-Wolves', away_name: 'Denver Nuggets', game_date: '2026-05-01T01:30:00Z', status: 'finished', home_score: 110, away_score: 98,  serie_record: 'MIN 4-2 ✅', win_prob_home: null, win_prob_away: null },

    // ══ LAL 4-2 HOU ✅ ══
    { id: 'g_lal1', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 1, home: 'LAL', away: 'HOU', home_name: 'Los Angeles Lakers', away_name: 'Houston Rockets', game_date: '2026-04-19T00:30:00Z', status: 'finished', home_score: 107, away_score: 98,  serie_record: 'LAL 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_lal2', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 2, home: 'LAL', away: 'HOU', home_name: 'Los Angeles Lakers', away_name: 'Houston Rockets', game_date: '2026-04-22T02:30:00Z', status: 'finished', home_score: 101, away_score: 94,  serie_record: 'LAL 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_lal3', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 3, home: 'HOU', away: 'LAL', home_name: 'Houston Rockets', away_name: 'Los Angeles Lakers', game_date: '2026-04-25T00:00:00Z', status: 'finished', home_score: 108, away_score: 112, serie_record: 'LAL 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_lal4', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 4, home: 'HOU', away: 'LAL', home_name: 'Houston Rockets', away_name: 'Los Angeles Lakers', game_date: '2026-04-27T01:30:00Z', status: 'finished', home_score: 115, away_score: 96,  serie_record: 'LAL 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_lal5', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 5, home: 'LAL', away: 'HOU', home_name: 'Los Angeles Lakers', away_name: 'Houston Rockets', game_date: '2026-04-30T02:00:00Z', status: 'finished', home_score: 93,  away_score: 99,  serie_record: 'LAL 4-2 ✅', win_prob_home: null, win_prob_away: null },
    { id: 'g_lal6', serie_id: 'LAL_HOU', conf: 'OUEST', game_num: 6, home: 'HOU', away: 'LAL', home_name: 'Houston Rockets', away_name: 'Los Angeles Lakers', game_date: '2026-05-02T01:30:00Z', status: 'finished', home_score: 78,  away_score: 98,  serie_record: 'LAL 4-2 ✅', win_prob_home: null, win_prob_away: null },
  ];
}

async function sync() {
  console.log('🏀 Synchronisation NBA Playoffs — 3 mai 2026\n');
  const games = getAllGames();
  const { error } = await supabase.from('nba_games').upsert(games, { onConflict: 'id' });
  if (error) { console.error('❌ Erreur:', error.message); return; }
  console.log(`✅ ${games.length} matchs synchronisés !`);
  await calculatePoints();
}

async function calculatePoints() {
  console.log('\n🏆 Calcul des points...');
  const { data: finishedGames } = await supabase.from('nba_games').select('*').eq('status', 'finished');
  if (!finishedGames?.length) { console.log('Aucun match terminé'); return; }
  let updated = 0;
  for (const game of finishedGames) {
    const actualWinner = game.home_score > game.away_score ? 'home' : 'away';
    const { data: pronos } = await supabase.from('pronostics').select('*').eq('nba_serie_id', game.id).eq('submitted', true);
    if (!pronos?.length) continue;
    for (const prono of pronos) {
      const pts = prono.vainqueur === actualWinner ? 100 : 0;
      if (prono.points_gagnes !== pts) {
        await supabase.from('pronostics').update({ points_gagnes: pts }).eq('id', prono.id);
        updated++;
      }
    }
  }
  const { data: users } = await supabase.from('profiles').select('id');
  for (const user of users || []) {
    const { data: all } = await supabase.from('pronostics').select('points_gagnes').eq('user_id', user.id);
    const total = all?.reduce((s, p) => s + (p.points_gagnes || 0), 0) || 0;
    await supabase.from('profiles').update({ points: total }).eq('id', user.id);
  }
  console.log(`✅ ${updated} pronos mis à jour, points recalculés !`);
}

sync().catch(console.error);
