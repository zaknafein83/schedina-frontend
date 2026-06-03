import { useQuery } from '@tanstack/react-query'
import { schedinaApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import { Trophy } from 'lucide-react'

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Classifica() {
  const { user } = useAuth()
  const { data: rows, isLoading, isError } = useQuery({
    queryKey: ['classifica'],
    queryFn: () => schedinaApi.classifica().then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">Errore nel caricamento della classifica.</div>

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={24} className="text-gds-pink" />
        <h1 className="text-2xl font-bold text-gds-white">Classifica</h1>
      </div>
      <p className="text-gds-gray text-sm mb-6">I giocatori ordinati per vincite totali (Totocalcio + Under/Over).</p>

      {!rows?.length ? (
        <div className="bg-gds-surface rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <Trophy size={48} className="mx-auto mb-4 text-gds-gray" />
          <p className="font-medium">Ancora nessuna giocata: la classifica è tutta da scrivere.</p>
        </div>
      ) : (
        <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-gds-dark text-white">
                <th className="px-4 py-3 text-left font-semibold w-16">#</th>
                <th className="px-4 py-3 text-left font-semibold">Giocatore</th>
                <th className="px-4 py-3 text-right font-semibold">Totale</th>
                <th className="px-4 py-3 text-right font-semibold hidden sm:table-cell">Totocalcio</th>
                <th className="px-4 py-3 text-right font-semibold hidden sm:table-cell">Under/Over</th>
                <th className="px-4 py-3 text-right font-semibold hidden md:table-cell">Vincenti</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMe = r.userId === user?.id
                return (
                  <tr key={r.userId}
                    className={`border-t border-gds-border transition-colors ${isMe ? 'bg-gds-pink/15' : 'hover:bg-gds-pink-light'}`}>
                    <td className="px-4 py-3 font-bold text-gds-white">{MEDAL[r.rank] || r.rank}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gds-white">{r.username || r.fullName || '—'}</span>
                      {isMe && <span className="ml-2 text-xs text-gds-pink font-semibold">(tu)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gds-white tabular-nums">{formatEuro(r.total)}</td>
                    <td className="px-4 py-3 text-right text-gds-gray tabular-nums hidden sm:table-cell">{formatEuro(r.totalTotocalcio)}</td>
                    <td className="px-4 py-3 text-right text-gds-gray tabular-nums hidden sm:table-cell">{formatEuro(r.totalUnderOver)}</td>
                    <td className="px-4 py-3 text-right text-gds-gray hidden md:table-cell">{r.schedineVincenti}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}
