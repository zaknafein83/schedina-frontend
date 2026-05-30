import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import SchedinaSelezioni from '../../components/SchedinaSelezioni'
import { FileText } from 'lucide-react'

const ST_COLOR = { WINNING: 'green', NOT_WINNING: 'red', CONFIRMED: 'blue', PROCESSED: 'yellow', DRAFT: 'gray', CANCELLED: 'gray' }

export default function Schedine() {
  const [concorsoId, setConcorsoId] = useState('')
  const [detailId, setDetailId] = useState(null)

  const { data: concorsi } = useQuery({
    queryKey: ['admin-concorsi'],
    queryFn: () => adminApi.getConcorsi().then((r) => r.data),
  })

  const { data: schedine, isLoading } = useQuery({
    queryKey: ['admin-schedine-by', concorsoId],
    queryFn: () => adminApi.getSchedineByConcorso(concorsoId).then((r) => r.data),
    enabled: !!concorsoId,
  })

  const { data: detail } = useQuery({
    queryKey: ['admin-schedina', detailId],
    queryFn: () => adminApi.getSchedina(detailId).then((r) => r.data),
    enabled: !!detailId,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Schedine</h1>

      <div className="mb-5 max-w-md">
        <label className="text-sm font-medium text-gds-dark">Concorso</label>
        <select value={concorsoId} onChange={(e) => setConcorsoId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
          <option value="">-- Seleziona un concorso --</option>
          {concorsi?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schedinaCount})</option>)}
        </select>
      </div>

      {!concorsoId ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          Seleziona un concorso per vedere le schedine.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Utente</th>
                <th className="px-4 py-3 text-left font-semibold">Stato</th>
                <th className="px-4 py-3 text-left font-semibold">Punti</th>
                <th className="px-4 py-3 text-right font-semibold">Dettaglio</th>
              </tr>
            </thead>
            <tbody>
              {schedine?.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gds-gray">Nessuna schedina.</td></tr>}
              {schedine?.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                  <td className="px-4 py-3 text-gds-gray">#{s.id}</td>
                  <td className="px-4 py-3 text-gds-gray">utente {s.userId}</td>
                  <td className="px-4 py-3"><Badge color={ST_COLOR[s.status] ?? 'gray'}>{s.status}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-gds-dark">{s.correctCount ?? '—'} {s.isWinner ? '🏆' : ''}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(s.id)} className="text-xs text-gds-pink hover:underline font-medium">Vedi</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title={`Schedina #${detailId}`} maxWidth="max-w-lg">
        {!detail ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge color={ST_COLOR[detail.status] ?? 'gray'}>{detail.status}</Badge>
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
