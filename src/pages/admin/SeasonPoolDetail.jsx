import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { ArrowLeft, Plus, Trash2, Check, Undo2, Play, Lock, Cog } from 'lucide-react'

const BET_TYPES = [
  { value: 'WINNER',              label: 'Vincitore',         target: 'TEAM' },
  { value: 'TOP_SCORER',          label: 'Capocannoniere',    target: 'PLAYER' },
  { value: 'TOP_ASSIST',          label: 'Miglior assist',    target: 'PLAYER' },
  { value: 'CLEAN_SHEET_TEAM',    label: 'Porta inviolata',   target: 'TEAM' },
  { value: 'BEST_GOALKEEPER',     label: 'Miglior portiere',  target: 'PLAYER' },
  { value: 'MOST_GOALS_FOR',      label: 'Miglior attacco',   target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Miglior difesa',    target: 'TEAM' },
]

const STATUS_LABELS = {
  DRAFT: 'Bozza', OPEN: 'Aperta', CLOSED: 'Chiusa', PROCESSED: 'Elaborata', CANCELLED: 'Annullata',
}

export default function SeasonPoolDetail({ basePath = '/admin' }) {
  const { id } = useParams()
  const poolId = Number(id)
  const queryClient = useQueryClient()
  const [betModalOpen, setBetModalOpen] = useState(false)
  const [resolveBet, setResolveBet] = useState(null)
  const [resolveChoice, setResolveChoice] = useState('')

  const { data: pool, isLoading } = useQuery({
    queryKey: ['admin-season-pool', poolId],
    queryFn: () => adminApi.getSeasonPool(poolId).then((r) => r.data),
  })

  const { data: bets } = useQuery({
    queryKey: ['admin-season-bets', poolId],
    queryFn: () => adminApi.getSeasonBets(poolId).then((r) => r.data),
  })

  const { data: tournaments } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => adminApi.getTournaments().then((r) => r.data),
  })

  const { data: teams } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => adminApi.getTeams().then((r) => r.data),
  })

  const { data: players } = useQuery({
    queryKey: ['admin-players'],
    queryFn: () => adminApi.getPlayers().then((r) => r.data),
  })

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm()
  const selectedTournamentId = watch('tournamentId')
  const selectedBetType = watch('betType')

  const createBetMutation = useMutation({
    mutationFn: (data) => adminApi.createSeasonBet(poolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-season-bets', poolId] })
      queryClient.invalidateQueries({ queryKey: ['admin-season-pool', poolId] })
      setBetModalOpen(false); reset()
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore creazione bet'),
  })

  const deleteBetMutation = useMutation({
    mutationFn: (betId) => adminApi.deleteSeasonBet(poolId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-season-bets', poolId] })
      queryClient.invalidateQueries({ queryKey: ['admin-season-pool', poolId] })
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore eliminazione'),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ betId, ref }) => adminApi.resolveSeasonBet(poolId, betId, ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-season-bets', poolId] })
      queryClient.invalidateQueries({ queryKey: ['admin-season-pool', poolId] })
      setResolveBet(null); setResolveChoice('')
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore risoluzione'),
  })

  const unresolveMutation = useMutation({
    mutationFn: (betId) => adminApi.unresolveSeasonBet(poolId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-season-bets', poolId] })
      queryClient.invalidateQueries({ queryKey: ['admin-season-pool', poolId] })
    },
  })

  const lifecycleMutation = useMutation({
    mutationFn: ({ action }) => {
      if (action === 'open')    return adminApi.openSeasonPool(poolId)
      if (action === 'close')   return adminApi.closeSeasonPool(poolId)
      if (action === 'process') return adminApi.processSeasonPool(poolId)
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-season-pool', poolId] })
      queryClient.invalidateQueries({ queryKey: ['admin-season-bets', poolId] })
      if (vars.action === 'process') {
        const d = res.data
        alert(`Processing completato.\nBet risolti: ${d.resolvedBets}/${d.totalBets}\nSchedine: ${d.couponsProcessed}\nVincitori: ${d.winners}\nNuovo stato: ${d.status}`)
      }
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore'),
  })

  const targetKind = useMemo(() => {
    const bt = BET_TYPES.find((t) => t.value === selectedBetType)
    return bt?.target
  }, [selectedBetType])

  if (isLoading || !pool) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }

  function openAddBet() {
    reset({ tournamentId: '', betType: 'WINNER', label: '' })
    setBetModalOpen(true)
  }

  async function onCreateBet(data) {
    await createBetMutation.mutateAsync({
      tournamentId: Number(data.tournamentId),
      betType: data.betType,
      label: data.label || null,
    })
  }

  function onConfirmResolve() {
    if (!resolveChoice) { alert('Seleziona un valore'); return }
    resolveMutation.mutate({ betId: resolveBet.id, ref: String(resolveChoice) })
  }

  const optionsForBet = (bet) => {
    if (bet.targetKind === 'TEAM') return teams || []
    return (players || []).map((p) => ({ id: p.id, name: p.fullName + (p.teamName ? ` (${p.teamName})` : '') }))
  }

  const canOpen    = pool.status === 'DRAFT'
  const canClose   = pool.status === 'OPEN'
  const canProcess = pool.status === 'CLOSED' || pool.status === 'PROCESSED'

  return (
    <div>
      <Link to={`${basePath}/season-pools`} className="inline-flex items-center gap-1 text-sm text-gds-pink hover:underline mb-4">
        <ArrowLeft size={14} /> Torna alle pool
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gds-dark">{pool.name}</h1>
          <p className="text-sm text-gds-gray mt-1">
            Stagione {pool.seasonLabel} · Stato <strong>{STATUS_LABELS[pool.status]}</strong> · {pool.resolvedBetsCount}/{pool.betsCount} bet risolti
          </p>
          {pool.winningThresholds?.length > 0 && (
            <p className="text-xs text-gds-gray mt-1">Soglie vincita: [{pool.winningThresholds.join(', ')}]</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canOpen && (
            <Button onClick={() => lifecycleMutation.mutate({ action: 'open' })}>
              <Play size={14} /> Apri pool
            </Button>
          )}
          {canClose && (
            <Button variant="secondary" onClick={() => lifecycleMutation.mutate({ action: 'close' })}>
              <Lock size={14} /> Chiudi pool
            </Button>
          )}
          {canProcess && (
            <Button onClick={() => lifecycleMutation.mutate({ action: 'process' })}>
              <Cog size={14} /> Processing
            </Button>
          )}
        </div>
      </div>

      {/* Sezione bet */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gds-dark">Pronostici configurati</h2>
          {pool.status === 'DRAFT' && (
            <Button onClick={openAddBet}>
              <Plus size={14} /> Aggiungi
            </Button>
          )}
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-gds-gray">
              <th className="px-4 py-2 text-left font-semibold">Etichetta</th>
              <th className="px-4 py-2 text-left font-semibold">Torneo</th>
              <th className="px-4 py-2 text-left font-semibold">Tipo</th>
              <th className="px-4 py-2 text-left font-semibold">Stato</th>
              <th className="px-4 py-2 text-left font-semibold">Risultato</th>
              <th className="px-4 py-2 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {bets?.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gds-gray">Nessun pronostico configurato.</td></tr>
            )}
            {bets?.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gds-dark">{b.label}</td>
                <td className="px-4 py-2 text-gds-gray">{b.tournamentName}</td>
                <td className="px-4 py-2 text-gds-gray text-xs">{b.betType}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${b.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {b.status === 'RESOLVED' ? 'Risolto' : 'In attesa'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gds-dark">{b.officialResultLabel || '—'}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    {b.status === 'PENDING' && pool.status !== 'DRAFT' && (
                      <button
                        onClick={() => { setResolveBet(b); setResolveChoice('') }}
                        className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Risolvi"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {b.status === 'RESOLVED' && (
                      <button
                        onClick={() => unresolveMutation.mutate(b.id)}
                        className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                        title="Annulla risoluzione"
                      >
                        <Undo2 size={15} />
                      </button>
                    )}
                    {pool.status === 'DRAFT' && (
                      <button
                        onClick={() => { if (confirm('Eliminare questo pronostico?')) deleteBetMutation.mutate(b.id) }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Modal aggiungi bet */}
      <Modal isOpen={betModalOpen} onClose={() => setBetModalOpen(false)} title="Aggiungi pronostico">
        <form onSubmit={handleSubmit(onCreateBet)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Torneo</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('tournamentId', { required: true })}
            >
              <option value="">— Seleziona —</option>
              {tournaments?.filter((t) => t.isActive).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Tipo di pronostico</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('betType', { required: true })}
            >
              {BET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} ({t.target === 'TEAM' ? 'squadra' : 'giocatore'})</option>
              ))}
            </select>
            {targetKind && (
              <p className="text-xs text-gds-gray">L'utente sceglierà fra le {targetKind === 'TEAM' ? 'squadre' : 'giocatori'}.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Etichetta (opzionale)</label>
            <input
              type="text"
              placeholder="es. Vincitore Scudetto Serie A"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('label')}
            />
            <p className="text-xs text-gds-gray">Se vuota, viene generata automaticamente da tipo + torneo.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setBetModalOpen(false)}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>Crea</Button>
          </div>
        </form>
      </Modal>

      {/* Modal risolvi bet */}
      <Modal isOpen={!!resolveBet} onClose={() => setResolveBet(null)} title={resolveBet ? `Risolvi: ${resolveBet.label}` : ''}>
        {resolveBet && (
          <div className="space-y-4">
            <p className="text-sm text-gds-gray">
              Seleziona la <strong>{resolveBet.targetKind === 'TEAM' ? 'squadra' : 'giocatore'}</strong> vincitore.
            </p>
            <select
              value={resolveChoice}
              onChange={(e) => setResolveChoice(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
            >
              <option value="">— Seleziona —</option>
              {optionsForBet(resolveBet).map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setResolveBet(null)}>Annulla</Button>
              <Button onClick={onConfirmResolve} loading={resolveMutation.isPending}>Conferma</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
