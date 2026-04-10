import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { ArrowLeft, Plus, Pencil, Trash2, Check } from 'lucide-react'

const RESULTS = ['1', 'X', '2']

function toDatetimeLocal(iso) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function AdminContestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [resultValues, setResultValues] = useState({})
  const [savingResult, setSavingResult] = useState(null)

  const { data: matches, isLoading } = useQuery({
    queryKey: ['admin-matches', id],
    queryFn: () => adminApi.getMatches(id).then((r) => r.data),
  })

  const { data: teams } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => adminApi.getTeams().then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-matches', id] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ matchId, data }) => adminApi.updateMatch(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-matches', id] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (matchId) => adminApi.deleteMatch(matchId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-matches', id] }),
  })

  const resultMutation = useMutation({
    mutationFn: ({ matchId, officialResult }) =>
      adminApi.setMatchResult(matchId, officialResult),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-matches', id] }),
    onSettled: () => setSavingResult(null),
  })

  function openCreate() {
    setEditing(null)
    reset({
      homeTeamId: '',
      awayTeamId: '',
      matchNumber: '',
      scheduledAt: '',
    })
    setModalOpen(true)
  }

  function openEdit(match) {
    setEditing(match)
    reset({
      homeTeamId: match.homeTeamId || '',
      awayTeamId: match.awayTeamId || '',
      matchNumber: match.matchNumber ?? '',
      scheduledAt: toDatetimeLocal(match.scheduledAt),
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
      contestId: Number(id),
      homeTeamId: data.homeTeamId ? Number(data.homeTeamId) : undefined,
      awayTeamId: data.awayTeamId ? Number(data.awayTeamId) : undefined,
      matchNumber: data.matchNumber !== '' ? Number(data.matchNumber) : undefined,
      scheduledAt: data.scheduledAt
        ? new Date(data.scheduledAt).toISOString()
        : undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ matchId: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  function handleDelete(match) {
    if (
      confirm(
        `Eliminare la partita ${match.homeTeamName} vs ${match.awayTeamName}?`
      )
    ) {
      deleteMutation.mutate(match.id)
    }
  }

  async function handleSaveResult(match) {
    const result = resultValues[match.id] ?? match.officialResult ?? ''
    if (!result) return
    setSavingResult(match.id)
    resultMutation.mutate({ matchId: match.id, officialResult: result })
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
      <button
        onClick={() => navigate('/admin/contests')}
        className="flex items-center gap-2 text-gds-gray hover:text-gds-dark text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Torna ai concorsi
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">
          Partite del concorso #{id}
        </h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Aggiungi partita
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">Casa</th>
              <th className="px-4 py-3 text-left font-semibold">Ospite</th>
              <th className="px-4 py-3 text-left font-semibold">Data/ora</th>
              <th className="px-4 py-3 text-left font-semibold">Risultato ufficiale</th>
              <th className="px-4 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {matches?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gds-gray">
                  Nessuna partita aggiunta.
                </td>
              </tr>
            )}
            {matches?.map((match, idx) => (
              <tr
                key={match.id}
                className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors"
              >
                <td className="px-4 py-3 text-gds-gray font-semibold text-xs">
                  {match.matchNumber ?? idx + 1}
                </td>
                <td className="px-4 py-3 font-medium text-gds-dark">
                  {match.homeTeamName || '—'}
                </td>
                <td className="px-4 py-3 font-medium text-gds-dark">
                  {match.awayTeamName || '—'}
                </td>
                <td className="px-4 py-3 text-gds-gray text-xs">
                  {match.scheduledAt
                    ? new Date(match.scheduledAt).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={resultValues[match.id] ?? match.officialResult ?? ''}
                      onChange={(e) =>
                        setResultValues((prev) => ({
                          ...prev,
                          [match.id]: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm bg-white
                        outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
                    >
                      <option value="">-- --</option>
                      {RESULTS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSaveResult(match)}
                      disabled={savingResult === match.id}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-40"
                      title="Salva risultato"
                    >
                      {savingResult === match.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <Check size={15} />
                      )}
                    </button>
                    {match.officialResult && (
                      <Badge color="green">{match.officialResult}</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(match)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(match)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
        title={editing ? 'Modifica partita' : 'Aggiungi partita'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Numero partita"
            type="number"
            min={1}
            placeholder="1"
            error={errors.matchNumber?.message}
            {...register('matchNumber')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">
              Squadra di casa
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('homeTeamId', { required: 'Squadra di casa obbligatoria' })}
            >
              <option value="">-- Seleziona squadra --</option>
              {teams?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.homeTeamId && (
              <p className="text-xs text-red-600">{errors.homeTeamId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">
              Squadra ospite
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('awayTeamId', { required: 'Squadra ospite obbligatoria' })}
            >
              <option value="">-- Seleziona squadra --</option>
              {teams?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.awayTeamId && (
              <p className="text-xs text-red-600">{errors.awayTeamId.message}</p>
            )}
          </div>

          <Input
            label="Data e ora"
            type="datetime-local"
            error={errors.scheduledAt?.message}
            {...register('scheduledAt')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Annulla
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? 'Salva' : 'Aggiungi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
