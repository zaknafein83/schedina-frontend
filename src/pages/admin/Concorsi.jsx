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
import { Plus, Pencil, Trash2, Lock, Unlock, Cog, RotateCcw, ChevronRight } from 'lucide-react'

const STATUS_COLOR = { DRAFT: 'gray', OPEN: 'green', CLOSED: 'yellow', PROCESSED: 'blue', CANCELLED: 'red' }

export default function Concorsi() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: concorsi, isLoading } = useQuery({ queryKey: ['admin-concorsi'], queryFn: () => adminApi.getConcorsi().then((r) => r.data) })
  const { data: seasons } = useQuery({ queryKey: ['admin-seasons'], queryFn: () => adminApi.getSeasons().then((r) => r.data) })
  const { data: rules } = useQuery({ queryKey: ['admin-rules'], queryFn: () => adminApi.getRules().then((r) => r.data) })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-concorsi'] })

  const createM = useMutation({ mutationFn: (d) => adminApi.createConcorso(d), onSuccess: () => { invalidate(); closeModal() } })
  const updateM = useMutation({ mutationFn: ({ id, data }) => adminApi.updateConcorso(id, data), onSuccess: () => { invalidate(); closeModal() } })
  const deleteM = useMutation({ mutationFn: (id) => adminApi.deleteConcorso(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore') })
  const openM = useMutation({ mutationFn: (id) => adminApi.openConcorso(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore apertura') })
  const closeM = useMutation({ mutationFn: (id) => adminApi.closeConcorso(id), onSuccess: invalidate })
  const reopenM = useMutation({ mutationFn: (id) => adminApi.reopenConcorso(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore') })
  const processM = useMutation({ mutationFn: (id) => adminApi.processConcorso(id), onSuccess: invalidate })

  function openCreate() {
    setEditing(null)
    reset({ name: '', number: '', seasonId: '', ruleId: '', openAt: '', closeAt: '' })
    setModalOpen(true)
  }
  function openEdit(c) {
    setEditing(c)
    reset({ name: c.name, number: c.number, seasonId: c.seasonId || '', ruleId: c.ruleId || '',
      openAt: (c.openAt || '').slice(0, 10), closeAt: (c.closeAt || '').slice(0, 10) })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      number: Number(data.number),
      seasonId: data.seasonId ? Number(data.seasonId) : undefined,
      ruleId: data.ruleId ? Number(data.ruleId) : undefined,
      // Solo data: apertura a inizio giornata, chiusura a fine giornata.
      openAt: data.openAt ? `${data.openAt}T00:00:00` : data.openAt,
      closeAt: data.closeAt ? `${data.closeAt}T23:59:59` : data.closeAt,
    }
    if (editing) await updateM.mutateAsync({ id: editing.id, data: payload })
    else await createM.mutateAsync(payload)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Concorsi</h1>
        <Button onClick={openCreate}><Plus size={16} /> Nuovo concorso</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">Turno</th>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Stato</th>
              <th className="px-4 py-3 text-left font-semibold">Partite</th>
              <th className="px-4 py-3 text-left font-semibold">Schedine</th>
              <th className="px-4 py-3 text-left font-semibold">Regola</th>
              <th className="px-4 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {concorsi?.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gds-gray">Nessun concorso.</td></tr>}
            {concorsi?.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                <td className="px-4 py-3 text-gds-gray">{c.number}</td>
                <td className="px-4 py-3">
                  <Link to={`${basePath}/concorsi/${c.id}`} className="font-medium text-gds-dark hover:text-gds-pink inline-flex items-center gap-1">
                    {c.name} <ChevronRight size={14} />
                  </Link>
                </td>
                <td className="px-4 py-3"><Badge color={STATUS_COLOR[c.status]}>{c.status}</Badge></td>
                <td className="px-4 py-3 text-gds-gray">{c.matchCount}</td>
                <td className="px-4 py-3 text-gds-gray">{c.schedinaCount}</td>
                <td className="px-4 py-3 text-gds-gray text-xs">{c.ruleName ? `${c.ruleName} [${(c.winningThresholds || []).join(', ')}]` : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {c.status === 'DRAFT' && <button title="Apri" onClick={() => openM.mutate(c.id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600"><Unlock size={15} /></button>}
                    {c.status === 'OPEN' && <button title="Chiudi" onClick={() => closeM.mutate(c.id)} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"><Lock size={15} /></button>}
                    {(c.status === 'CLOSED' || c.status === 'PROCESSED') && <button title="Elabora" onClick={() => processM.mutate(c.id)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Cog size={15} /></button>}
                    {(c.status === 'CLOSED' || c.status === 'PROCESSED') && <button title="Riapri" onClick={() => reopenM.mutate(c.id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600"><RotateCcw size={15} /></button>}
                    <button title="Modifica" onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                    <button title="Elimina" onClick={() => { if (confirm(`Eliminare "${c.name}"?`)) deleteM.mutate(c.id) }} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica concorso' : 'Nuovo concorso'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome" placeholder="Totocalcio — Turno 1" error={errors.name?.message} {...register('name', { required: 'Obbligatorio' })} />
            <Input label="Numero turno" type="number" error={errors.number?.message} {...register('number', { required: 'Obbligatorio' })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Regola (soglie)</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('ruleId')}>
                <option value="">-- Nessuna --</option>
                {rules?.filter((r) => r.isActive || String(r.id) === String(editing?.ruleId)).map((r) => <option key={r.id} value={r.id}>{r.name} [{(r.winningThresholds || []).join(', ')}]</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Stagione</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('seasonId')}>
                <option value="">-- Nessuna --</option>
                {seasons?.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Apertura" type="date" error={errors.openAt?.message} {...register('openAt', { required: 'Obbligatorio' })} />
            <Input label="Chiusura" type="date" error={errors.closeAt?.message} {...register('closeAt', { required: 'Obbligatorio' })} />
          </div>
          <p className="text-xs text-gds-gray">Dopo aver creato il concorso, dal dettaglio seleziona le partite del turno {`{`}numero{`}`} tra le leghe.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Salva' : 'Crea'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
