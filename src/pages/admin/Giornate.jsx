import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, Lock, Unlock, Cog, ChevronRight, RotateCcw } from 'lucide-react'

const STATUS_COLOR = {
  DRAFT: 'gray', OPEN: 'green', CLOSED: 'yellow', PROCESSED: 'blue', CANCELLED: 'red',
}

export default function Giornate() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: giornate, isLoading } = useQuery({
    queryKey: ['admin-giornate'],
    queryFn: () => adminApi.getGiornate().then((r) => r.data),
  })
  const { data: seasons } = useQuery({
    queryKey: ['admin-seasons'],
    queryFn: () => adminApi.getSeasons().then((r) => r.data),
  })
  const { data: rules } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => adminApi.getRules().then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-giornate'] })

  const createMutation = useMutation({ mutationFn: (d) => adminApi.createGiornata(d), onSuccess: () => { invalidate(); closeModal() } })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminApi.updateGiornata(id, data), onSuccess: () => { invalidate(); closeModal() } })
  const deleteMutation = useMutation({ mutationFn: (id) => adminApi.deleteGiornata(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore eliminazione') })
  const openMutation = useMutation({ mutationFn: (id) => adminApi.openGiornata(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore apertura') })
  const closeMutation = useMutation({ mutationFn: (id) => adminApi.closeGiornata(id), onSuccess: invalidate })
  const reopenMutation = useMutation({ mutationFn: (id) => adminApi.reopenGiornata(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore riapertura') })
  const processMutation = useMutation({ mutationFn: (id) => adminApi.processGiornata(id), onSuccess: invalidate })

  function openCreate() {
    setEditing(null)
    reset({ name: '', number: '', seasonId: '', ruleId: '', openAt: '', closeAt: '' })
    setModalOpen(true)
  }
  function openEdit(g) {
    setEditing(g)
    reset({
      name: g.name, number: g.number ?? '', seasonId: g.seasonId || '', ruleId: g.ruleId || '',
      openAt: (g.openAt || '').slice(0, 16), closeAt: (g.closeAt || '').slice(0, 16),
    })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      number: data.number ? Number(data.number) : undefined,
      seasonId: data.seasonId ? Number(data.seasonId) : undefined,
      ruleId: data.ruleId ? Number(data.ruleId) : undefined,
      openAt: data.openAt,
      closeAt: data.closeAt,
    }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload })
    else await createMutation.mutateAsync(payload)
  }

  function handleDelete(g) {
    if (confirm(`Eliminare "${g.name}"? Verranno rimosse anche le sue partite e scommesse di giornata.`)) deleteMutation.mutate(g.id)
  }
  function handleProcess(g) {
    if (confirm(`Elaborare "${g.name}"? Verranno calcolate le schedine.`)) processMutation.mutate(g.id)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Calendario · Giornate</h1>
        <Button onClick={openCreate}><Plus size={16} /> Nuova giornata</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Stato</th>
              <th className="px-4 py-3 text-left font-semibold">Partite</th>
              <th className="px-4 py-3 text-left font-semibold">Schedine</th>
              <th className="px-4 py-3 text-left font-semibold">Regola</th>
              <th className="px-4 py-3 text-left font-semibold">Chiusura</th>
              <th className="px-4 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {giornate?.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gds-gray">Nessuna giornata.</td></tr>
            )}
            {giornate?.map((g) => (
              <tr key={g.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                <td className="px-4 py-3 text-gds-gray">{g.number}</td>
                <td className="px-4 py-3">
                  <Link to={`${basePath}/giornate/${g.id}`} className="font-medium text-gds-dark hover:text-gds-pink inline-flex items-center gap-1">
                    {g.name} <ChevronRight size={14} />
                  </Link>
                </td>
                <td className="px-4 py-3"><Badge color={STATUS_COLOR[g.status]}>{g.status}</Badge></td>
                <td className="px-4 py-3 text-gds-gray">{g.matchCount}</td>
                <td className="px-4 py-3 text-gds-gray">{g.schedinaCount}</td>
                <td className="px-4 py-3 text-gds-gray text-xs">{g.ruleName ? `${g.ruleName} [${(g.winningThresholds || []).join(', ') || '—'}]` : '—'}</td>
                <td className="px-4 py-3 text-gds-gray text-xs">{(g.closeAt || '').slice(0, 16).replace('T', ' ')}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {g.status === 'DRAFT' && (
                      <button title="Apri" onClick={() => openMutation.mutate(g.id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600"><Unlock size={15} /></button>
                    )}
                    {g.status === 'OPEN' && (
                      <button title="Chiudi" onClick={() => closeMutation.mutate(g.id)} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"><Lock size={15} /></button>
                    )}
                    {(g.status === 'CLOSED' || g.status === 'PROCESSED') && (
                      <button title="Elabora" onClick={() => handleProcess(g)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Cog size={15} /></button>
                    )}
                    {(g.status === 'CLOSED' || g.status === 'PROCESSED') && (
                      <button title="Riapri" onClick={() => reopenMutation.mutate(g.id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600"><RotateCcw size={15} /></button>
                    )}
                    <button title="Modifica" onClick={() => openEdit(g)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                    <button title="Elimina" onClick={() => handleDelete(g)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica giornata' : 'Nuova giornata'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Giornata 1" error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Numero (opzionale)" type="number" placeholder="auto"
              {...register('number')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Stagione</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('seasonId')}>
                <option value="">-- Nessuna --</option>
                {seasons?.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Apertura" type="datetime-local" error={errors.openAt?.message}
              {...register('openAt', { required: 'Obbligatorio' })} />
            <Input label="Chiusura" type="datetime-local" error={errors.closeAt?.message}
              {...register('closeAt', { required: 'Obbligatorio' })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Regola (soglie vincenti)</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('ruleId')}>
              <option value="">-- Nessuna (da assegnare) --</option>
              {rules?.filter((r) => r.isActive || String(r.id) === String(editing?.ruleId)).map((r) => (
                <option key={r.id} value={r.id}>{r.name} [{(r.winningThresholds || []).join(', ') || '—'}]</option>
              ))}
            </select>
            <p className="text-xs text-gds-gray">Le soglie si gestiscono in <strong>Regole</strong>. Puoi assegnarla anche dopo, prima dell'elaborazione.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Salva' : 'Crea'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
