import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import { Users, FileText, CalendarDays, Coins, CheckCircle, XCircle, Trophy } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, color }) {
  const colorMap = {
    pink:   'bg-gds-pink-light text-gds-pink',
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-gds-surface rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${colorMap[color]}`}>
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gds-gray">{label}</p>
        <p className="text-3xl font-black text-gds-white mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gds-gray mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
  })
  const { data: montepremi } = useQuery({
    queryKey: ['admin-montepremi-current'],
    queryFn: () => adminApi.getMontepremiCurrent().then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">
        Errore nel caricamento della dashboard.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-white mb-8">Dashboard</h1>

      {/* Montepremi corrente (prossimo concorso) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-gds-surface rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl shrink-0 bg-gds-pink-light text-gds-pink"><Trophy size={24} /></div>
          <div>
            <p className="text-sm text-gds-gray">Montepremi Totocalcio (1X2)</p>
            <p className="text-3xl font-black text-gds-white mt-0.5">{montepremi ? formatEuro(montepremi.montepremi1x2) : '—'}</p>
            <p className="text-xs text-gds-gray mt-0.5">per il prossimo concorso</p>
          </div>
        </div>
        <div className="bg-gds-surface rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl shrink-0 bg-gds-pink-light text-gds-pink"><Trophy size={24} /></div>
          <div>
            <p className="text-sm text-gds-gray">Montepremi Under/Over</p>
            <p className="text-3xl font-black text-gds-white mt-0.5">{montepremi ? formatEuro(montepremi.montepremiUo) : '—'}</p>
            <p className="text-xs text-gds-gray mt-0.5">per il prossimo concorso</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Utenti totali" value={data?.users?.total}
          sub={`${data?.users?.active ?? 0} attivi`} icon={Users} color="blue" />
        <StatCard label="Schedine totali" value={data?.schedine?.total}
          sub={`${data?.schedine?.winning ?? 0} vincenti`} icon={FileText} color="pink" />
        <StatCard label="Concorsi aperti" value={data?.concorsi?.open}
          sub={`${data?.concorsi?.processed ?? 0} elaborati`} icon={CalendarDays} color="green" />
        <StatCard label="Scommesse aperte" value={data?.scommesse?.open}
          sub={`${data?.scommesse?.giocate ?? 0} giocate`} icon={Coins} color="yellow" />
        <StatCard label="Notifiche inviate" value={data?.notifications?.sent}
          icon={CheckCircle} color="green" />
        <StatCard label="Notifiche fallite" value={data?.notifications?.failed}
          icon={XCircle} color="red" />
      </div>
    </div>
  )
}
