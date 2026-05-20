import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seasonCouponApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import { ArrowLeft, Check, X, Clock } from 'lucide-react'

const STATUS_LABELS = {
  DRAFT: 'Bozza', CONFIRMED: 'Confermata', PROCESSED: 'In elaborazione',
  WINNING: 'Vincente', NOT_WINNING: 'Non vincente', CANCELLED: 'Annullata',
}

export default function SeasonCouponDetail() {
  const { id } = useParams()
  const couponId = Number(id)
  const queryClient = useQueryClient()

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['season-coupon', couponId],
    queryFn: () => seasonCouponApi.get(couponId).then((r) => r.data),
  })

  const confirmMutation = useMutation({
    mutationFn: () => seasonCouponApi.confirm(couponId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['season-coupon', couponId] }),
    onError: (err) => alert(err.response?.data?.error || 'Errore'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => seasonCouponApi.cancel(couponId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-season-coupons'] }),
    onError: (err) => alert(err.response?.data?.error || 'Errore'),
  })

  if (isLoading || !coupon) return <div className="flex justify-center py-20"><Spinner /></div>

  // Raggruppa per torneo
  const byTournament = coupon.predictions.reduce((acc, p) => {
    const k = p.tournamentName || '—'
    if (!acc[k]) acc[k] = []
    acc[k].push(p)
    return acc
  }, {})

  return (
    <div>
      <Link to="/my-season-coupons" className="inline-flex items-center gap-1 text-sm text-gds-pink hover:underline mb-4">
        <ArrowLeft size={14} /> Tutte le schedine
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h1 className="text-2xl font-bold text-gds-dark">{coupon.poolName}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-gds-gray">
          <span>Stato: <strong>{STATUS_LABELS[coupon.status] || coupon.status}</strong></span>
          {coupon.correctCount != null && <span>· {coupon.correctCount} esatti</span>}
          {coupon.confirmedAt && <span>· Confermata {new Date(coupon.confirmedAt).toLocaleDateString()}</span>}
        </div>
        {coupon.status === 'DRAFT' && (
          <div className="flex gap-2 mt-4">
            <Button onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending}>
              Conferma schedina
            </Button>
            <Button variant="secondary" onClick={() => { if (confirm('Annullare la schedina?')) cancelMutation.mutate() }}>
              Annulla
            </Button>
          </div>
        )}
      </div>

      {Object.entries(byTournament).map(([tournamentName, preds]) => (
        <div key={tournamentName} className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
          <div className="bg-gds-dark text-white px-4 py-2 font-semibold">{tournamentName}</div>
          <div className="divide-y divide-gray-100">
            {preds.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-gds-dark">{p.betLabel}</div>
                  <div className="text-xs text-gds-gray">
                    Tua scelta: <strong>{p.choiceLabel}</strong>
                    {p.betStatus === 'RESOLVED' && p.officialResultLabel && (
                      <> · Risultato: <strong>{p.officialResultLabel}</strong></>
                    )}
                  </div>
                </div>
                <div>
                  {p.isCorrect === true && <Check size={20} className="text-green-600" />}
                  {p.isCorrect === false && <X size={20} className="text-red-600" />}
                  {p.isCorrect === null && <Clock size={18} className="text-gds-gray" title="In attesa di risoluzione" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
