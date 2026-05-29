import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ImportExport from '../../components/ui/ImportExport'

export default function Rules() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => adminApi.getRules().then((r) => r.data),
  })

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: () => adminApi.getLeagues().then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-rules'] }),
  })

  function thresholdsToString(arr) {
    if (!arr) return ''
    return Array.isArray(arr) ? arr.join(', ') : arr
  }

  function stringToThresholds(str) {
    if (!str) return []
    return str.split(',').map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !isNaN(n))
  }

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', leagueId: '', requiredBets: '', winningThresholds: '', maxSchedinePerUser: '', fullCompletionRequired: true })
    setModalOpen(true)
  }

  function openEdit(rule) {
    setEditing(rule)
    reset({
      name: rule.name,
      description: rule.description || '',
      leagueId: rule.leagueId || '',
      requiredBets: rule.requiredBets ?? '',
      winningThresholds: thresholdsToString(rule.winningThresholds),
      maxSchedinePerUser: rule.maxSchedinePerUser ?? '',
      fullCompletionRequired: rule.fullCompletionRequired ?? true,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      leagueId: data.leagueId ? Number(data.leagueId) : undefined,
      requiredBets: data.requiredBets !== '' ? Number(data.requiredBets) : undefined,
      winningThresholds: stringToThresholds(data.winningThresholds),
      maxSchedinePerUser: data.maxSchedinePerUser !== '' ? Number(data.maxSchedinePerUser) : undefined,
      fullCompletionRequired: !!data.fullCompletionRequired,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  function handleDelete(rule) {
    if (confirm(`Eliminare la regola "${rule.name}"?`)) {
      deleteMutation.mutate(rule.id)
    }
  }

  const leagueName = (id) => leagues?.find((l) => l.id === id)?.name ?? '—'

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Regole</h1>
        <div className="flex items-center gap-2">
          <ImportExport
            exportFn={adminApi.exportRules}
            importFn={adminApi.importRules}
            filename="regole.json"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-rules'] })}
          />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nuova regola
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Lega</th>
              <th className="px-4 py-3 text-left font-semibold">Scommesse</th>
              <th className="px-4 py-3 text-left font-semibold">Soglie vincita</th>
              <th className="px-4 py-3 text-left font-semibold">Max schedine/utente</th>
              <th className="px-4 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rules?.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gds-gray">Nessuna regola trovata.</td>
              </tr>
            )}
            {rules?.map((rule) => (
              <tr key={rule.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                <td className="px-4 py-3 text-gds-gray">{rule.id}</td>
                <td className="px-4 py-3 font-medium text-gds-dark">{rule.name}</td>
                <td className="px-4 py-3 text-gds-gray">{rule.leagueId ? leagueName(rule.leagueId) : '—'}</td>
                <td className="px-4 py-3 text-gds-gray">{rule.requiredBets ?? '—'}</td>
                <td className="px-4 py-3 text-gds-gray font-mono text-xs">
                  {thresholdsToString(rule.winningThresholds) || '—'}
                </td>
                <td className="px-4 py-3 text-gds-gray">{rule.maxSchedinePerUser ?? '∞'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(rule)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(rule)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica regola' : 'Nuova regola'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Schedina 13"
            error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Lega (opzionale)</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('leagueId')}
            >
              <option value="">-- Nessuna (es. stagionale) --</option>
              {leagues?.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Scommesse richieste"
              type="number"
              min={1}
              placeholder="13"
              error={errors.requiredBets?.message}
              {...register('requiredBets', { required: 'Campo obbligatorio', min: { value: 1, message: 'Min 1' } })}
            />
            <Input
              label="Max schedine/utente"
              type="number"
              min={1}
              placeholder="∞ se vuoto"
              {...register('maxSchedinePerUser')}
            />
          </div>

          <Input
            label="Soglie vincita (separare con virgola)"
            placeholder="11, 12, 13"
            {...register('winningThresholds')}
          />

          <label className="flex items-center gap-2 text-sm text-gds-dark">
            <input type="checkbox" className="rounded border-gray-300 text-gds-pink focus:ring-gds-pink"
              {...register('fullCompletionRequired')} />
            Schedina completa obbligatoria (tutte le scommesse)
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Descrizione</label>
            <textarea
              rows={2}
              placeholder="Descrizione opzionale..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink resize-none"
              {...register('description')}
            />
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
