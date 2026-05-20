import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'

export default function Seasons() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: seasons, isLoading } = useQuery({
    queryKey: ['admin-seasons'],
    queryFn: () => adminApi.getSeasons().then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createSeason(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-seasons'] }); closeModal() },
    onError: (err) => alert(err.response?.data?.error || 'Errore creazione'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateSeason(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-seasons'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteSeason(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-seasons'] }),
    onError: (err) => alert(err.response?.data?.error || "Errore eliminazione"),
  })

  const setCurrentMutation = useMutation({
    mutationFn: (id) => adminApi.setCurrentSeason(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-seasons'] }),
  })

  function openCreate() {
    setEditing(null)
    reset({ label: '', startDate: '', endDate: '', isCurrent: false })
    setModalOpen(true)
  }

  function openEdit(s) {
    setEditing(s)
    reset({
      label: s.label,
      startDate: s.startDate || '',
      endDate: s.endDate || '',
      isCurrent: s.isCurrent,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setEditing(null); reset()
  }

  async function onSubmit(data) {
    const payload = {
      label: data.label,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      isCurrent: Boolean(data.isCurrent),
    }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload })
    else await createMutation.mutateAsync(payload)
  }

  function handleDelete(s) {
    if (confirm(`Eliminare la stagione "${s.label}"?`)) deleteMutation.mutate(s.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Stagioni</h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nuova stagione
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Etichetta</th>
                <th className="px-6 py-3 text-left font-semibold">Inizio</th>
                <th className="px-6 py-3 text-left font-semibold">Fine</th>
                <th className="px-6 py-3 text-left font-semibold">Corrente</th>
                <th className="px-6 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {seasons?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gds-gray">Nessuna stagione.</td></tr>
              )}
              {seasons?.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                  <td className="px-6 py-3 text-gds-gray">{s.id}</td>
                  <td className="px-6 py-3 font-medium text-gds-dark">{s.label}</td>
                  <td className="px-6 py-3 text-gds-gray">{s.startDate || '—'}</td>
                  <td className="px-6 py-3 text-gds-gray">{s.endDate || '—'}</td>
                  <td className="px-6 py-3">
                    {s.isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gds-pink text-white font-medium">
                        <Star size={12} /> Corrente
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentMutation.mutate(s.id)}
                        className="text-xs text-gds-pink hover:underline"
                      >
                        Imposta corrente
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica stagione' : 'Nuova stagione'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Etichetta"
            placeholder="2025-26"
            error={errors.label?.message}
            {...register('label', { required: 'Etichetta obbligatoria' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data inizio" type="date" {...register('startDate')} />
            <Input label="Data fine"   type="date" {...register('endDate')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gds-dark cursor-pointer">
            <input type="checkbox" {...register('isCurrent')} />
            Imposta come stagione corrente
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
