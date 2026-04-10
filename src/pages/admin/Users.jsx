import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import { ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react'

const ROLES = ['ADMIN', 'MOD', 'USER']

const roleBadgeColor = {
  ADMIN: 'dark',
  MOD:   'pink',
  USER:  'blue',
}

function RoleDropdown({ user, onChangeRole, disabled }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1 focus:outline-none disabled:opacity-50"
      >
        <Badge color={roleBadgeColor[user.role] || 'blue'}>{user.role}</Badge>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => {
                  setOpen(false)
                  if (role !== user.role) onChangeRole(role)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gds-pink-light transition-colors ${
                  role === user.role ? 'font-semibold text-gds-pink' : 'text-gds-dark'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Users() {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers().then((r) => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminApi.setUserStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminApi.setUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const isPending = statusMutation.isPending || roleMutation.isPending

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
        <h1 className="text-2xl font-bold text-gds-dark">Utenti</h1>
        <span className="text-sm text-gds-gray">{users?.length ?? 0} utenti</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Username</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Ruolo</th>
              <th className="px-4 py-3 text-left font-semibold">Stato</th>
              <th className="px-4 py-3 text-left font-semibold">Registrato</th>
              <th className="px-4 py-3 text-right font-semibold">Attivo</th>
            </tr>
          </thead>
          <tbody>
            {users?.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gds-gray">
                  Nessun utente trovato.
                </td>
              </tr>
            )}
            {users?.map((user) => (
              <tr
                key={user.id}
                className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors"
              >
                <td className="px-4 py-3 text-gds-gray text-xs">{user.id}</td>
                <td className="px-4 py-3 font-medium text-gds-dark">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-gds-gray">{user.username ?? '—'}</td>
                <td className="px-4 py-3 text-gds-gray">{user.email}</td>

                {/* Ruolo — dropdown per cambiarlo */}
                <td className="px-4 py-3">
                  <RoleDropdown
                    user={user}
                    disabled={isPending}
                    onChangeRole={(role) => roleMutation.mutate({ id: user.id, role })}
                  />
                </td>

                <td className="px-4 py-3">
                  <Badge color={user.isActive ? 'green' : 'red'}>
                    {user.isActive ? 'Attivo' : 'Disabilitato'}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-gds-gray text-xs">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('it-IT')
                    : '—'}
                </td>

                {/* Toggle attivo/disabilitato */}
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        statusMutation.mutate({ id: user.id, isActive: !user.isActive })
                      }
                      disabled={isPending}
                      className={`transition-colors disabled:opacity-50 ${
                        user.isActive
                          ? 'text-green-500 hover:text-red-500'
                          : 'text-gray-300 hover:text-green-500'
                      }`}
                      title={user.isActive ? 'Disabilita utente' : 'Abilita utente'}
                    >
                      {user.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
