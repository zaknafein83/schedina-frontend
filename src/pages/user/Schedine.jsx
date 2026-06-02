import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schedinaApi } from '../../api/client'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import SchedinaSelezioni from '../../components/SchedinaSelezioni'
import { FileText, Trash2, Trophy } from 'lucide-react'

const ST_COLOR = { WINNING: 'green', NOT_WINNING: 'red', CONFIRMED: 'blue', PROCESSED: 'yellow', DRAFT: 'gray', CANCELLED: 'gray' }
const ST_LABEL = { WINNING: 'Vincente', NOT_WINNING: 'Non vincente', CONFIRMED: 'Confermata', PROCESSED: 'In elaborazione', DRAFT: 'Bozza', CANCELLED: 'Annullata' }

export default function Schedine() {
  const queryClient = useQueryClient()
  const [detailId, setDetailId] = useState(null)

  const { data: schedine, isLoading } = useQuery({
    queryKey: ['my-schedine'],
    queryFn: () => schedinaApi.listMine().then((r) => r.data),
  })
  const { data: winnings } = useQuery({
    queryKey: ['my-winnings'],
    queryFn: () => schedinaApi.winnings().then((r) => r.data),
  })
  const { data: detail } = useQuery({
    queryKey: ['my-schedina', detailId],
    queryFn: () => schedinaApi.get(detailId).then((r) => r.data),
    enabled: !!detailId,
  })

  const cancel = useMutation({
    mutationFn: (id) => schedinaApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-schedine'] })
      queryClient.invalidateQueries({ queryKey: ['my-winnings'] })
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-white mb-6">Le mie schedine</h1>

      {/* Dashboard vincite */}
      <div className="bg-gradient-to-br from-gds-pink/20 to-gds-surface border border-gds-pink/30 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gds-pink/20 text-gds-pink shrink-0">
            <Trophy size={26} />
          </div>
          <div>
            <p className="text-sm text-gds-gray">Hai vinto finora</p>
            <p className="text-3xl font-black text-gds-white mt-0.5">{formatEuro(winnings?.total)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-gds-gray">
          <span>Totocalcio (1X2): <strong className="text-gds-white">{formatEuro(winnings?.totalTotocalcio)}</strong></span>
          <span>Under/Over: <strong className="text-gds-white">{formatEuro(winnings?.totalUnderOver)}</strong></span>
          <span>Schedine vincenti: <strong className="text-gds-white">{winnings?.schedineVincenti ?? 0}</strong></span>
        </div>
      </div>

      {schedine?.length === 0 ? (
        <div className="bg-gds-surface rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <FileText size={48} className="mx-auto mb-4 text-gds-gray" />
          <p className="font-medium">Non hai ancora compilato schedine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {schedine?.map((s) => (
            <div key={s.id} className="bg-gds-surface rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gds-white">Schedina #{s.id}</span>
                <Badge color={ST_COLOR[s.status] ?? 'gray'}>{ST_LABEL[s.status] ?? s.status}</Badge>
              </div>
              <div className="text-sm text-gds-gray space-y-0.5">
                <p>Totocalcio (1X2): <strong className="text-gds-white">{s.correct1x2Count ?? '—'}</strong> {s.isWinner1x2 ? `🏆 ${formatEuro(s.prize1x2)}` : ''}</p>
                <p>Under/Over: <strong className="text-gds-white">{s.correctUoCount ?? '—'}</strong> {s.isWinnerUo ? `🏆 ${formatEuro(s.prizeUo)}` : ''}</p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => setDetailId(s.id)} className="text-sm text-gds-pink hover:underline font-medium">Dettaglio</button>
                {(s.status === 'DRAFT' || s.status === 'CONFIRMED') && (
                  <button onClick={() => cancel.mutate(s.id)} className="text-sm text-gds-gray hover:text-red-600 inline-flex items-center gap-1">
                    <Trash2 size={14} /> Annulla
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title={`Schedina #${detailId}`} maxWidth="max-w-lg">
        {!detail ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge color={ST_COLOR[detail.status] ?? 'gray'}>{ST_LABEL[detail.status] ?? detail.status}</Badge>
              <span className="text-sm text-gds-gray">Totocalcio (1X2): <strong className="text-gds-white">{detail.correct1x2Count ?? '—'}</strong> {detail.isWinner1x2 ? `🏆 ${formatEuro(detail.prize1x2)}` : ''}</span>
              <span className="text-sm text-gds-gray">Under/Over: <strong className="text-gds-white">{detail.correctUoCount ?? '—'}</strong> {detail.isWinnerUo ? `🏆 ${formatEuro(detail.prizeUo)}` : ''}</span>
            </div>
            <SchedinaSelezioni selezioni={detail.selezioni} />
          </div>
        )}
      </Modal>
    </div>
  )
}
