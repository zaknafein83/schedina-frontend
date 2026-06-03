import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { concorsoApi, schedinaApi } from '../../api/client'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import { Clock, FileText, ChevronRight, Trophy } from 'lucide-react'

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

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Concorsi() {
  const [tab, setTab] = useState('aperti')

  const { data: aperti, isLoading: loadingAperti, isError: errAperti } = useQuery({
    queryKey: ['concorsi'],
    queryFn: () => concorsoApi.listOpen().then((r) => r.data),
  })
  const { data: chiusi, isLoading: loadingChiusi, isError: errChiusi } = useQuery({
    queryKey: ['concorsi-chiusi'],
    queryFn: () => concorsoApi.listClosed().then((r) => r.data),
    enabled: tab === 'chiusi',
  })
  const { data: mieSchedine } = useQuery({
    queryKey: ['my-schedine'],
    queryFn: () => schedinaApi.listMine().then((r) => r.data),
    enabled: tab === 'chiusi',
  })

  const tabClass = (key) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      tab === key ? 'bg-gds-pink text-white' : 'text-gds-gray hover:text-gds-white hover:bg-gds-gray-light'
    }`

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gds-white">Concorsi</h1>
        <div className="flex items-center gap-1 bg-gds-surface rounded-xl p-1">
          <button className={tabClass('aperti')} onClick={() => setTab('aperti')}>Aperti</button>
          <button className={tabClass('chiusi')} onClick={() => setTab('chiusi')}>Chiusi</button>
        </div>
      </div>

      {tab === 'aperti'
        ? <ApertiList concorsi={aperti} isLoading={loadingAperti} isError={errAperti} />
        : <ChiusiList concorsi={chiusi} schedine={mieSchedine} isLoading={loadingChiusi} isError={errChiusi} />}
    </div>
  )
}

function ApertiList({ concorsi, isLoading, isError }) {
  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">Errore nel caricamento dei concorsi.</div>

  if (!concorsi?.length) {
    return (
      <div className="bg-gds-surface rounded-xl shadow-sm p-12 text-center text-gds-gray">
        <FileText size={48} className="mx-auto mb-4 text-gds-gray" />
        <p className="font-medium">Nessun concorso aperto al momento.</p>
        <p className="text-sm mt-1">Torna più tardi!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {concorsi.map((c) => (
        <Link key={c.id} to={`/concorsi/${c.id}`}
          className="bg-gds-surface rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group block">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-gds-pink-light rounded-lg"><FileText size={20} className="text-gds-pink" /></div>
            <ChevronRight size={18} className="text-gds-gray group-hover:text-gds-pink transition-colors mt-1" />
          </div>
          <h3 className="font-bold text-gds-white text-lg leading-tight mb-1">{c.name}</h3>
          <p className="text-sm text-gds-gray">Turno {c.number}</p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gds-border">
            <div className="flex items-center gap-1.5 text-sm text-gds-pink">
              <Clock size={14} /><span className="font-semibold">{timeLeft(c.closeAt)}</span>
            </div>
            <span className="text-xs text-gds-gray bg-gds-gray-light px-2 py-1 rounded-full">{c.matchCount} partite</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ChiusiList({ concorsi, schedine, isLoading, isError }) {
  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (isError) return <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">Errore nel caricamento dei concorsi.</div>

  if (!concorsi?.length) {
    return (
      <div className="bg-gds-surface rounded-xl shadow-sm p-12 text-center text-gds-gray">
        <FileText size={48} className="mx-auto mb-4 text-gds-gray" />
        <p className="font-medium">Nessun concorso chiuso.</p>
      </div>
    )
  }

  const byConcorso = {}
  for (const s of schedine || []) {
    if (s.status !== 'CANCELLED') byConcorso[s.concorsoId] = s
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {concorsi.map((c) => (
        <Link key={c.id} to={`/concorsi/${c.id}`}
          className="bg-gds-surface rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group block">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-gds-gray-light rounded-lg"><FileText size={20} className="text-gds-gray" /></div>
            <Badge color={c.status === 'PROCESSED' ? 'yellow' : 'gray'}>
              {c.status === 'PROCESSED' ? 'Elaborato' : 'Chiuso'}
            </Badge>
          </div>
          <h3 className="font-bold text-gds-white text-lg leading-tight mb-1">{c.name}</h3>
          <p className="text-sm text-gds-gray">Turno {c.number} · {c.matchCount} partite</p>

          <MioEsito concorso={c} schedina={byConcorso[c.id]} />

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gds-border text-xs text-gds-gray">
            <span>Chiuso il {formatDate(c.closeAt)}</span>
            <ChevronRight size={16} className="text-gds-gray group-hover:text-gds-pink transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function MioEsito({ concorso, schedina }) {
  if (!schedina) {
    return <p className="mt-3 text-sm text-gds-gray">Non hai giocato questo concorso.</p>
  }
  const elaborata = concorso.status === 'PROCESSED' || schedina.status === 'WINNING' || schedina.status === 'NOT_WINNING'
  if (!elaborata) {
    return <p className="mt-3 text-sm text-gds-gray">Schedina giocata · in attesa di esito.</p>
  }
  return (
    <div className="mt-3 text-sm text-gds-gray space-y-0.5">
      <p className="inline-flex items-center gap-1 text-gds-white font-medium"><Trophy size={14} className="text-gds-pink" /> Il tuo esito</p>
      <p>Totocalcio (1X2): <strong className="text-gds-white">{schedina.correct1x2Count ?? '—'}</strong> {schedina.isWinner1x2 ? `🏆 ${formatEuro(schedina.prize1x2)}` : ''}</p>
      <p>Under/Over: <strong className="text-gds-white">{schedina.correctUoCount ?? '—'}</strong> {schedina.isWinnerUo ? `🏆 ${formatEuro(schedina.prizeUo)}` : ''}</p>
    </div>
  )
}
