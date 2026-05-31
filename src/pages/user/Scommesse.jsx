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

export default function Scommesse() {
  const [tab, setTab] = useState('SEASON')
  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Scommesse</h1>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-max mb-6">
        <button onClick={() => setTab('SEASON')} className={`px-4 py-2 text-sm font-medium ${tab === 'SEASON' ? 'bg-gds-pink text-white' : 'bg-white text-gds-dark'}`}>Fine campionato</button>
        <button onClick={() => setTab('MATCH')} className={`px-4 py-2 text-sm font-medium ${tab === 'MATCH' ? 'bg-gds-pink text-white' : 'bg-white text-gds-dark'}`}>Di partita</button>
      </div>
      {tab === 'SEASON' ? <SeasonTab /> : <MatchTab />}
    </div>
  )
}

/* ─── Fine campionato ─────────────────────────────────────────────────────── */
function SeasonTab() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const { data: bets, isLoading } = useQuery({ queryKey: ['scommesse-open'], queryFn: () => scommessaApi.listOpen().then((r) => r.data) })
  const { data: mine } = useQuery({ queryKey: ['scommesse-mine'], queryFn: () => scommessaApi.listMine().then((r) => r.data) })
  const myChoice = (id) => mine?.find((g) => g.scommessaId === id)?.choiceRef

  const place = useMutation({
    mutationFn: ({ scommessaId, choiceRef }) => scommessaApi.place(scommessaId, choiceRef),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scommesse-mine'] }); setError('') },
    onError: (e) => setError(e.response?.data?.error || 'Errore'),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
      {bets?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray"><Coins size={40} className="mx-auto mb-3 text-gray-300" />Nessuna scommessa di fine campionato aperta.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {bets?.map((bet) => {
            const chosen = myChoice(bet.id)
            return (
              <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
                <p className="font-semibold text-gds-dark mb-2">{bet.label}</p>
                <div className="flex flex-wrap gap-2">
                  {bet.options?.map((o) => (
                    <button key={o.id} onClick={() => place.mutate({ scommessaId: bet.id, choiceRef: o.ref })}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${chosen === o.ref ? 'bg-gds-pink text-white border-gds-pink' : 'bg-white text-gds-dark border-gray-200 hover:border-gds-pink'}`}>{o.label}</button>
                  ))}
                </div>
                {chosen && <p className="text-xs text-green-700 mt-2 inline-flex items-center gap-1"><Check size={13} /> Giocata registrata</p>}
              </div>
            )
          })}
        </div>
      )}

      <h2 className="text-lg font-bold text-gds-dark mb-3">Le mie giocate</h2>
      <MyList items={mine} render={(g) => (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gds-dark">{g.scommessaLabel}</span>
            <Badge color={ST_COLOR[g.scommessaStatus] ?? 'gray'}>{g.scommessaStatus}</Badge>
          </div>
          <p className="text-sm text-gds-gray">Scelta: <strong className="text-gds-dark">{g.choiceLabel}</strong>{correctIcon(g.isCorrect)}</p>
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
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Giornata</label>
            <select value={giornataId} onChange={(e) => { setGiornataId(e.target.value); setMatchId('') }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
              <option value="">-- Seleziona --</option>
              {giornate?.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.leagueName})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Partita</label>
            <select value={matchId} onChange={(e) => selectMatch(e.target.value)} disabled={!giornataId}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink disabled:bg-gray-50">
              <option value="">-- Seleziona --</option>
              {partite?.map((m) => <option key={m.id} value={m.id} disabled={m.homeScore != null}>{m.homeTeamName} – {m.awayTeamName}{m.homeScore != null ? ' (giocata)' : ''}</option>)}
            </select>
          </div>
        </div>

        {match && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Tipo di scommessa</label>
              <div className="flex flex-wrap gap-2">
                {MATCH_MARKETS.map((mk) => (
                  <button key={mk} onClick={() => selectMarket(mk)}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${market === mk ? 'bg-gds-pink text-white border-gds-pink' : 'bg-white text-gds-dark border-gray-200 hover:border-gds-pink'}`}>{MARKET_LABEL[mk]}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Previsione</label>
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
                  className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gds-pink" />
              )}
              {market === 'FIRST_SCORER' && (
                <select value={prediction} onChange={(e) => setPrediction(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink max-w-md">
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

      <h2 className="text-lg font-bold text-gds-dark mb-3">Le mie giocate di partita</h2>
      <MyList items={mine} render={(g) => (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gds-dark text-sm">{g.home} – {g.away}</span>
            <span className="text-xs text-gds-gray">{MARKET_LABEL[g.market]}</span>
          </div>
          <p className="text-sm text-gds-gray">Previsione: <strong className="text-gds-dark">{g.predictionLabel}</strong>{correctIcon(g.isCorrect)}</p>
        </>
      )} />
    </div>
  )
}

function PredBtn({ selected, onClick, label }) {
  return <button onClick={onClick} className={`px-3 py-1.5 text-sm rounded-lg border ${selected ? 'bg-gds-pink text-white border-gds-pink' : 'bg-white text-gds-dark border-gray-200 hover:border-gds-pink'}`}>{label}</button>
}

function correctIcon(isCorrect) {
  if (isCorrect === true) return <Check size={15} className="inline ml-1 text-green-600" />
  if (isCorrect === false) return <X size={15} className="inline ml-1 text-red-500" />
  return null
}

function MyList({ items, render }) {
  if (!items?.length) return <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gds-gray">Non hai ancora giocate.</div>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((g) => <div key={g.id} className="bg-white rounded-xl shadow-sm p-4">{render(g)}</div>)}
    </div>
  )
}
