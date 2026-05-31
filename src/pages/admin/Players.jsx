import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ImportExport from '../../components/ui/ImportExport'

const ROLES = [
  { value: '', label: '—' },
  { value: 'GK', label: 'Portiere (GK)' },
  { value: 'DEF', label: 'Difensore (DEF)' },
  { value: 'MID', label: 'Centrocampista (MID)' },
  { value: 'FWD', label: 'Attaccante (FWD)' },
]

export default function Players() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterLeagueId, setFilterLeagueId] = useState('')
  const [filterTeamId, setFilterTeamId] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const { data: leagues } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: () => adminApi.getLeagues().then((r) => r.data),
  })

  const { data: teams } = useQuery({
    queryKey: ['admin-teams', filterLeagueId],
    queryFn: () => adminApi.getTeams(filterLeagueId || undefined).then((r) => r.data),
  })

  const queryParams = useMemo(() => {
    const p = {}
    if (filterLeagueId) p.leagueId = filterLeagueId
    if (filterTeamId) p.teamId = filterTeamId
    if (filterRole) p.role = filterRole
    return p
  }, [filterLeagueId, filterTeamId, filterRole])

  const { data: players, isLoading } = useQuery({
    queryKey: ['admin-players', queryParams],
    queryFn: () => adminApi.getPlayers(queryParams).then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createPlayer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updatePlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deletePlayer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-players'] }),
    onError: (err) => {
      const msg = err.response?.data?.error || "Errore durante l'eliminazione"
      alert(msg)
    },
  })

  function openCreate() {
    setEditing(null)
    reset({ firstName: '', lastName: '', teamId: filterTeamId || '', role: '' })
    setModalOpen(true)
  }

  function openEdit(player) {
    setEditing(player)
    reset({
      firstName: player.firstName,
      lastName: player.lastName,
      teamId: player.teamId ?? '',
      role: player.role ?? '',
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
      firstName: data.firstName,
      lastName: data.lastName,
      teamId: data.teamId ? Number(data.teamId) : null,
      role: data.role || null,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  function handleDelete(player) {
    if (confirm(`Eliminare il giocatore "${player.fullName}"?`)) {
      deleteMutation.mutate(player.id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-white">Giocatori</h1>
        <div className="flex items-center gap-2">
          <ImportExport
            exportFn={adminApi.exportPlayers}
            importFn={adminApi.importPlayers}
            filename="giocatori.json"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-players'] })}
            templateUrl="/templates/giocatori_template.csv"
          />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nuovo giocatore
          </Button>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-gds-surface rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-gds-white block mb-2">Lega</label>
          <select
            value={filterLeagueId}
            onChange={(e) => { setFilterLeagueId(e.target.value); setFilterTeamId('') }}
            className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm
              bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
          >
            <option value="">Tutte le leghe</option>
            {leagues?.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gds-white block mb-2">Squadra</label>
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm
              bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
          >
            <option value="">Tutte le squadre</option>
            {teams?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gds-white block mb-2">Ruolo</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm
              bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label || 'Tutti'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-6 py-3 text-left font-semibold">ID</th>
                <th className="px-6 py-3 text-left font-semibold">Cognome</th>
                <th className="px-6 py-3 text-left font-semibold">Nome</th>
                <th className="px-6 py-3 text-left font-semibold">Squadra</th>
                <th className="px-6 py-3 text-left font-semibold">Ruolo</th>
                <th className="px-6 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {players?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gds-gray">
                    Nessun giocatore trovato.
                  </td>
                </tr>
              )}
              {players?.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gds-border hover:bg-gds-pink-light transition-colors"
                >
                  <td className="px-6 py-3 text-gds-gray">{p.id}</td>
                  <td className="px-6 py-3 font-medium text-gds-white">{p.lastName}</td>
                  <td className="px-6 py-3 text-gds-white">{p.firstName}</td>
                  <td className="px-6 py-3 text-gds-gray">{p.teamName || '—'}</td>
                  <td className="px-6 py-3 text-gds-gray">{p.role || '—'}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Modifica giocatore' : 'Nuovo giocatore'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Cognome"
            placeholder="Martinez"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Cognome obbligatorio' })}
          />
          <Input
            label="Nome"
            placeholder="Lautaro"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'Nome obbligatorio' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">Squadra</label>
            <select
              className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm
                bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('teamId')}
            >
              <option value="">— Senza squadra —</option>
              {teams?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-white">Ruolo</label>
            <select
              className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm
                bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
              {...register('role')}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
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
