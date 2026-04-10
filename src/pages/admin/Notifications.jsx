import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { RefreshCw } from 'lucide-react'

const TABS = [
  { label: 'Tutte', value: '' },
  { label: 'In attesa', value: 'PENDING' },
  { label: 'Inviate', value: 'SENT' },
  { label: 'Fallite', value: 'FAILED' },
]

const STATUS_MAP = {
  PENDING: { label: 'In attesa', color: 'yellow' },
  SENT: { label: 'Inviata', color: 'green' },
  FAILED: { label: 'Fallita', color: 'red' },
}

export default function AdminNotifications() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('')

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications', activeTab],
    queryFn: () =>
      adminApi.getNotifications(activeTab || undefined).then((r) => r.data),
  })

  const resendMutation = useMutation({
    mutationFn: (id) => adminApi.resendNotification(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Notifiche admin</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 mb-4 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                activeTab === tab.value
                  ? 'bg-gds-pink text-white'
                  : 'text-gds-gray hover:text-gds-dark hover:bg-gds-gray-light'
              }`}
          >
            {tab.label}
          </button>
        ))}
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
                <th className="px-6 py-3 text-left font-semibold">Utente</th>
                <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold">Messaggio</th>
                <th className="px-6 py-3 text-left font-semibold">Stato</th>
                <th className="px-6 py-3 text-left font-semibold">Data</th>
                <th className="px-6 py-3 text-right font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {notifications?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gds-gray">
                    Nessuna notifica trovata.
                  </td>
                </tr>
              )}
              {notifications?.map((notif) => {
                const statusInfo = STATUS_MAP[notif.status] || {
                  label: notif.status,
                  color: 'gray',
                }
                return (
                  <tr
                    key={notif.id}
                    className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors"
                  >
                    <td className="px-6 py-3 text-gds-gray">{notif.id}</td>
                    <td className="px-6 py-3 text-gds-dark">
                      {notif.userId || notif.userEmail || '—'}
                    </td>
                    <td className="px-6 py-3 text-gds-gray text-xs font-mono">
                      {notif.type || '—'}
                    </td>
                    <td className="px-6 py-3 text-gds-gray max-w-xs truncate">
                      {notif.message || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                    </td>
                    <td className="px-6 py-3 text-gds-gray text-xs">
                      {notif.createdAt
                        ? new Date(notif.createdAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={
                            resendMutation.isPending &&
                            resendMutation.variables === notif.id
                          }
                          onClick={() => resendMutation.mutate(notif.id)}
                        >
                          <RefreshCw size={13} />
                          Reinvia
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
