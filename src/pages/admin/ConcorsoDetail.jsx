import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { ArrowLeft, Plus, Trash2, Check, RotateCcw, Ban, Lock, Unlock, Cog } from 'lucide-react'

const MARKETS = [
  { value: 'RESULT_1X2', label: 'Esito 1X2', target: 'TOKEN' },
  { value: 'UNDER_OVER', label: 'Under/Over', target: 'TOKEN' },
  { value: 'GOAL_NOGOAL', label: 'Gol/No gol', target: 'TOKEN' },
  { value: 'WINNER', label: 'Vincitore', target: 'TEAM' },
  { value: 'CLEAN_SHEET_TEAM', label: 'Più clean sheet', target: 'TEAM' },
  { value: 'MOST_GOALS_FOR', label: 'Più gol fatti', target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Meno gol subiti', target: 'TEAM' },
  { value: 'FIRST_SCORER', label: 'Primo marcatore', target: 'PLAYER' },
  { value: 'TOP_SCORER', label: 'Capocannoniere', target: 'PLAYER' },
  { value: 'TOP_ASSIST', label: 'Miglior assist', target: 'PLAYER' },
  { value: 'BEST_GOALKEEPER', label: 'Miglior portiere', target: 'PLAYER' },
]
const targetOf = (m) => MARKETS.find((x) => x.value === m)?.target ?? 'TOKEN'
const STATUS_COLOR = { DRAFT: 'gray', OPEN: 'green', CLOSED: 'yellow', PROCESSED: 'blue', CANCELLED: 'red' }
const BET_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }

export default function ConcorsoDetail() {
  const { id } = useParams()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [options, setOptions] = useState([]) // [{ref,label}] per mercati TEAM/PLAYER

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { market: 'RESULT_1X2', label: '', overUnderLine: 3.5 },
  })
  const market = watch('market')
  const target = targetOf(market)

  const { data: concorso, isLoading } = useQuery({
    queryKey: ['admin-concorso', id],
    queryFn: () => adminApi.getConcorso(id).then((r) => r.data),
  })
  const { data: bets } = useQuery({
    queryKey: ['admin-scommesse', id],
    queryFn: () => adminApi.getScommesse({ concorsoId: id }).then((r) => r.data),
  })
  const { data: schedine } = useQuery({
    queryKey: ['admin-schedine', id],
    queryFn: () => adminApi.getSchedineByConcorso(id).then((r) => r.data),
  })
  const { data: teams } = useQuery({ queryKey: ['admin-teams-all'], queryFn: () => adminApi.getTeams().then((r) => r.data) })
  const { data: players } = useQuery({ queryKey: ['admin-players-all'], queryFn: () => adminApi.getPlayers().then((r) => r.data) })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-scommesse', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-concorso', id] })
  }
  const invalidateAll = () => {
    invalidate()
    queryClient.invalidateQueries({ queryKey: ['admin-schedine', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-concorsi'] })
  }

  const createBet = useMutation({ mutationFn: (d) => adminApi.createScommessa(d), onSuccess: () => { invalidate(); closeModal() } })
  const resolveBet = useMutation({ mutationFn: ({ betId, ref }) => adminApi.resolveScommessa(betId, ref), onSuccess: invalidate })
  const unresolveBet = useMutation({ mutationFn: (betId) => adminApi.unresolveScommessa(betId), onSuccess: invalidate })
  const voidBet = useMutation({ mutationFn: (betId) => adminApi.voidScommessa(betId), onSuccess: invalidate })
  const deleteBet = useMutation({ mutationFn: (betId) => adminApi.deleteScommessa(betId), onSuccess: invalidate })
  const openC = useMutation({ mutationFn: () => adminApi.openConcorso(id), onSuccess: invalidateAll })
  const closeC = useMutation({ mutationFn: () => adminApi.closeConcorso(id), onSuccess: invalidateAll })
  const processC = useMutation({ mutationFn: () => adminApi.processConcorso(id), onSuccess: invalidateAll })

  function openCreate() {
    reset({ market: 'RESULT_1X2', label: '', overUnderLine: 3.5 })
    setOptions([])
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); reset(); setOptions([]) }

  function toggleOption(ref, label) {
    setOptions((prev) => prev.some((o) => o.ref === ref)
      ? prev.filter((o) => o.ref !== ref)
      : [...prev, { ref: String(ref), label }])
  }

  async function onSubmit(data) {
    const payload = {
      concorsoId: Number(id),
      label: data.label,
      market: data.market,
    }
    if (data.market === 'UNDER_OVER') payload.overUnderLine = Number(data.overUnderLine)
    if (target !== 'TOKEN') {
      if (options.length < 2) { alert('Seleziona almeno 2 opzioni'); return }
      payload.options = options
    }
    await createBet.mutateAsync(payload)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!concorso) return <div className="text-gds-gray">Concorso non trovato.</div>

  const refLabel = (bet, ref) => bet.options?.find((o) => o.ref === ref)?.label ?? ref

  return (
    <div>
      <Link to={`${basePath}/concorsi`} className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Concorsi
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gds-dark">{concorso.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={STATUS_COLOR[concorso.status]}>{concorso.status}</Badge>
            <span className="text-sm text-gds-gray">{concorso.kind === 'SEASON' ? 'Stagionale' : 'Giornata'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {concorso.status === 'DRAFT' && <Button variant="secondary" onClick={() => openC.mutate()}><Unlock size={16} /> Apri</Button>}
          {concorso.status === 'OPEN' && <Button variant="secondary" onClick={() => closeC.mutate()}><Lock size={16} /> Chiudi</Button>}
          {(concorso.status === 'CLOSED' || concorso.status === 'PROCESSED') &&
            <Button variant="secondary" onClick={() => processC.mutate()} loading={processC.isPending}><Cog size={16} /> Elabora</Button>}
        </div>
      </div>

      {/* Scommesse */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gds-dark">Scommesse ({bets?.length ?? 0})</h2>
        <Button size="sm" onClick={openCreate}><Plus size={15} /> Aggiungi</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {bets?.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gds-gray col-span-full">Nessuna scommessa. Aggiungine una.</div>}
        {bets?.map((bet) => (
          <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gds-dark">{bet.label}</p>
                <p className="text-xs text-gds-gray">{MARKETS.find((m) => m.value === bet.market)?.label ?? bet.market}</p>
              </div>
              <Badge color={BET_COLOR[bet.status]}>{bet.status}</Badge>
            </div>

            {bet.status === 'RESOLVED' ? (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1">
                  <Check size={15} /> Esito: {refLabel(bet, bet.officialResultRef)}
                </span>
                <button onClick={() => unresolveBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-gds-pink inline-flex items-center gap-1">
                  <RotateCcw size={13} /> Annulla esito
                </button>
              </div>
            ) : bet.status === 'VOID' ? (
              <p className="mt-3 text-sm text-gds-gray italic">Scommessa annullata (non conteggiata)</p>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-gds-gray mb-1.5">Imposta l'esito vincente:</p>
                <div className="flex flex-wrap gap-1.5">
                  {bet.options?.map((o) => (
                    <button key={o.id} onClick={() => resolveBet.mutate({ betId: bet.id, ref: o.ref })}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 hover:border-gds-pink hover:bg-gds-pink-light text-gds-dark transition-colors">
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end gap-3">
              {bet.status !== 'VOID' && (
                <button onClick={() => voidBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-yellow-600 inline-flex items-center gap-1"><Ban size={13} /> Annulla</button>
              )}
              <button onClick={() => deleteBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-red-600 inline-flex items-center gap-1"><Trash2 size={13} /> Elimina</button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedine */}
      <h2 className="text-lg font-bold text-gds-dark mb-3">Schedine ({schedine?.length ?? 0})</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-2.5 text-left font-semibold">ID</th>
              <th className="px-4 py-2.5 text-left font-semibold">Utente</th>
              <th className="px-4 py-2.5 text-left font-semibold">Stato</th>
              <th className="px-4 py-2.5 text-left font-semibold">Punti</th>
              <th className="px-4 py-2.5 text-left font-semibold">Vincente</th>
            </tr>
          </thead>
          <tbody>
            {schedine?.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gds-gray">Nessuna schedina.</td></tr>}
            {schedine?.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-2.5 text-gds-gray">#{s.id}</td>
                <td className="px-4 py-2.5 text-gds-gray">{s.userId}</td>
                <td className="px-4 py-2.5"><Badge color={s.status === 'WINNING' ? 'green' : s.status === 'NOT_WINNING' ? 'red' : 'gray'}>{s.status}</Badge></td>
                <td className="px-4 py-2.5 font-semibold text-gds-dark">{s.correctCount ?? '—'}</td>
                <td className="px-4 py-2.5">{s.isWinner ? '🏆' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Modal nuova scommessa */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Nuova scommessa" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Mercato</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('market')}>
              {MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <Input label="Etichetta" placeholder="es. Milan–Inter · Esito" error={errors.label?.message}
            {...register('label', { required: 'Etichetta obbligatoria' })} />

          {market === 'UNDER_OVER' && (
            <Input label="Soglia Under/Over" type="number" step="0.5" {...register('overUnderLine')} />
          )}

          {target === 'TOKEN' && (
            <p className="text-xs text-gds-gray bg-gds-gray-light rounded-lg p-3">
              Le opzioni ({market === 'RESULT_1X2' ? '1 / X / 2' : market === 'UNDER_OVER' ? 'Under / Over' : 'Gol / No gol'}) vengono generate automaticamente.
            </p>
          )}

          {target === 'TEAM' && (
            <OptionPicker label="Squadre candidate" items={teams} getRef={(t) => t.id} getLabel={(t) => t.name} options={options} toggle={toggleOption} />
          )}
          {target === 'PLAYER' && (
            <OptionPicker label="Giocatori candidati" items={players} getRef={(p) => p.id}
              getLabel={(p) => `${p.firstName} ${p.lastName}`} options={options} toggle={toggleOption} />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>Crea</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function OptionPicker({ label, items, getRef, getLabel, options, toggle }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gds-dark">{label} ({options.length} selezionate)</label>
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
        {(!items || items.length === 0) && <p className="text-xs text-gds-gray px-1">Nessun elemento. Crea prima le anagrafiche.</p>}
        {items?.map((it) => {
          const ref = String(getRef(it))
          const checked = options.some((o) => o.ref === ref)
          return (
            <label key={ref} className="flex items-center gap-2 text-sm px-1 py-0.5 hover:bg-gds-gray-light rounded cursor-pointer">
              <input type="checkbox" checked={checked} onChange={() => toggle(ref, getLabel(it))}
                className="rounded border-gray-300 text-gds-pink focus:ring-gds-pink" />
              {getLabel(it)}
            </label>
          )
        })}
      </div>
    </div>
  )
}
