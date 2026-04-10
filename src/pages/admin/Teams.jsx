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

export default function Teams() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterLeagueId, setFilterLeagueId] = useState('')

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: () => adminApi.getLeagues().then((r) => r.data),
  })

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams', filterLeagueId],
    queryFn: () =>
      adminApi.getTeams(filterLeagueId || undefined).then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteTeam(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-teams'] }),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', leagueId: filterLeagueId || '' })
    setModalOpen(true)
  }

  function openEdit(team) {
    setEditing(team)
    reset({ name: team.name, leagueId: team.leagueId || '' })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  async function onSubmit(data) {
    const payload = { ...data, leagueId: Number(data.leagueId) }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  function handleDelete(team) {
    if (confirm(`Eliminare la squadra "${team.name}"?`)) {
      deleteMutation.mutate(team.id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Squadre</h1>
        <div className="flex items-center gap-2">
          <ImportExport
            exportFn={adminApi.exportTeams}
            importFn={adminApi.importTeams}
            filename="squadre.json"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-teams'] })}
          />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nuova squadra
          </Button>
        </div>
      </div>

      {/* Filter by league */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="text-sm font-medium text-gds-dark block mb-2">
          Filtra per lega
        </label>
        <select
          value={filterLeagueId}
          onChange={(e) => setFilterLeagueId(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm
            bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
        >
          <option value="">Tutte le leghe</option>
          {leagues?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Nome</th>
                <th className="px-6 py-3 text-left font-semibold">Lega</th>
                <th className="px-6 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {teams?.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gds-gray">
                    Nessuna squadra trovata.
                  </td>
                </tr>
              )}
              {teams?.map((team) => {
                const league = leagues?.find((l) => l.id === team.leagueId)
                return (
                  <tr
                    key={team.id}
                    className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors"
                  >
                    <td className="px-6 py-3 text-gds-gray">{team.id}</td>
                    <td className="px-6 py-3 font-medium text-gds-dark">
                      {team.name}
                    </td>
                    <td className="px-6 py-3 text-gds-gray">
                      {league?.name || team.leagueId || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(team)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(team)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Modifica squadra' : 'Nuova squadra'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome squadra"
            placeholder="Juventus FC"
            error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Lega</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('leagueId', { required: 'Lega obbligatoria' })}
            >
              <option value="">-- Seleziona lega --</option>
              {leagues?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {errors.leagueId && (
              <p className="text-xs text-red-600">{errors.leagueId.message}</p>
            )}
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
