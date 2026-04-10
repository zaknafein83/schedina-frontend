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

export default function Leagues() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: leagues, isLoading } = useQuery({
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
    mutationFn: (data) => adminApi.createLeague(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateLeague(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteLeague(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leagues'] }),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', country: '' })
    setModalOpen(true)
  }

  function openEdit(league) {
    setEditing(league)
    reset({ name: league.name, country: league.country || '' })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  async function onSubmit(data) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  function handleDelete(league) {
    if (confirm(`Eliminare la lega "${league.name}"?`)) {
      deleteMutation.mutate(league.id)
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
        <h1 className="text-2xl font-bold text-gds-dark">Leghe</h1>
        <div className="flex items-center gap-2">
          <ImportExport
            exportFn={adminApi.exportLeagues}
            importFn={adminApi.importLeagues}
            filename="leghe.json"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-leagues'] })}
          />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nuova lega
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-6 py-3 text-left font-semibold">ID</th>
              <th className="px-6 py-3 text-left font-semibold">Nome</th>
              <th className="px-6 py-3 text-left font-semibold">Paese</th>
              <th className="px-6 py-3 text-right font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {leagues?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gds-gray">
                  Nessuna lega trovata.
                </td>
              </tr>
            )}
            {leagues?.map((league) => (
              <tr key={league.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                <td className="px-6 py-3 text-gds-gray">{league.id}</td>
                <td className="px-6 py-3 font-medium text-gds-dark">{league.name}</td>
                <td className="px-6 py-3 text-gds-gray">{league.country || '—'}</td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(league)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Modifica"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(league)}
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
        title={editing ? 'Modifica lega' : 'Nuova lega'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Serie A"
            error={errors.name?.message}
            {...register('name', { required: 'Nome obbligatorio' })}
          />
          <Input
            label="Paese"
            placeholder="Italia"
            error={errors.country?.message}
            {...register('country')}
          />
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
