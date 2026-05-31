import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import ImportExport from '../../components/ui/ImportExport'

export default function Giornate() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const [leagueId, setLeagueId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: leagues } = useQuery({ queryKey: ['admin-leagues'], queryFn: () => adminApi.getLeagues().then((r) => r.data) })
  const { data: seasons } = useQuery({ queryKey: ['admin-seasons'], queryFn: () => adminApi.getSeasons().then((r) => r.data) })
  const { data: giornate, isLoading } = useQuery({
    queryKey: ['admin-giornate', leagueId],
    queryFn: () => adminApi.getGiornate(leagueId ? { leagueId } : {}).then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-giornate'] })

  const createMutation = useMutation({ mutationFn: (d) => adminApi.createGiornata(d), onSuccess: () => { invalidate(); closeModal() }, onError: (e) => alert(e.response?.data?.error || 'Errore') })
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => adminApi.updateGiornata(id, data), onSuccess: () => { invalidate(); closeModal() } })
  const deleteMutation = useMutation({ mutationFn: (id) => adminApi.deleteGiornata(id), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore eliminazione') })

  function openCreate() {
    setEditing(null)
    reset({ leagueId: leagueId || '', name: '', number: '', seasonId: '' })
    setModalOpen(true)
  }
  function openEdit(g) {
    setEditing(g)
    reset({ leagueId: g.leagueId, name: g.name, number: g.number, seasonId: g.seasonId || '' })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset() }

  async function onSubmit(data) {
    const payload = {
      leagueId: Number(data.leagueId),
      name: data.name,
      number: data.number ? Number(data.number) : undefined,
      seasonId: data.seasonId ? Number(data.seasonId) : undefined,
    }
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: payload })
    else await createMutation.mutateAsync(payload)
  }

  function handleDelete(g) {
    if (confirm(`Eliminare "${g.name}"?`)) deleteMutation.mutate(g.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Calendario · Giornate</h1>
        <div className="flex items-center gap-2">
          <ImportExport
            exportFn={adminApi.exportGiornate}
            importFn={adminApi.importGiornate}
            filename="calendario.json"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-giornate'] })}
            templateUrl="/templates/giornate_template.csv"
          />
          <Button onClick={openCreate}><Plus size={16} /> Nuova giornata</Button>
        </div>
      </div>

      <div className="mb-5 max-w-xs">
        <label className="text-sm font-medium text-gds-dark">Lega</label>
        <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
          <option value="">Tutte le leghe</option>
          {leagues?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Nome</th>
                <th className="px-4 py-3 text-left font-semibold">Lega</th>
                <th className="px-4 py-3 text-left font-semibold">Partite</th>
                <th className="px-4 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {giornate?.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gds-gray">Nessuna giornata.</td></tr>}
              {giornate?.map((g) => (
                <tr key={g.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                  <td className="px-4 py-3 text-gds-gray">{g.number}</td>
                  <td className="px-4 py-3">
                    <Link to={`${basePath}/giornate/${g.id}`} className="font-medium text-gds-dark hover:text-gds-pink inline-flex items-center gap-1">
                      {g.name} <ChevronRight size={14} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gds-gray">{g.leagueName}</td>
                  <td className="px-4 py-3 text-gds-gray">{g.matchCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button title="Modifica" onClick={() => openEdit(g)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={15} /></button>
                      <button title="Elimina" onClick={() => handleDelete(g)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Modifica giornata' : 'Nuova giornata'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gds-dark">Lega</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink"
              {...register('leagueId', { required: 'Lega obbligatoria' })}>
              <option value="">-- Seleziona --</option>
              {leagues?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {errors.leagueId && <p className="text-xs text-red-500">{errors.leagueId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Numero turno" type="number" placeholder="auto" {...register('number')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gds-dark">Stagione</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('seasonId')}>
                <option value="">-- Nessuna --</option>
                {seasons?.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <Input label="Nome" placeholder="es. Serie A — Giornata 1" error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Annulla</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Salva' : 'Crea'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
