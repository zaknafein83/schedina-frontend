import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Trash2, Check, RotateCcw, Ban, Coins } from 'lucide-react'

const MARKETS = [
  { value: 'GOAL_NOGOAL', label: 'Gol/No gol', target: 'TOKEN' },
  { value: 'EXACT_SCORE', label: 'Risultato esatto', target: 'TOKEN' },
  { value: 'WINNER', label: 'Vincitore', target: 'TEAM' },
  { value: 'CLEAN_SHEET_TEAM', label: 'Più clean sheet', target: 'TEAM' },
  { value: 'MOST_GOALS_FOR', label: 'Più gol fatti', target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Meno gol subiti', target: 'TEAM' },
  { value: 'FIRST_SCORER', label: 'Primo marcatore', target: 'PLAYER' },
  { value: 'TOP_SCORER', label: 'Capocannoniere', target: 'PLAYER' },
  { value: 'TOP_ASSIST', label: 'Miglior assist', target: 'PLAYER' },
  { value: 'BEST_GOALKEEPER', label: 'Miglior portiere', target: 'PLAYER' },
]
const marketLabel = (m) => MARKETS.find((x) => x.value === m)?.label ?? m
const targetOf = (m) => MARKETS.find((x) => x.value === m)?.target ?? 'TOKEN'
const BET_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }
const refLabel = (bet, ref) => bet.options?.find((o) => o.ref === ref)?.label ?? ref

export default function Scommesse() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [scope, setScope] = useState(searchParams.get('giornataId') ? 'GIORNATA' : 'SEASON')
  const [giornataId, setGiornataId] = useState(searchParams.get('giornataId') || '')
  const [seasonId, setSeasonId] = useState('')
  const [betModal, setBetModal] = useState(false)

  const { data: giornate } = useQuery({ queryKey: ['admin-giornate'], queryFn: () => adminApi.getGiornate().then((r) => r.data) })
  const { data: seasons } = useQuery({ queryKey: ['admin-seasons'], queryFn: () => adminApi.getSeasons().then((r) => r.data) })

  // Default season alla corrente
  useEffect(() => {
    if (scope === 'SEASON' && !seasonId && seasons?.length) {
      setSeasonId(String(seasons.find((s) => s.isCurrent)?.id ?? seasons[0].id))
    }
  }, [scope, seasons, seasonId])

  const ctxId = scope === 'GIORNATA' ? giornataId : seasonId
  const params = scope === 'GIORNATA' ? { giornataId } : { seasonId }

  const { data: bets, isLoading } = useQuery({
    queryKey: ['admin-scommesse', scope, ctxId],
    queryFn: () => adminApi.getScommesse(params).then((r) => r.data),
    enabled: !!ctxId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-scommesse', scope, ctxId] })
  const resolveBet = useMutation({ mutationFn: ({ betId, ref }) => adminApi.resolveScommessa(betId, ref), onSuccess: invalidate })
  const unresolveBet = useMutation({ mutationFn: (betId) => adminApi.unresolveScommessa(betId), onSuccess: invalidate })
  const voidBet = useMutation({ mutationFn: (betId) => adminApi.voidScommessa(betId), onSuccess: invalidate })
  const deleteBet = useMutation({ mutationFn: (betId) => adminApi.deleteScommessa(betId), onSuccess: invalidate })

  function changeScope(s) {
    setScope(s)
    if (s === 'SEASON') setSearchParams({})
  }
  function changeGiornata(v) {
    setGiornataId(v)
    setSearchParams(v ? { giornataId: v } : {})
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Scommesse extra</h1>
        <Button onClick={() => setBetModal(true)} disabled={!ctxId}><Plus size={16} /> Nuova scommessa</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gds-dark">Tipo</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => changeScope('SEASON')}
              className={`px-4 py-2 text-sm font-medium ${scope === 'SEASON' ? 'bg-gds-pink text-white' : 'bg-white text-gds-dark'}`}>Fine stagione</button>
            <button onClick={() => changeScope('GIORNATA')}
              className={`px-4 py-2 text-sm font-medium ${scope === 'GIORNATA' ? 'bg-gds-pink text-white' : 'bg-white text-gds-dark'}`}>Di giornata</button>
          </div>
        </div>
        {scope === 'GIORNATA' ? (
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-sm font-medium text-gds-dark">Giornata</label>
            <select value={giornataId} onChange={(e) => changeGiornata(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
              <option value="">-- Seleziona --</option>
              {giornate?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-sm font-medium text-gds-dark">Stagione</label>
            <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
              <option value="">-- Seleziona --</option>
              {seasons?.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (corrente)' : ''}</option>)}
            </select>
          </div>
        )}
      </div>

      {!ctxId ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <Coins size={40} className="mx-auto mb-3 text-gray-300" />
          Seleziona {scope === 'GIORNATA' ? 'una giornata' : 'una stagione'} per gestire le scommesse.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {bets?.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gds-gray col-span-full">Nessuna scommessa.</div>}
          {bets?.map((bet) => (
            <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold text-gds-dark">{bet.label}</p>
                  <p className="text-xs text-gds-gray">{marketLabel(bet.market)}{bet.resolutionMode === 'AUTO' ? ' · auto' : ''}</p></div>
                <Badge color={BET_COLOR[bet.status]}>{bet.status}</Badge>
              </div>
              {bet.status === 'RESOLVED' ? (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1"><Check size={15} /> {refLabel(bet, bet.officialResultRef)}</span>
                  <button onClick={() => unresolveBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-gds-pink inline-flex items-center gap-1"><RotateCcw size={13} /> Annulla esito</button>
                </div>
              ) : bet.status === 'VOID' ? (
                <p className="mt-3 text-sm text-gds-gray italic">Annullata</p>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-gds-gray mb-1.5">Imposta l'esito vincente:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bet.options?.map((o) => (
                      <button key={o.id} onClick={() => resolveBet.mutate({ betId: bet.id, ref: o.ref })}
                        className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 hover:border-gds-pink hover:bg-gds-pink-light text-gds-dark transition-colors">{o.label}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end gap-3">
                {bet.status !== 'VOID' && <button onClick={() => voidBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-yellow-600 inline-flex items-center gap-1"><Ban size={13} /> Annulla</button>}
                <button onClick={() => { if (confirm('Eliminare la scommessa?')) deleteBet.mutate(bet.id) }} className="text-xs text-gds-gray hover:text-red-600 inline-flex items-center gap-1"><Trash2 size={13} /> Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddBetModal isOpen={betModal} onClose={() => setBetModal(false)}
        scope={scope} seasonId={seasonId} giornataId={giornataId} onCreated={invalidate} />
    </div>
  )
}

/* ─── Modal: crea scommessa ──────────────────────────────────────────────────── */
function AddBetModal({ isOpen, onClose, scope, seasonId, giornataId, onCreated }) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { market: 'WINNER', label: '', matchId: '', tokens: '' } })
  const market = watch('market')
  const matchId = watch('matchId')
  const target = targetOf(market)
  const [options, setOptions] = useState([])
  const [err, setErr] = useState('')

  const { data: teams } = useQuery({ queryKey: ['admin-teams-all'], queryFn: () => adminApi.getTeams().then((r) => r.data) })
  const { data: players } = useQuery({ queryKey: ['admin-players-all'], queryFn: () => adminApi.getPlayers().then((r) => r.data) })
  const { data: matches } = useQuery({
    queryKey: ['admin-giornata-matches', giornataId],
    queryFn: () => adminApi.getMatches({ giornataId }).then((r) => r.data),
    enabled: scope === 'GIORNATA' && !!giornataId,
  })

  const create = useMutation({
    mutationFn: (payload) => adminApi.createScommessa(payload),
    onSuccess: () => { close(); onCreated() },
    onError: (e) => setErr(e.response?.data?.error || 'Errore nella creazione'),
  })

  function toggle(ref, label) {
    setOptions((prev) => prev.some((o) => o.ref === ref) ? prev.filter((o) => o.ref !== ref) : [...prev, { ref: String(ref), label }])
  }

  function onSubmit(data) {
    setErr('')
    let opts
    if (market === 'GOAL_NOGOAL') {
      opts = undefined // generate automatiche lato backend
    } else if (market === 'EXACT_SCORE') {
      opts = String(data.tokens || '').split(',').map((s) => s.trim()).filter(Boolean).map((t) => ({ ref: t, label: t }))
      if (opts.length < 2) return setErr('Inserisci almeno 2 risultati (es. 0-0, 1-0, 2-1)')
    } else {
      if (options.length < 2) return setErr('Seleziona almeno 2 opzioni')
      opts = options
    }
    create.mutate({
      scope,
      label: data.label,
      market: data.market,
      seasonId: scope === 'SEASON' ? Number(seasonId) : undefined,
      giornataId: scope === 'GIORNATA' ? Number(giornataId) : undefined,
      matchId: data.matchId ? Number(data.matchId) : undefined,
      options: opts,
    })
  }

  function close() { reset(); setOptions([]); setErr(''); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Nuova scommessa extra" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gds-dark">Mercato</label>
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('market')}>
            {MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <Input label="Etichetta" placeholder="es. Vincitore Serie A" error={errors.label?.message} {...register('label', { required: 'Etichetta obbligatoria' })} />

        {scope === 'GIORNATA' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Partita collegata (opzionale)</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('matchId')}>
              <option value="">-- Nessuna --</option>
              {matches?.map((m) => <option key={m.id} value={m.id}>{m.homeTeamName} – {m.awayTeamName}</option>)}
            </select>
            {market === 'GOAL_NOGOAL' && <p className="text-xs text-gds-gray">Con una partita collegata, Gol/No gol si risolve in automatico dal punteggio.</p>}
          </div>
        )}

        {market === 'GOAL_NOGOAL' && <p className="text-sm text-gds-gray bg-gds-gray-light rounded-lg p-3">Opzioni automatiche: <strong>Gol</strong> / <strong>No gol</strong>.</p>}
        {market === 'EXACT_SCORE' && (
          <Input label="Risultati possibili (separati da virgola)" placeholder="0-0, 1-0, 0-1, 1-1, 2-1" {...register('tokens')} />
        )}
        {target === 'TEAM' && <OptionPicker label="Squadre candidate" items={teams} getRef={(t) => t.id} getLabel={(t) => t.name} options={options} toggle={toggle} />}
        {target === 'PLAYER' && <OptionPicker label="Giocatori candidati" items={players} getRef={(p) => p.id} getLabel={(p) => `${p.firstName} ${p.lastName}`} options={options} toggle={toggle} />}

        {err && <div className="bg-red-50 text-red-700 rounded-lg p-2.5 text-sm">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>Annulla</Button>
          <Button type="submit" loading={isSubmitting || create.isPending}>Crea</Button>
        </div>
      </form>
    </Modal>
  )
}

function OptionPicker({ label, items, getRef, getLabel, options, toggle }) {
  const [q, setQ] = useState('')
  const filtered = (items || []).filter((it) => getLabel(it).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gds-dark">{label} ({options.length} selezionate)</label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtra…"
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gds-pink mb-1" />
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
        {filtered.length === 0 && <p className="text-xs text-gds-gray px-1">Nessun elemento.</p>}
        {filtered.map((it) => {
          const ref = String(getRef(it))
          return (
            <label key={ref} className="flex items-center gap-2 text-sm px-1 py-0.5 hover:bg-gds-gray-light rounded cursor-pointer">
              <input type="checkbox" checked={options.some((o) => o.ref === ref)} onChange={() => toggle(ref, getLabel(it))} className="rounded text-gds-pink focus:ring-gds-pink" />
              {getLabel(it)}
            </label>
          )
        })}
      </div>
    </div>
  )
}
