import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { contestApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import { Clock, Trophy, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
    if (!seconds || seconds <= 0) return
    const interval = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [seconds])

  return remaining
}

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return 'Chiuso'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}g ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

function ContestCard({ contest }) {
  const countdown = useCountdown(contest.timeLeftSeconds)

  return (
    <Link
      to={`/contests/${contest.id}`}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-gds-pink-light rounded-lg">
          <Trophy size={20} className="text-gds-pink" />
        </div>
        <ChevronRight
          size={18}
          className="text-gds-gray group-hover:text-gds-pink transition-colors mt-1"
        />
      </div>

      <h3 className="font-bold text-gds-dark text-lg leading-tight mb-1">
        {contest.name}
      </h3>
      {contest.description && (
        <p className="text-sm text-gds-gray mb-4 line-clamp-2">
          {contest.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-sm">
          <Clock size={14} className={countdown > 0 ? 'text-gds-pink' : 'text-gray-400'} />
          <span className={`font-semibold ${countdown > 0 ? 'text-gds-pink' : 'text-gray-400'}`}>
            {formatCountdown(countdown)}
          </span>
        </div>
        <span className="text-xs text-gds-gray bg-gds-gray-light px-2 py-1 rounded-full">
          {contest.requiredMatches} partite
        </span>
      </div>
    </Link>
  )
}

export default function Contests() {
  const { data: contests, isLoading, isError } = useQuery({
    queryKey: ['contests'],
    queryFn: () => contestApi.listOpen().then((r) => r.data),
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
        Errore nel caricamento dei concorsi.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Concorsi aperti</h1>

      {contests?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Nessun concorso aperto al momento.</p>
          <p className="text-sm mt-1">Torna più tardi!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests?.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  )
}
