import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { giornataApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import { Clock, CalendarDays, ChevronRight } from 'lucide-react'

function timeLeft(closeAt) {
  if (!closeAt) return ''
  const ms = new Date(closeAt).getTime() - Date.now()
  if (ms <= 0) return 'In chiusura'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}g ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function Giornate() {
  const { data: giornate, isLoading, isError } = useQuery({
    queryKey: ['giornate'],
    queryFn: () => giornataApi.listOpen().then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">Errore nel caricamento del calendario.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Giornate aperte</h1>

      {giornate?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <CalendarDays size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Nessuna giornata aperta al momento.</p>
          <p className="text-sm mt-1">Torna più tardi!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {giornate?.map((g) => (
            <Link key={g.id} to={`/giornate/${g.id}`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group block">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-gds-pink-light rounded-lg"><CalendarDays size={20} className="text-gds-pink" /></div>
                <ChevronRight size={18} className="text-gds-gray group-hover:text-gds-pink transition-colors mt-1" />
              </div>
              <h3 className="font-bold text-gds-dark text-lg leading-tight mb-1">{g.name}</h3>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gds-pink">
                  <Clock size={14} />
                  <span className="font-semibold">{timeLeft(g.closeAt)}</span>
                </div>
                <span className="text-xs text-gds-gray bg-gds-gray-light px-2 py-1 rounded-full">{g.matchCount} partite</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
