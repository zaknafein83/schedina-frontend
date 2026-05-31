import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, listiniApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Check, RotateCcw, Trophy, Coins } from 'lucide-react'

const SEASON_MARKETS = [
  { value: 'TOP_SCORER', label: 'Capocannoniere', target: 'PLAYER' },
  { value: 'TOP_ASSIST', label: 'Miglior assist', target: 'PLAYER' },
  { value: 'BEST_GOALKEEPER', label: 'Miglior portiere', target: 'PLAYER', gk: true },
  { value: 'CLEAN_SHEET', label: 'Più clean sheet', target: 'PLAYER', gk: true },
  { value: 'MOST_GOALS_FOR', label: 'Più gol fatti', target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Meno gol subiti', target: 'TEAM' },
]
const marketLabel = (m) => SEASON_MARKETS.find((x) => x.value === m)?.label ?? m
const ROLE_LABEL = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', FWD: 'Attaccante' }
const roleLabel = (r) => ROLE_LABEL[r] ?? r ?? ''
const BET_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }

export default function Scommesse() {
  const queryClient = useQueryClient()
  const [seasonId, setSeasonId] = useState('')

  const { data: seasons } = useQuery({ queryKey: ['admin-seasons'], queryFn: () => adminApi.getSeasons().then((r) => r.data) })
  useEffect(() => {
    if (!seasonId && seasons?.length) setSeasonId(String(seasons.find((s) => s.isCurrent)?.id ?? seasons[0].id))
  }, [seasons, seasonId])

  const { data: bets, isLoading } = useQuery({
    queryKey: ['admin-scommesse', seasonId],
    queryFn: () => adminApi.getScommesse(seasonId ? { seasonId } : {}).then((r) => r.data),
    enabled: !!seasonId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-scommesse', seasonId] })
  const unresolveBet = useMutation({ mutationFn: (betId) => adminApi.unresolveScommessa(betId), onSuccess: invalidate })
  const voidBet = useMutation({ mutationFn: (betId) => adminApi.voidScommessa(betId), onSuccess: invalidate })
  const deleteBet = useMutation({ mutationFn: (betId) => adminApi.deleteScommessa(betId), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore') })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Scommesse · fine campionato</h1>
      </div>

      <div className="mb-6 max-w-xs">
        <label className="text-sm font-medium text-gds-dark">Stagione</label>
        <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
          <option value="">-- Seleziona --</option>
          {seasons?.map((s) => <option key={s.id} value={s.id}>{s.label}{s.isCurrent ? ' (corrente)' : ''}</option>)}
        </select>
      </div>

      {!seasonId ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray"><Coins size={40} className="mx-auto mb-3 text-gray-300" />Seleziona una stagione.</div>
      ) : (
        <>
          <p className="text-sm text-gds-gray mb-4">
            Le scommesse di fine campionato le aprono direttamente i giocatori (lega + mercato + bersaglio).
            Qui dichiari il <strong>risultato ufficiale</strong>: tutte le giocate corrispondenti vengono risolte.
          </p>

          <ResultForm seasonId={seasonId} onSaved={invalidate} />

          <h2 className="text-lg font-bold text-gds-dark mt-8 mb-3">Scommesse della stagione</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : bets?.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gds-gray">Nessuna giocata ancora. Appena un utente gioca, la scommessa comparirà qui.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {bets?.map((bet) => (
                <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gds-dark">{bet.label}</p>
                      <p className="text-xs text-gds-gray">{marketLabel(bet.market)} · {bet.giocateCount} giocate</p>
                    </div>
                    <Badge color={BET_COLOR[bet.status]}>{bet.status}</Badge>
                  </div>
                  {bet.status === 'RESOLVED' ? (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1"><Check size={15} /> {bet.officialResultLabel}</span>
                      <button onClick={() => unresolveBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-gds-pink inline-flex items-center gap-1"><RotateCcw size={13} /> Annulla esito</button>
                    </div>
                  ) : bet.status === 'VOID' ? (
                    <p className="mt-3 text-sm text-gds-gray italic">Annullata</p>
                  ) : (
                    <p className="mt-3 text-xs text-gds-gray">Esito non ancora dichiarato (usa il riquadro sopra).</p>
                  )}
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end gap-3">
                    {bet.status !== 'VOID' && <button onClick={() => voidBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-yellow-600 inline-flex items-center gap-1">Annulla</button>}
                    <button onClick={() => { if (confirm('Eliminare la scommessa e le sue giocate?')) deleteBet.mutate(bet.id) }} className="text-xs text-gds-gray hover:text-red-600 inline-flex items-center gap-1">Elimina</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* Riquadro per dichiarare il risultato ufficiale di (lega + mercato). */
function ResultForm({ seasonId, onSaved }) {
  const [leagueId, setLeagueId] = useState('')
  const [market, setMarket] = useState('TOP_SCORER')
  const [ref, setRef] = useState('')
  const [msg, setMsg] = useState(null)

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

  const save = useMutation({
    mutationFn: () => adminApi.setSeasonResult({ seasonId: Number(seasonId), leagueId: Number(leagueId), market, officialResultRef: ref }),
    onSuccess: () => { setMsg({ type: 'ok', text: 'Risultato salvato e giocate risolte' }); setRef(''); onSaved?.() },
    onError: (e) => setMsg({ type: 'err', text: e.response?.data?.error || 'Errore' }),
  })

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="font-semibold text-gds-dark mb-3 inline-flex items-center gap-2"><Trophy size={16} className="text-gds-pink" /> Dichiara risultato</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gds-dark">Lega</label>
          <select value={leagueId} onChange={(e) => { setLeagueId(e.target.value); setRef('') }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
            <option value="">-- Seleziona --</option>
            {leagues?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gds-dark">Mercato</label>
          <select value={market} onChange={(e) => { setMarket(e.target.value); setRef('') }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
            {SEASON_MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      {leagueId && (
        <div className="flex flex-col gap-1 mt-3">
          <label className="text-sm font-medium text-gds-dark">Vincitore ({def.target === 'TEAM' ? 'squadra' : (def.gk ? 'portiere' : 'giocatore')})</label>
          <select value={ref} onChange={(e) => setRef(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink max-w-md">
            <option value="">-- Seleziona --</option>
            {def.target === 'TEAM'
              ? (teams || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)
              : (players || []).map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {roleLabel(p.role)} · {p.teamName}</option>)}
          </select>
        </div>
      )}
      {msg && <div className={`mt-3 text-sm rounded-lg p-2.5 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
      <div className="flex justify-end mt-3">
        <Button onClick={() => { setMsg(null); save.mutate() }} loading={save.isPending} disabled={!leagueId || !ref}>Salva risultato</Button>
      </div>
    </div>
  )
}
