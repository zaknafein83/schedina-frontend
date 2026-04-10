import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, Play, Square, Cpu, ChevronRight } from 'lucide-react'
import ImportExport from '../../components/ui/ImportExport'

const STATUS_COLOR = {
  DRAFT: 'gray',
  OPEN: 'green',
  CLOSED: 'yellow',
  PROCESSING: 'blue',
  COMPLETED: 'dark',
}

function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  return isoString.slice(0, 16)
}

export default function AdminContests() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: contests, isLoading } = useQuery({
    queryKey: ['admin-contests'],
    queryFn: () => adminApi.getContests().then((r) => r.data),
  })

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: () => adminApi.getLeagues().then((r) => r.data),
  })

  const { data: rules } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => adminApi.getRules().then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createContest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contests'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateContest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contests'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteContest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contests'] }),
  })

  const openMutation = useMutation({
    mutationFn: (id) => adminApi.openContest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contests'] }),
  })

  const closeMutation = useMutation({
    mutationFn: (id) => adminApi.closeContest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contests'] }),
  })

  const processMutation = useMutation({
    mutationFn: (id) => adminApi.processContest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contests'] }),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', leagueId: '', ruleId: '', openAt: '', closeAt: '' })
    setModalOpen(true)
  }

  function openEdit(contest) {
    setEditing(contest)
    reset({
      name: contest.name,
      description: contest.description || '',
      leagueId: contest.leagueId || '',
      ruleId: contest.ruleId || '',
      openAt: toDatetimeLocal(contest.openAt),
      closeAt: toDatetimeLocal(contest.closeAt),
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
      ruleId: data.ruleId ? Number(data.ruleId) : undefined,
      openAt: data.openAt ? new Date(data.openAt).toISOString() : undefined,
      closeAt: data.closeAt ? new Date(data.closeAt).toISOString() : undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  function handleDelete(contest) {
    if (confirm(`Eliminare il concorso "${contest.name}"?`)) {
      deleteMutation.mutate(contest.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Concorsi</h1>
        <div className="flex items-center gap-2">
          <ImportExport
            exportFn={adminApi.exportContests}
            importFn={adminApi.importContests}
            filename="concorsi.json"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-contests'] })}
          />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nuovo concorso
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-6 py-3 text-left font-semibold">ID</th>
              <th className="px-6 py-3 text-left font-semibold">Nome</th>
              <th className="px-6 py-3 text-left font-semibold">Stato</th>
              <th className="px-6 py-3 text-left font-semibold">Apertura</th>
              <th className="px-6 py-3 text-left font-semibold">Chiusura</th>
              <th className="px-6 py-3 text-left font-semibold">Partite richieste</th>
              <th className="px-6 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {contests?.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gds-gray">
                  Nessun concorso trovato.
                </td>
              </tr>
            )}
            {contests?.map((contest) => (
              <tr
                key={contest.id}
                className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors"
              >
                <td className="px-6 py-3 text-gds-gray">{contest.id}</td>
                <td className="px-6 py-3 font-medium text-gds-dark">
                  <Link
                    to={`/admin/contests/${contest.id}`}
                    className="hover:text-gds-pink flex items-center gap-1"
                  >
                    {contest.name}
                    <ChevronRight size={14} className="opacity-40" />
                  </Link>
                </td>
                <td className="px-6 py-3">
                  <Badge color={STATUS_COLOR[contest.status] || 'gray'}>
                    {contest.status || 'DRAFT'}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-gds-gray text-xs">
                  {contest.openAt
                    ? new Date(contest.openAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td className="px-6 py-3 text-gds-gray text-xs">
                  {contest.closeAt
                    ? new Date(contest.closeAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td className="px-6 py-3 text-gds-gray">
                  {contest.requiredMatches ?? '—'}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end items-center gap-1">
                    {/* Open */}
                    {(!contest.status || contest.status === 'DRAFT') && (
                      <button
                        onClick={() => openMutation.mutate(contest.id)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Apri concorso"
                      >
                        <Play size={15} />
                      </button>
                    )}
                    {/* Close */}
                    {contest.status === 'OPEN' && (
                      <button
                        onClick={() => closeMutation.mutate(contest.id)}
                        className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                        title="Chiudi concorso"
                      >
                        <Square size={15} />
                      </button>
                    )}
                    {/* Process */}
                    {contest.status === 'CLOSED' && (
                      <button
                        onClick={() => processMutation.mutate(contest.id)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Processa concorso"
                      >
                        <Cpu size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(contest)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Modifica"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(contest)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Modifica concorso' : 'Nuovo concorso'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Schedina della domenica"
            error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">
              Descrizione
            </label>
            <textarea
              rows={2}
              placeholder="Descrizione opzionale..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink resize-none"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Lega</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                  bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
                {...register('leagueId', { required: 'Lega obbligatoria' })}
              >
                <option value="">-- Seleziona lega --</option>
                {leagues?.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {errors.leagueId && (
                <p className="text-xs text-red-500">{errors.leagueId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Regola</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                  bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
                {...register('ruleId', { required: 'Regola obbligatoria' })}
              >
                <option value="">-- Seleziona regola --</option>
                {rules?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {errors.ruleId && (
                <p className="text-xs text-red-500">{errors.ruleId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data apertura"
              type="datetime-local"
              error={errors.openAt?.message}
              {...register('openAt', { required: 'Data apertura obbligatoria' })}
            />
            <Input
              label="Data chiusura"
              type="datetime-local"
              error={errors.closeAt?.message}
              {...register('closeAt', { required: 'Data chiusura obbligatoria' })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Annulla
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? 'Salva' : 'Crea'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
