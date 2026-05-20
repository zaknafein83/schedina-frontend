import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'

const STATUS_LABELS = {
  DRAFT: 'Bozza',
  OPEN: 'Aperta',
  CLOSED: 'Chiusa',
  PROCESSED: 'Elaborata',
  CANCELLED: 'Annullata',
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-200 text-gray-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-yellow-100 text-yellow-800',
  PROCESSED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function SeasonPools({ basePath = '/admin' }) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: seasons } = useQuery({
    queryKey: ['admin-seasons'],
    queryFn: () => adminApi.getSeasons().then((r) => r.data),
  })

  const { data: pools, isLoading } = useQuery({
    queryKey: ['admin-season-pools'],
    queryFn: () => adminApi.getSeasonPools().then((r) => r.data),
  })

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createSeasonPool(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-season-pools'] }); closeModal() },
    onError: (err) => alert(err.response?.data?.error || 'Errore creazione'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateSeasonPool(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-season-pools'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteSeasonPool(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-season-pools'] }),
    onError: (err) => alert(err.response?.data?.error || 'Errore eliminazione'),
  })

  function openCreate() {
    setEditing(null)
    reset({
      seasonId: seasons?.find((s) => s.isCurrent)?.id || '',
      name: '',
      description: '',
      openAt: '',
      closeAt: '',
      winningThresholds: '',
    })
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditing(p)
    reset({
      seasonId: p.seasonId,
      name: p.name,
      description: p.description || '',
      openAt: p.openAt ? p.openAt.slice(0, 16) : '',
      closeAt: p.closeAt ? p.closeAt.slice(0, 16) : '',
      winningThresholds: (p.winningThresholds || []).join(','),
    })
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const thresholds = (data.winningThresholds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
    const payload = {
      seasonId: Number(data.seasonId),
      name: data.name,
      description: data.description || null,
      openAt: data.openAt || null,
      closeAt: data.closeAt || null,
      winningThresholds: thresholds,
    }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload })
    else await createMutation.mutateAsync(payload)
  }

  function handleDelete(p) {
    if (confirm(`Eliminare la pool "${p.name}"?`)) deleteMutation.mutate(p.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Pool stagionali</h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nuova pool
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Nome</th>
                <th className="px-6 py-3 text-left font-semibold">Stagione</th>
                <th className="px-6 py-3 text-left font-semibold">Stato</th>
                <th className="px-6 py-3 text-left font-semibold">Pronostici</th>
                <th className="px-6 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {pools?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gds-gray">Nessuna pool.</td></tr>
              )}
              {pools?.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                  <td className="px-6 py-3 text-gds-gray">{p.id}</td>
                  <td className="px-6 py-3 font-medium text-gds-dark">{p.name}</td>
                  <td className="px-6 py-3 text-gds-gray">{p.seasonLabel || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gds-gray text-xs">
                    {p.resolvedBetsCount} / {p.betsCount} risolti
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`${basePath}/season-pools/${p.id}`}
                        className="p-2 rounded-lg hover:bg-gds-pink-light text-gds-pink transition-colors"
                        title="Dettaglio"
                      >
                        <ChevronRight size={15} />
                      </Link>
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica pool' : 'Nuova pool'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Stagione</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('seasonId', { required: 'Stagione obbligatoria' })}
            >
              <option value="">— Seleziona —</option>
              {seasons?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}{s.isCurrent ? ' (corrente)' : ''}
                </option>
              ))}
            </select>
            {errors.seasonId && <p className="text-xs text-red-600">{errors.seasonId.message}</p>}
          </div>
          <Input
            label="Nome"
            placeholder="Pronostici Stagione 2025-26"
            error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Descrizione (opzionale)</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Apertura" type="datetime-local" {...register('openAt')} />
            <Input label="Chiusura" type="datetime-local" {...register('closeAt')} />
          </div>
          <Input
            label="Soglie di vincita (es. 7,8,9)"
            placeholder="7,8,9"
            {...register('winningThresholds')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Salva' : 'Crea'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
