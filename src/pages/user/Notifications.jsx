import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Bell, CheckCheck } from 'lucide-react'

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then((r) => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">
        Errore nel caricamento delle notifiche.
      </div>
    )
  }

  const unread = notifications?.filter((n) => !n.read) || []
  const read = notifications?.filter((n) => n.read) || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">Notifiche</h1>
        {unread.length > 0 && (
          <Badge color="pink">{unread.length} non lette</Badge>
        )}
      </div>

      {notifications?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Nessuna notifica.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {[...unread, ...read].map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-6 py-4 border-b border-gray-100 last:border-0
                ${!notification.read ? 'bg-gds-pink-light' : ''}`}
            >
              <div
                className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  notification.read ? 'bg-gray-200' : 'bg-gds-pink'
                }`}
              />

              <div className="flex-1 min-w-0">
                {notification.title && (
                  <p className="font-semibold text-gds-dark text-sm mb-0.5">
                    {notification.title}
                  </p>
                )}
                <p className="text-sm text-gds-gray">{notification.message}</p>
                {notification.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              {!notification.read && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={markReadMutation.isPending && markReadMutation.variables === notification.id}
                  onClick={() => markReadMutation.mutate(notification.id)}
                  className="shrink-0"
                >
                  <CheckCheck size={14} />
                  Letta
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
