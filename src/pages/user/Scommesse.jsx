import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scommessaApi, giornataApi, listiniApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Coins, Check, X, Trophy } from 'lucide-react'

const ST_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }
const MARKET_LABEL = {
  GOAL_NOGOAL: 'Gol / No gol', EXACT_SCORE: 'Risultato esatto', WINNER: 'Vincitore', FIRST_SCORER: 'Primo marcatore',
}
const MATCH_MARKETS = ['GOAL_NOGOAL', 'WINNER', 'EXACT_SCORE', 'FIRST_SCORER']
const ROLE_LABEL = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', FWD: 'Attaccante' }
const roleLabel = (r) => ROLE_LABEL[r] ?? r ?? ''
const SEASON_MARKETS = [
  { value: 'TOP_SCORER', label: 'Capocannoniere', target: 'PLAYER' },
  { value: 'TOP_ASSIST', label: 'Miglior assist', target: 'PLAYER' },
  { value: 'BEST_GOALKEEPER', label: 'Miglior portiere', target: 'PLAYER', gk: true },
  { value: 'CLEAN_SHEET', label: 'Più clean sheet', target: 'PLAYER', gk: true },
  { value: 'MOST_GOALS_FOR', label: 'Più gol fatti', target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Meno gol subiti', target: 'TEAM' },
]

export default function Scommesse() {
  const [tab, setTab] = useState('SEASON')
  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-white mb-6">Scommesse</h1>
      <div className="flex rounded-lg border border-gds-border overflow-hidden w-max mb-6">
        <button onClick={() => setTab('SEASON')} className={`px-4 py-2 text-sm font-medium ${tab === 'SEASON' ? 'bg-gds-pink text-white' : 'bg-gds-surface text-gds-white'}`}>Fine campionato</button>
        <button onClick={() => setTab('MATCH')} className={`px-4 py-2 text-sm font-medium ${tab === 'MATCH' ? 'bg-gds-pink text-white' : 'bg-gds-surface text-gds-white'}`}>Di partita</button>
      </div>
      {tab === 'SEASON' ? <SeasonTab /> : <MatchTab />}
    </div>
  )
}

/* ─── Fine campionato (self-service: lega → mercato → bersaglio) ───────────── */
function SeasonTab() {
  const queryClient = useQueryClient()
  const [leagueId, setLeagueId] = useState('')
  const [market, setMarket] = useState('TOP_SCORER')
  const [prediction, setPrediction] = useState('')
  const [error, setError] = useState('')

  const def = SEASON_MARKETS.find((m) => m.value === market) ?? {}
  const { data: leagues } = useQuery({ queryKey: ['listini-leagues'], queryFn: () => listiniApi.leagues().then((r) => r.data) })
  const { data: teams } = useQuery({
    queryKey: ['listini-teams', leagueId],
    queryFn: () => listiniApi.teams(leagueId).then((r) => r.data),
    enabled: def.target === 'TEAM' && !!leagueId,
  })
  const { data: players } = useQuery({
    queryKey: ['listini-players', leagueId, def.gk ? 'GK' : 'ALL'],
    queryFn: () => listiniApi.players({ leagueId, ...(def.gk ? { role: 'GK' } : {}) }).then((r) => r.data),
    enabled: def.target === 'PLAYER' && !!leagueId,
  })
  const { data: mine } = useQuery({ queryKey: ['scommesse-mine'], queryFn: () => scommessaApi.listMine().then((r) => r.data) })

  const place = useMutation({
    mutationFn: () => scommessaApi.placeStagione({ leagueId: Number(leagueId), market, prediction }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scommesse-mine'] }); setPrediction(''); setError('') },
    onError: (e) => setError(e.response?.data?.error || 'Errore'),
  })

  function selectMarket(v) { setMarket(v); setPrediction('') }
  function selectLeague(v) { setLeagueId(v); setPrediction('') }

  return (
    <div>
      <div className="bg-gds-surface rounded-xl shadow-sm p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">Lega</label>
            <select value={leagueId} onChange={(e) => selectLeague(e.target.value)}
              className="rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink">
              <option value="">-- Seleziona --</option>
              {leagues?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">Mercato</label>
            <select value={market} onChange={(e) => selectMarket(e.target.value)}
              className="rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink">
              {SEASON_MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {leagueId && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">{def.target === 'TEAM' ? 'Squadra' : (def.gk ? 'Portiere' : 'Giocatore')}</label>
            <select value={prediction} onChange={(e) => setPrediction(e.target.value)}
              className="rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink max-w-md">
              <option value="">-- Seleziona --</option>
              {def.target === 'TEAM'
                ? (teams || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)
                : (players || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {roleLabel(p.role)} · {p.teamName}</option>
                  ))}
            </select>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 rounded-lg p-2.5 text-sm">{error}</div>}
        <div className="flex justify-end">
          <Button onClick={() => { setError(''); place.mutate() }} loading={place.isPending} disabled={!leagueId || !prediction}>
            <Trophy size={16} /> Conferma giocata
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gds-white mb-3">Le mie giocate</h2>
      <MyList items={mine} render={(g) => (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gds-white">{g.scommessaLabel}</span>
            <Badge color={ST_COLOR[g.scommessaStatus] ?? 'gray'}>{g.scommessaStatus}</Badge>
          </div>
          <p className="text-sm text-gds-gray">Scelta: <strong className="text-gds-white">{g.choiceLabel}</strong>{correctIcon(g.isCorrect)}</p>
        </>
      )} />
    </div>
  )
}

/* ─── Di partita ──────────────────────────────────────────────────────────── */
function MatchTab() {
  const queryClient = useQueryClient()
  const [giornataId, setGiornataId] = useState('')
  const [matchId, setMatchId] = useState('')
  const [market, setMarket] = useState('GOAL_NOGOAL')
  const [prediction, setPrediction] = useState('')
  const [error, setError] = useState('')

  const { data: giornate } = useQuery({ queryKey: ['user-giornate'], queryFn: () => giornataApi.list().then((r) => r.data) })
  const { data: partite } = useQuery({ queryKey: ['user-giornata-partite', giornataId], queryFn: () => giornataApi.partite(giornataId).then((r) => r.data), enabled: !!giornataId })
  const { data: mine } = useQuery({ queryKey: ['giocate-partita-mine'], queryFn: () => scommessaApi.listMinePartita().then((r) => r.data) })

  const match = (partite || []).find((m) => String(m.id) === String(matchId))
  const { data: players } = useQuery({
    queryKey: ['listini-players-league', match?.leagueId],
    queryFn: () => listiniApi.players({ leagueId: match.leagueId }).then((r) => r.data),
    enabled: market === 'FIRST_SCORER' && !!match?.leagueId,
  })
  const matchPlayers = (players || []).filter((p) => p.teamId === match?.homeTeamId || p.teamId === match?.awayTeamId)

  const place = useMutation({
    mutationFn: () => scommessaApi.placePartita({ matchId: Number(matchId), market, prediction }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['giocate-partita-mine'] }); setPrediction(''); setError('') },
    onError: (e) => setError(e.response?.data?.error || 'Errore'),
  })

  function selectMatch(v) { setMatchId(v); setPrediction('') }
  function selectMarket(v) { setMarket(v); setPrediction('') }

  return (
    <div>
      <div className="bg-gds-surface rounded-xl shadow-sm p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">Giornata</label>
            <select value={giornataId} onChange={(e) => { setGiornataId(e.target.value); setMatchId('') }}
              className="rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink">
              <option value="">-- Seleziona --</option>
              {giornate?.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.leagueName})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">Partita</label>
            <select value={matchId} onChange={(e) => selectMatch(e.target.value)} disabled={!giornataId}
              className="rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink disabled:bg-gds-pink-light">
              <option value="">-- Seleziona --</option>
              {partite?.map((m) => <option key={m.id} value={m.id} disabled={m.homeScore != null}>{m.homeTeamName} – {m.awayTeamName}{m.homeScore != null ? ' (giocata)' : ''}</option>)}
            </select>
          </div>
        </div>

        {match && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-white">Tipo di scommessa</label>
              <div className="flex flex-wrap gap-2">
                {MATCH_MARKETS.map((mk) => (
                  <button key={mk} onClick={() => selectMarket(mk)}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${market === mk ? 'bg-gds-pink text-white border-gds-pink' : 'bg-gds-surface text-gds-white border-gds-border hover:border-gds-pink'}`}>{MARKET_LABEL[mk]}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-white">Previsione</label>
              {market === 'GOAL_NOGOAL' && (
                <div className="flex gap-2">
                  {[['GOAL', 'Gol'], ['NOGOAL', 'No gol']].map(([ref, lab]) => (
                    <PredBtn key={ref} selected={prediction === ref} onClick={() => setPrediction(ref)} label={lab} />
                  ))}
                </div>
              )}
              {market === 'WINNER' && (
                <div className="flex gap-2">
                  <PredBtn selected={prediction === String(match.homeTeamId)} onClick={() => setPrediction(String(match.homeTeamId))} label={match.homeTeamName} />
                  <PredBtn selected={prediction === String(match.awayTeamId)} onClick={() => setPrediction(String(match.awayTeamId))} label={match.awayTeamName} />
                </div>
              )}
              {market === 'EXACT_SCORE' && (
                <input value={prediction} onChange={(e) => setPrediction(e.target.value)} placeholder="es. 2-1"
                  className="w-32 rounded-lg border border-gds-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gds-pink" />
              )}
              {market === 'FIRST_SCORER' && (
                <select value={prediction} onChange={(e) => setPrediction(e.target.value)}
                  className="rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink max-w-md">
                  <option value="">-- Seleziona giocatore --</option>
                  {matchPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {roleLabel(p.role)} · {p.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName}
                    </option>
                  ))}
                  <option value="OWN_GOAL">⚽ Autogol</option>
                </select>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-700 rounded-lg p-2.5 text-sm">{error}</div>}
            <div className="flex justify-end">
              <Button onClick={() => { setError(''); place.mutate() }} loading={place.isPending} disabled={!prediction}>
                <Trophy size={16} /> Conferma giocata
              </Button>
            </div>
          </>
        )}
      </div>

      <h2 className="text-lg font-bold text-gds-white mb-3">Le mie giocate di partita</h2>
      <MyList items={mine} render={(g) => (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gds-white text-sm">{g.home} – {g.away}</span>
            <span className="text-xs text-gds-gray">{MARKET_LABEL[g.market]}</span>
          </div>
          <p className="text-sm text-gds-gray">Previsione: <strong className="text-gds-white">{g.predictionLabel}</strong>{correctIcon(g.isCorrect)}</p>
        </>
      )} />
    </div>
  )
}

function PredBtn({ selected, onClick, label }) {
  return <button onClick={onClick} className={`px-3 py-1.5 text-sm rounded-lg border ${selected ? 'bg-gds-pink text-white border-gds-pink' : 'bg-gds-surface text-gds-white border-gds-border hover:border-gds-pink'}`}>{label}</button>
}

function correctIcon(isCorrect) {
  if (isCorrect === true) return <Check size={15} className="inline ml-1 text-green-600" />
  if (isCorrect === false) return <X size={15} className="inline ml-1 text-red-500" />
  return null
}

function MyList({ items, render }) {
  if (!items?.length) return <div className="bg-gds-surface rounded-xl shadow-sm p-8 text-center text-gds-gray">Non hai ancora giocate.</div>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((g) => <div key={g.id} className="bg-gds-surface rounded-xl shadow-sm p-4">{render(g)}</div>)}
    </div>
  )
}
