import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import SchedinaSelezioni from '../../components/SchedinaSelezioni'
import { FileText, Trophy } from 'lucide-react'

const ST_COLOR = { WINNING: 'green', NOT_WINNING: 'red', CONFIRMED: 'blue', PROCESSED: 'yellow', DRAFT: 'gray', CANCELLED: 'gray' }

function WinnersPanel({ title, winners }) {
  return (
    <div className="bg-gds-surface rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-gds-pink" />
        <h3 className="font-semibold text-gds-white">{title}</h3>
        <span className="text-xs text-gds-gray">({winners.length})</span>
      </div>
      {winners.length === 0 ? (
        <p className="text-sm text-gds-gray">Nessun vincitore.</p>
      ) : (
        <ul className="space-y-1.5">
          {winners.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gds-white truncate">{w.name} <span className="text-gds-gray">· {w.count} esatti</span></span>
              <span className="font-semibold text-gds-pink shrink-0">{formatEuro(w.prize)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

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
      <h1 className="text-2xl font-bold text-gds-white mb-6">Schedine</h1>

      <div className="mb-5 max-w-md">
        <label className="text-sm font-medium text-gds-white">Concorso</label>
        <select value={concorsoId} onChange={(e) => setConcorsoId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink">
          <option value="">-- Seleziona un concorso --</option>
          {concorsi?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schedinaCount})</option>)}
        </select>
      </div>

      {!concorsoId ? (
        <div className="bg-gds-surface rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <FileText size={40} className="mx-auto mb-3 text-gds-gray" />
          Seleziona un concorso per vedere le schedine.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
      <>
        {/* Vincitori per modalità */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <WinnersPanel title="Vincitori Totocalcio (1X2)"
            winners={(schedine || []).filter((s) => s.isWinner1x2)
              .map((s) => ({ id: s.id, name: s.userUsername || s.userEmail || `utente ${s.userId}`, count: s.correct1x2Count, prize: s.prize1x2 }))} />
          <WinnersPanel title="Vincitori Under/Over"
            winners={(schedine || []).filter((s) => s.isWinnerUo)
              .map((s) => ({ id: s.id, name: s.userUsername || s.userEmail || `utente ${s.userId}`, count: s.correctUoCount, prize: s.prizeUo }))} />
        </div>

        <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Utente</th>
                <th className="px-4 py-3 text-left font-semibold">Stato</th>
                <th className="px-4 py-3 text-left font-semibold">Totocalcio (1X2)</th>
                <th className="px-4 py-3 text-left font-semibold">Under/Over</th>
                <th className="px-4 py-3 text-right font-semibold">Dettaglio</th>
              </tr>
            </thead>
            <tbody>
              {schedine?.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gds-gray">Nessuna schedina.</td></tr>}
              {schedine?.map((s) => (
                <tr key={s.id} className="border-t border-gds-border hover:bg-gds-pink-light transition-colors">
                  <td className="px-4 py-3 text-gds-gray">#{s.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-gds-white font-medium">{s.userUsername || s.userEmail || `utente ${s.userId}`}</div>
                    {s.userEmail && <div className="text-xs text-gds-gray">{s.userEmail}</div>}
                  </td>
                  <td className="px-4 py-3"><Badge color={ST_COLOR[s.status] ?? 'gray'}>{s.status}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-gds-white">{s.correct1x2Count ?? '—'} {s.isWinner1x2 ? <span className="text-gds-pink">🏆 {formatEuro(s.prize1x2)}</span> : ''}</td>
                  <td className="px-4 py-3 font-semibold text-gds-white">{s.correctUoCount ?? '—'} {s.isWinnerUo ? <span className="text-gds-pink">🏆 {formatEuro(s.prizeUo)}</span> : ''}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailId(s.id)} className="text-xs text-gds-pink hover:underline font-medium">Vedi</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </>
      )}

      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title={`Schedina #${detailId}`} maxWidth="max-w-lg">
        {!detail ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge color={ST_COLOR[detail.status] ?? 'gray'}>{detail.status}</Badge>
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
