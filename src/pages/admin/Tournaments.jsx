import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const TYPES = [
  { value: 'LEAGUE_NATIONAL',   label: 'Campionato nazionale' },
  { value: 'CUP_NATIONAL',      label: 'Coppa nazionale' },
  { value: 'CUP_INTERNATIONAL', label: 'Coppa internazionale' },
]

const TYPE_LABELS = Object.fromEntries(TYPES.map((t) => [t.value, t.label]))

export default function Tournaments() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterType, setFilterType] = useState('')

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['admin-tournaments', filterType],
    queryFn: () =>
      adminApi.getTournaments(filterType ? { type: filterType } : undefined).then((r) => r.data),
  })

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createTournament(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] }); closeModal() },
    onError: (err) => alert(err.response?.data?.error || 'Errore creazione'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateTournament(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteTournament(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] }),
    onError: (err) => alert(err.response?.data?.error || 'Errore eliminazione'),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', type: 'LEAGUE_NATIONAL', country: '', isActive: true })
    setModalOpen(true)
  }

  function openEdit(t) {
    setEditing(t)
    reset({ name: t.name, type: t.type || 'LEAGUE_NATIONAL', country: t.country || '', isActive: t.isActive })
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      type: data.type,
      country: data.country || null,
      isActive: Boolean(data.isActive),
    }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload })
    else await createMutation.mutateAsync(payload)
  }

  function handleDelete(t) {
    if (confirm(`Eliminare il torneo "${t.name}"?`)) deleteMutation.mutate(t.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Tornei</h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nuovo torneo
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="text-sm font-medium text-gds-dark block mb-2">Filtra per tipo</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm
            bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
        >
          <option value="">Tutti i tipi</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Nome</th>
                <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold">Paese</th>
                <th className="px-6 py-3 text-left font-semibold">Attivo</th>
                <th className="px-6 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {tournaments?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gds-gray">Nessun torneo.</td></tr>
              )}
              {tournaments?.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                  <td className="px-6 py-3 text-gds-gray">{t.id}</td>
                  <td className="px-6 py-3 font-medium text-gds-dark">{t.name}</td>
                  <td className="px-6 py-3 text-gds-gray">{TYPE_LABELS[t.type] || t.type}</td>
                  <td className="px-6 py-3 text-gds-gray">{t.country || '—'}</td>
                  <td className="px-6 py-3 text-gds-gray">{t.isActive ? 'Sì' : 'No'}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(t)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica torneo' : 'Nuovo torneo'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Serie A"
            error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Tipo</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('type', { required: true })}
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Paese (opzionale)" placeholder="Italia" {...register('country')} />
          <label className="flex items-center gap-2 text-sm text-gds-dark cursor-pointer">
            <input type="checkbox" {...register('isActive')} />
            Attivo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Salva' : 'Crea'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
