import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import { ChevronRight } from 'lucide-react'

const STATUS_COLOR = {
  DRAFT: 'gray',
  SCHEDULED: 'gray',
  OPEN: 'green',
  CLOSED: 'yellow',
  PROCESSING: 'blue',
  PROCESSED: 'dark',
}

const STATUS_LABEL = {
  DRAFT: 'Bozza',
  SCHEDULED: 'Programmato',
  OPEN: 'Aperto',
  CLOSED: 'Chiuso',
  PROCESSING: 'In elaborazione',
  PROCESSED: 'Elaborato',
}

export default function ModContests() {
  const { data: contests, isLoading } = useQuery({
    queryKey: ['mod-contests'],
    queryFn: () => adminApi.getContests().then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  // Ordina: prima aperti/chiusi, poi elaborati, poi bozze
  const sorted = [...(contests ?? [])].sort((a, b) => {
    const order = { OPEN: 0, CLOSED: 1, PROCESSING: 2, PROCESSED: 3, SCHEDULED: 4, DRAFT: 5 }
    return (order[a.status] ?? 9) - (order[b.status] ?? 9)
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Concorsi</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sorted.length === 0 && (
          <p className="text-center py-16 text-gds-gray">Nessun concorso disponibile.</p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-6 py-3 text-left font-semibold">ID</th>
              <th className="px-6 py-3 text-left font-semibold">Nome</th>
              <th className="px-6 py-3 text-left font-semibold">Stato</th>
              <th className="px-6 py-3 text-left font-semibold">Apertura</th>
              <th className="px-6 py-3 text-left font-semibold">Chiusura</th>
              <th className="px-6 py-3 text-left font-semibold">Partite</th>
              <th className="px-6 py-3 text-left font-semibold">Schedine</th>
              <th className="px-6 py-3 text-right font-semibold">Dettaglio</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                <td className="px-6 py-3 text-gds-gray">{c.id}</td>
                <td className="px-6 py-3 font-medium text-gds-dark">{c.name}</td>
                <td className="px-6 py-3">
                  <Badge color={STATUS_COLOR[c.status] || 'gray'}>
                    {STATUS_LABEL[c.status] || c.status}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-gds-gray text-xs">
                  {c.openAt ? new Date(c.openAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-6 py-3 text-gds-gray text-xs">
                  {c.closeAt ? new Date(c.closeAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-6 py-3 text-gds-gray">{c.matchCount ?? '—'}</td>
                <td className="px-6 py-3 text-gds-gray">{c.couponCount ?? '—'}</td>
                <td className="px-6 py-3 text-right">
                  <Link
                    to={`/mod/contests/${c.id}`}
                    className="inline-flex items-center gap-1 text-gds-pink hover:underline font-medium"
                  >
                    Apri <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
