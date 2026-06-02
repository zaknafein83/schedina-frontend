import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'

const DEFAULT_THRESHOLDS = '9, 10, 11, 12, 13'
const DEFAULT_PRIZES = { 9: 50000, 10: 100000, 11: 200000, 12: 300000, 13: 500000 }

/** Estrae le soglie numeriche distinte e ordinate da una stringa "9, 10, 13". */
function parseThresholds(raw) {
  return [...new Set(
    String(raw || '').split(',').map((s) => s.trim()).filter(Boolean)
      .map(Number).filter((n) => Number.isInteger(n) && n >= 0)
  )].sort((a, b) => a - b)
}

export default function Rules() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => adminApi.getRules().then((r) => r.data),
  })

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-rules'] })

  const createMutation = useMutation({ mutationFn: (d) => adminApi.createRule(d), onSuccess: () => { invalidate(); closeModal() } })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminApi.updateRule(id, data), onSuccess: () => { invalidate(); closeModal() } })
  const deleteMutation = useMutation({ mutationFn: (id) => adminApi.deleteRule(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore eliminazione') })

  // Soglie correnti nel form → input premio dinamici
  const watchedThresholds = parseThresholds(watch('winningThresholds'))

  function openCreate() {
    setEditing(null)
    const fields = { name: '', winningThresholds: DEFAULT_THRESHOLDS, isActive: true }
    for (const [t, v] of Object.entries(DEFAULT_PRIZES)) fields[`prize_${t}`] = v
    reset(fields)
    setModalOpen(true)
  }
  function openEdit(r) {
    setEditing(r)
    const fields = {
      name: r.name,
      winningThresholds: (r.winningThresholds || []).join(', '),
      isActive: r.isActive,
    }
    for (const t of r.winningThresholds || []) fields[`prize_${t}`] = (r.prizes || {})[t] ?? ''
    reset(fields)
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const thresholds = parseThresholds(data.winningThresholds)
    const prizes = {}
    for (const t of thresholds) {
      const v = Number(data[`prize_${t}`])
      prizes[t] = Number.isFinite(v) ? Math.round(v) : 0
    }
    const payload = { name: data.name, winningThresholds: thresholds, prizes, isActive: !!data.isActive }
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
        Una regola definisce le <strong>soglie vincenti</strong> della schedina (punteggi a match esatto)
        e il <strong>premio</strong> di ogni soglia, uguale per i due giochi (Totocalcio 1X2 e Under/Over).
        Modificando soglie o premi, i concorsi già elaborati che usano la regola vengono <strong>rielaborati</strong>.
      </p>

      <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Soglie e premi</th>
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
                <td className="px-4 py-3 font-medium text-gds-white align-top">{r.name}</td>
                <td className="px-4 py-3 text-gds-gray">
                  {(r.winningThresholds || []).length === 0 ? '—' : (
                    <div className="flex flex-wrap gap-1.5">
                      {(r.winningThresholds || []).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-lg border border-gds-border px-2 py-0.5 text-xs">
                          <strong className="text-gds-white">{t}</strong>
                          <span className="text-gds-pink">{formatEuro((r.prizes || {})[t])}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top"><Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Attiva' : 'Disattivata'}</Badge></td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end gap-1">
                    <button title="Modifica" onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                    {isAdmin && <button title="Elimina" onClick={() => handleDelete(r)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>}
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

          {watchedThresholds.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gds-white">Premi per soglia (€)</label>
              <div className="space-y-2">
                {watchedThresholds.map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-sm text-gds-gray">{t}</span>
                    <input type="number" min="0" step="1000" placeholder="0"
                      {...register(`prize_${t}`)}
                      className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm text-gds-white bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gds-gray">Stesso premio per Totocalcio (1X2) e Under/Over.</p>
            </div>
          )}

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
