import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import WinnersPanel, { winnersFromSchedine } from '../../components/WinnersPanel'
import { ArrowLeft, Lock, Unlock, Cog, RotateCcw, Plus, X } from 'lucide-react'

const STATUS_COLOR = { DRAFT: 'gray', OPEN: 'green', CLOSED: 'yellow', PROCESSED: 'blue', CANCELLED: 'red' }
const SCH_COLOR = { WINNING: 'green', NOT_WINNING: 'red', CONFIRMED: 'blue', PROCESSED: 'yellow', DRAFT: 'gray', CANCELLED: 'gray' }

export default function ConcorsoDetail() {
  const { id } = useParams()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const queryClient = useQueryClient()

  const { data: concorso, isLoading } = useQuery({ queryKey: ['admin-concorso', id], queryFn: () => adminApi.getConcorso(id).then((r) => r.data) })
  const { data: selected } = useQuery({ queryKey: ['admin-concorso-matches', id], queryFn: () => adminApi.getConcorsoMatches(id).then((r) => r.data) })
  const { data: available } = useQuery({ queryKey: ['admin-concorso-available', id], queryFn: () => adminApi.getConcorsoAvailable(id).then((r) => r.data) })
  const { data: schedine } = useQuery({ queryKey: ['admin-concorso-schedine', id], queryFn: () => adminApi.getSchedineByConcorso(id).then((r) => r.data) })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-concorso', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-concorso-matches', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-concorso-available', id] })
  }
  const invalidateAll = () => { invalidate(); queryClient.invalidateQueries({ queryKey: ['admin-concorso-schedine', id] }); queryClient.invalidateQueries({ queryKey: ['admin-concorsi'] }) }

  const addM = useMutation({ mutationFn: (matchId) => adminApi.addConcorsoMatch(id, matchId), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore') })
  const removeM = useMutation({ mutationFn: (matchId) => adminApi.removeConcorsoMatch(id, matchId), onSuccess: invalidate })
  const openC = useMutation({ mutationFn: () => adminApi.openConcorso(id), onSuccess: invalidateAll, onError: (e) => alert(e.response?.data?.error || 'Errore apertura') })
  const closeC = useMutation({ mutationFn: () => adminApi.closeConcorso(id), onSuccess: invalidateAll })
  const reopenC = useMutation({ mutationFn: () => adminApi.reopenConcorso(id), onSuccess: invalidateAll, onError: (e) => alert(e.response?.data?.error || 'Errore') })
  const processC = useMutation({ mutationFn: () => adminApi.processConcorso(id), onSuccess: invalidateAll })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!concorso) return <div className="text-gds-gray">Concorso non trovato.</div>

  return (
    <div>
      <Link to={`${basePath}/concorsi`} className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Concorsi
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gds-white">{concorso.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={STATUS_COLOR[concorso.status]}>{concorso.status}</Badge>
            <span className="text-sm text-gds-gray">turno {concorso.number} · regola {concorso.ruleName || '—'} · soglie {(concorso.winningThresholds || []).join(', ') || '—'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {concorso.status === 'DRAFT' && <Button variant="secondary" onClick={() => openC.mutate()}><Unlock size={16} /> Apri</Button>}
          {concorso.status === 'OPEN' && <Button variant="secondary" onClick={() => closeC.mutate()}><Lock size={16} /> Chiudi</Button>}
          {(concorso.status === 'CLOSED' || concorso.status === 'PROCESSED') && <Button variant="secondary" onClick={() => processC.mutate()} loading={processC.isPending}><Cog size={16} /> Elabora</Button>}
          {(concorso.status === 'CLOSED' || concorso.status === 'PROCESSED') && <Button variant="secondary" onClick={() => reopenC.mutate()}><RotateCcw size={16} /> Riapri</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Partite selezionate */}
        <div>
          <h2 className="text-lg font-bold text-gds-white mb-3">Partite selezionate ({selected?.length ?? 0})</h2>
          <div className="space-y-2">
            {selected?.length === 0 && <div className="bg-gds-surface rounded-xl p-5 text-center text-gds-gray text-sm">Nessuna partita. Aggiungile dalla colonna a destra.</div>}
            {selected?.map((m) => (
              <div key={m.id} className="bg-gds-surface rounded-xl shadow-sm p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gds-white">{m.homeTeamName} – {m.awayTeamName}</p>
                  <p className="text-xs text-gds-gray">{m.result1x2 ? `Esito ${m.result1x2} · ${m.resultUO === 'O' ? 'Over' : 'Under'} ${m.overUnderLine}` : 'in attesa di punteggio'}</p>
                </div>
                <button title="Rimuovi" onClick={() => removeM.mutate(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Partite disponibili (stesso turno) */}
        <div>
          <h2 className="text-lg font-bold text-gds-white mb-3">Disponibili · turno {concorso.number} ({available?.length ?? 0})</h2>
          <div className="space-y-2">
            {available?.length === 0 && <div className="bg-gds-surface rounded-xl p-5 text-center text-gds-gray text-sm">Nessuna partita libera del turno {concorso.number}. Creale dal Calendario.</div>}
            {available?.map((m) => (
              <div key={m.id} className="bg-gds-surface rounded-xl shadow-sm p-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gds-white">{m.homeTeamName} – {m.awayTeamName}</p>
                <button title="Aggiungi" onClick={() => addM.mutate(m.id)} className="p-2 rounded-lg hover:bg-green-50 text-green-600"><Plus size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vincitori per modalità */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <WinnersPanel title="Vincitori Totocalcio (1X2)" winners={winnersFromSchedine(schedine).totocalcio} />
        <WinnersPanel title="Vincitori Under/Over" winners={winnersFromSchedine(schedine).underOver} />
      </div>

      {/* Schedine */}
      <h2 className="text-lg font-bold text-gds-white mb-3">Schedine ({schedine?.length ?? 0})</h2>
      <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead><tr className="bg-gds-dark text-white">
            <th className="px-4 py-2.5 text-left font-semibold">ID</th><th className="px-4 py-2.5 text-left font-semibold">Utente</th>
            <th className="px-4 py-2.5 text-left font-semibold">Stato</th><th className="px-4 py-2.5 text-left font-semibold">Totocalcio (1X2)</th><th className="px-4 py-2.5 text-left font-semibold">Under/Over</th>
          </tr></thead>
          <tbody>
            {schedine?.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gds-gray">Nessuna schedina.</td></tr>}
            {schedine?.map((s) => (
              <tr key={s.id} className="border-t border-gds-border">
                <td className="px-4 py-2.5 text-gds-gray">#{s.id}</td>
                <td className="px-4 py-2.5">
                  <div className="text-gds-white font-medium">{s.userUsername || s.userEmail || `utente ${s.userId}`}</div>
                  {s.userEmail && <div className="text-xs text-gds-gray">{s.userEmail}</div>}
                </td>
                <td className="px-4 py-2.5"><Badge color={SCH_COLOR[s.status] ?? 'gray'}>{s.status}</Badge></td>
                <td className="px-4 py-2.5 font-semibold text-gds-white">{s.correct1x2Count ?? '—'} {s.isWinner1x2 ? <span className="text-gds-pink">🏆 {formatEuro(s.prize1x2)}</span> : ''}</td>
                <td className="px-4 py-2.5 font-semibold text-gds-white">{s.correctUoCount ?? '—'} {s.isWinnerUo ? <span className="text-gds-pink">🏆 {formatEuro(s.prizeUo)}</span> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
