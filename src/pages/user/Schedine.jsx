import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schedinaApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import SchedinaSelezioni from '../../components/SchedinaSelezioni'
import { FileText, Trash2 } from 'lucide-react'

const ST_COLOR = { WINNING: 'green', NOT_WINNING: 'red', CONFIRMED: 'blue', PROCESSED: 'yellow', DRAFT: 'gray', CANCELLED: 'gray' }
const ST_LABEL = { WINNING: 'Vincente', NOT_WINNING: 'Non vincente', CONFIRMED: 'Confermata', PROCESSED: 'In elaborazione', DRAFT: 'Bozza', CANCELLED: 'Annullata' }

export default function Schedine() {
  const queryClient = useQueryClient()
  const [detailId, setDetailId] = useState(null)

  const { data: schedine, isLoading } = useQuery({
    queryKey: ['my-schedine'],
    queryFn: () => schedinaApi.listMine().then((r) => r.data),
  })
  const { data: detail } = useQuery({
    queryKey: ['my-schedina', detailId],
    queryFn: () => schedinaApi.get(detailId).then((r) => r.data),
    enabled: !!detailId,
  })

  const cancel = useMutation({
    mutationFn: (id) => schedinaApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-schedine'] }),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Le mie schedine</h1>

      {schedine?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Non hai ancora compilato schedine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {schedine?.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gds-dark">Schedina #{s.id}</span>
                <Badge color={ST_COLOR[s.status] ?? 'gray'}>{ST_LABEL[s.status] ?? s.status}</Badge>
              </div>
              <p className="text-sm text-gds-gray">
                Punti: <strong className="text-gds-dark">{s.correctCount ?? '—'}</strong> {s.isWinner ? '🏆' : ''}
              </p>
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
            <div className="flex items-center gap-2 mb-4">
              <Badge color={ST_COLOR[detail.status] ?? 'gray'}>{ST_LABEL[detail.status] ?? detail.status}</Badge>
              <span className="text-sm text-gds-gray">Punti: <strong className="text-gds-dark">{detail.correctCount ?? '—'}</strong></span>
              {detail.isWinner && <span>🏆</span>}
            </div>
            <SchedinaSelezioni selezioni={detail.selezioni} />
          </div>
        )}
      </Modal>
    </div>
  )
}
