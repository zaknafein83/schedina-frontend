import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'

export default function Rules() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => adminApi.getRules().then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-rules'] })

  const createMutation = useMutation({ mutationFn: (d) => adminApi.createRule(d), onSuccess: () => { invalidate(); closeModal() } })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminApi.updateRule(id, data), onSuccess: () => { invalidate(); closeModal() } })
  const deleteMutation = useMutation({ mutationFn: (id) => adminApi.deleteRule(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore eliminazione') })

  function openCreate() {
    setEditing(null)
    reset({ name: '', winningThresholds: '', isActive: true })
    setModalOpen(true)
  }
  function openEdit(r) {
    setEditing(r)
    reset({ name: r.name, winningThresholds: (r.winningThresholds || []).join(', '), isActive: r.isActive })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const thresholds = String(data.winningThresholds || '')
      .split(',').map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n))
    const payload = { name: data.name, winningThresholds: thresholds, isActive: !!data.isActive }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload })
    else await createMutation.mutateAsync(payload)
  }

  function handleDelete(r) {
    if (confirm(`Eliminare la regola "${r.name}"?`)) deleteMutation.mutate(r.id)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-white">Regole</h1>
        <Button onClick={openCreate}><Plus size={16} /> Nuova regola</Button>
      </div>

      <p className="text-sm text-gds-gray mb-4">
        Una regola definisce le <strong>soglie vincenti</strong> della schedina (punteggi a match esatto).
        Ogni partita vale fino a 2 punti (1X2 + Under/Over). Le giornate riusano le regole.
      </p>

      <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Soglie vincenti</th>
              <th className="px-4 py-3 text-left font-semibold">Stato</th>
              <th className="px-4 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rules?.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-gds-gray">
                <BookOpen size={32} className="mx-auto mb-2 text-gds-gray" />Nessuna regola.
              </td></tr>
            )}
            {rules?.map((r) => (
              <tr key={r.id} className="border-t border-gds-border hover:bg-gds-pink-light transition-colors">
                <td className="px-4 py-3 font-medium text-gds-white">{r.name}</td>
                <td className="px-4 py-3 text-gds-gray">{(r.winningThresholds || []).join(', ') || '—'}</td>
                <td className="px-4 py-3"><Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Attiva' : 'Disattivata'}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button title="Modifica" onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                    <button title="Elimina" onClick={() => handleDelete(r)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica regola' : 'Nuova regola'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="es. Vincente 12-13" error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })} />
          <div className="flex flex-col gap-1">
            <Input label="Soglie vincenti (punti, separati da virgola)" placeholder="es. 12, 13"
              {...register('winningThresholds')} />
            <p className="text-xs text-gds-gray">Punteggi che fanno vincere la schedina (match esatto).</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gds-white">
            <input type="checkbox" {...register('isActive')} className="rounded text-gds-pink focus:ring-gds-pink" /> Attiva
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
