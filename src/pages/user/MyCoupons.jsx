import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const STATUS_MAP = {
  DRAFT: { label: 'Bozza', color: 'gray' },
  CONFIRMED: { label: 'Confermata', color: 'blue' },
  PROCESSING: { label: 'In elaborazione', color: 'yellow' },
  WON: { label: 'Vincente', color: 'green' },
  LOST: { label: 'Non vincente', color: 'red' },
  CANCELLED: { label: 'Annullata', color: 'gray' },
}

function CouponRow({ coupon }) {
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()

  const confirmMutation = useMutation({
    mutationFn: () => couponApi.confirm(coupon.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => couponApi.cancel(coupon.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const status = STATUS_MAP[coupon.status] || { label: coupon.status, color: 'gray' }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div
        className="flex items-center gap-4 px-6 py-4 hover:bg-gds-pink-light cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gds-dark text-sm">
              Schedina #{coupon.id}
            </span>
            <Badge color={status.color}>{status.label}</Badge>
          </div>
          <p className="text-xs text-gds-gray">
            Creata il{' '}
            {new Date(coupon.createdAt).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {coupon.status === 'DRAFT' && (
            <>
              <Button
                size="sm"
                variant="primary"
                loading={confirmMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  confirmMutation.mutate()
                }}
              >
                Conferma
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={cancelMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  cancelMutation.mutate()
                }}
              >
                Annulla
              </Button>
            </>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-gds-gray" />
          ) : (
            <ChevronDown size={16} className="text-gds-gray" />
          )}
        </div>
      </div>

      {expanded && coupon.predictions && (
        <div className="px-6 pb-4 bg-gds-pink-light/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {coupon.predictions.map((pred) => (
              <div
                key={pred.matchId}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-gds-dark truncate mr-2">
                  {pred.homeTeamName} vs {pred.awayTeamName}
                </span>
                <div className="flex gap-1 shrink-0">
                  {pred.choices.map((c) => (
                    <span
                      key={c}
                      className="bg-gds-pink text-white text-xs font-bold rounded px-1.5 py-0.5"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyCoupons() {
  const { data: coupons, isLoading, isError } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponApi.list().then((r) => r.data),
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
        Errore nel caricamento delle schedine.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Le mie schedine</h1>

      {coupons?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Nessuna schedina ancora.</p>
          <p className="text-sm mt-1">Partecipa a un concorso per iniziare!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {coupons.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}
    </div>
  )
}
