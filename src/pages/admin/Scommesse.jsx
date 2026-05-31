import { useState, useEffect } from 'react'
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
  { value: 'TOP_SCORER', label: 'Capocannoniere', target: 'PLAYER' },
  { value: 'TOP_ASSIST', label: 'Miglior assist', target: 'PLAYER' },
  { value: 'BEST_GOALKEEPER', label: 'Miglior portiere', target: 'PLAYER', gk: true },
  { value: 'CLEAN_SHEET', label: 'Più clean sheet', target: 'PLAYER', gk: true },
  { value: 'MOST_GOALS_FOR', label: 'Più gol fatti', target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Meno gol subiti', target: 'TEAM' },
]
const ROLE_LABEL = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', FWD: 'Attaccante' }
const roleLabel = (r) => ROLE_LABEL[r] ?? r ?? ''
const marketLabel = (m) => MARKETS.find((x) => x.value === m)?.label ?? m
const marketDef = (m) => MARKETS.find((x) => x.value === m) ?? {}
const BET_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }
const refLabel = (bet, ref) => bet.options?.find((o) => o.ref === ref)?.label ?? ref

export default function Scommesse() {
  const queryClient = useQueryClient()
  const [seasonId, setSeasonId] = useState('')
  const [betModal, setBetModal] = useState(false)

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
  const resolveBet = useMutation({ mutationFn: ({ betId, ref }) => adminApi.resolveScommessa(betId, ref), onSuccess: invalidate })
  const unresolveBet = useMutation({ mutationFn: (betId) => adminApi.unresolveScommessa(betId), onSuccess: invalidate })
  const voidBet = useMutation({ mutationFn: (betId) => adminApi.voidScommessa(betId), onSuccess: invalidate })
  const deleteBet = useMutation({ mutationFn: (betId) => adminApi.deleteScommessa(betId), onSuccess: invalidate })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Scommesse · fine campionato</h1>
        <Button onClick={() => setBetModal(true)} disabled={!seasonId}><Plus size={16} /> Nuova scommessa</Button>
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
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {bets?.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gds-gray col-span-full">Nessuna scommessa.</div>}
          {bets?.map((bet) => (
            <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold text-gds-dark">{bet.label}</p><p className="text-xs text-gds-gray">{marketLabel(bet.market)}</p></div>
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

      <AddBetModal isOpen={betModal} onClose={() => setBetModal(false)} seasonId={seasonId} onCreated={invalidate} />
    </div>
  )
}

function AddBetModal({ isOpen, onClose, seasonId, onCreated }) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { market: 'TOP_SCORER', label: '' } })
  const market = watch('market')
  const def = marketDef(market)
  const [options, setOptions] = useState([])
  const [err, setErr] = useState('')

  const { data: teams } = useQuery({ queryKey: ['admin-teams-all'], queryFn: () => adminApi.getTeams().then((r) => r.data) })
  const { data: players } = useQuery({ queryKey: ['admin-players-all'], queryFn: () => adminApi.getPlayers().then((r) => r.data) })

  const playerItems = (players || []).filter((p) => !def.gk || p.role === 'GK')

  const create = useMutation({
    mutationFn: (payload) => adminApi.createScommessa(payload),
    onSuccess: () => { close(); onCreated() },
    onError: (e) => setErr(e.response?.data?.error || 'Errore'),
  })

  function toggle(ref, label) {
    setOptions((prev) => prev.some((o) => o.ref === ref) ? prev.filter((o) => o.ref !== ref) : [...prev, { ref: String(ref), label }])
  }
  function close() { reset(); setOptions([]); setErr(''); onClose() }
  function onSubmit(data) {
    setErr('')
    if (options.length < 1) return setErr('Seleziona almeno 1 opzione')
    create.mutate({ label: data.label, market: data.market, seasonId: Number(seasonId), options })
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Nuova scommessa di fine campionato" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gds-dark">Mercato</label>
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink"
            {...register('market')} onChange={(e) => { setOptions([]); register('market').onChange(e) }}>
            {MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <Input label="Etichetta" placeholder="es. Capocannoniere Serie A" error={errors.label?.message} {...register('label', { required: 'Etichetta obbligatoria' })} />
        {def.target === 'TEAM'
          ? <OptionPicker label="Squadre candidate" items={teams} getRef={(t) => t.id} getLabel={(t) => t.name} options={options} toggle={toggle} />
          : <OptionPicker label={def.gk ? 'Portieri candidati' : 'Giocatori candidati'} items={playerItems} getRef={(p) => p.id} getLabel={(p) => `${p.firstName} ${p.lastName}`} getMeta={(p) => [roleLabel(p.role), p.teamName].filter(Boolean).join(' · ')} options={options} toggle={toggle} />}
        {err && <div className="bg-red-50 text-red-700 rounded-lg p-2.5 text-sm">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>Annulla</Button>
          <Button type="submit" loading={isSubmitting || create.isPending}>Crea</Button>
        </div>
      </form>
    </Modal>
  )
}

function OptionPicker({ label, items, getRef, getLabel, getMeta, options, toggle }) {
  const [q, setQ] = useState('')
  const meta = (it) => (getMeta ? getMeta(it) : '')
  const filtered = (items || []).filter((it) => `${getLabel(it)} ${meta(it)}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gds-dark">{label} ({options.length} selezionate)</label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtra per nome, ruolo o squadra…"
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gds-pink mb-1" />
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
        {filtered.length === 0 && <p className="text-xs text-gds-gray px-1">Nessun elemento.</p>}
        {filtered.map((it) => {
          const ref = String(getRef(it))
          const m = meta(it)
          return (
            <label key={ref} className="flex items-center gap-2 text-sm px-1 py-0.5 hover:bg-gds-gray-light rounded cursor-pointer">
              <input type="checkbox" checked={options.some((o) => o.ref === ref)} onChange={() => toggle(ref, getLabel(it))} className="rounded text-gds-pink focus:ring-gds-pink" />
              <span className="flex-1">{getLabel(it)}</span>
              {m && <span className="text-xs text-gds-gray shrink-0">{m}</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
