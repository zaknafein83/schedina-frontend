import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { formatEuro } from '../../utils/format'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import WinnersPanel, { winnersFromSchedine } from '../../components/WinnersPanel'
import { ArrowLeft, Lock, Unlock, Cog, RotateCcw, Plus, X, Trophy } from 'lucide-react'

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

  // Editor premi (per gioco). Sincronizzato col concorso caricato.
  const [prizeRows, setPrizeRows] = useState([])
  useEffect(() => {
    if (!concorso) return
    const p1 = concorso.prizes1x2 || {}
    const pu = concorso.prizesUo || {}
    setPrizeRows((concorso.winningThresholds || []).map((t) => ({
      t, p1x2: p1[t] ?? '', pUo: pu[t] ?? '',
    })))
  }, [concorso])

  const setRow = (t, field, value) =>
    setPrizeRows((rows) => rows.map((r) => (r.t === t ? { ...r, [field]: value } : r)))

  const savePrizes = useMutation({
    mutationFn: () => {
      const prizes1x2 = {}, prizesUo = {}
      for (const r of prizeRows) {
        prizes1x2[r.t] = Math.round(Number(r.p1x2) || 0)
        prizesUo[r.t] = Math.round(Number(r.pUo) || 0)
      }
      return adminApi.updateConcorso(id, { prizes1x2, prizesUo })
    },
    onSuccess: invalidateAll,
    onError: (e) => alert(e.response?.data?.error || 'Errore salvataggio premi'),
  })

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

      {/* Premi per gioco (specifici del concorso) */}
      <div className="bg-gds-surface rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-gds-pink" />
            <h2 className="text-lg font-bold text-gds-white">Premi (€)</h2>
          </div>
          <Button variant="secondary" onClick={() => savePrizes.mutate()} loading={savePrizes.isPending} disabled={prizeRows.length === 0}>
            Salva premi
          </Button>
        </div>
        {prizeRows.length === 0 ? (
          <p className="text-sm text-gds-gray">
            Nessuna soglia: assegna una <strong>Regola</strong> con le soglie vincenti per impostare i premi.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[420px]">
              <thead><tr className="text-gds-gray">
                <th className="px-3 py-2 text-left font-medium">Soglia</th>
                <th className="px-3 py-2 text-left font-medium">Totocalcio (1X2)</th>
                <th className="px-3 py-2 text-left font-medium">Under/Over</th>
              </tr></thead>
              <tbody>
                {prizeRows.map((r) => (
                  <tr key={r.t} className="border-t border-gds-border">
                    <td className="px-3 py-2 font-semibold text-gds-white">{r.t}</td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="1" placeholder="0" value={r.p1x2}
                        onChange={(e) => setRow(r.t, 'p1x2', e.target.value)}
                        className="w-40 rounded-lg border border-gds-border px-3 py-1.5 text-sm text-gds-white bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="1" placeholder="0" value={r.pUo}
                        onChange={(e) => setRow(r.t, 'pUo', e.target.value)}
                        className="w-40 rounded-lg border border-gds-border px-3 py-1.5 text-sm text-gds-white bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <p className="text-xs text-gds-gray mt-2">
              Importi diversi per Totocalcio e Under/Over. Salvando, se il concorso è già elaborato le vincite vengono ricalcolate.
            </p>
          </>
        )}
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
