import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { ArrowLeft, Check, RefreshCw } from 'lucide-react'

const STATUS_COLOR = {
  OPEN: 'green', CLOSED: 'yellow', PROCESSING: 'blue',
  PROCESSED: 'dark', DRAFT: 'gray',
}
const STATUS_LABEL = {
  OPEN: 'Aperto', CLOSED: 'Chiuso', PROCESSING: 'In elaborazione',
  PROCESSED: 'Elaborato', DRAFT: 'Bozza',
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function ModContestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [scoreValues, setScoreValues] = useState({})
  const [savingResult, setSavingResult] = useState(null)
  const [processMsg, setProcessMsg] = useState(null)

  const { data: contest } = useQuery({
    queryKey: ['mod-contest', id],
    queryFn: () => adminApi.getContest(id).then((r) => r.data),
  })

  const { data: matches, isLoading } = useQuery({
    queryKey: ['mod-matches', id],
    queryFn: () => adminApi.getMatches(id).then((r) => r.data),
  })

  const resultMutation = useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }) =>
      adminApi.setMatchResult(matchId, homeScore, awayScore),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mod-matches', id] }),
    onSettled: () => setSavingResult(null),
  })

  const closeMutation = useMutation({
    mutationFn: () => adminApi.closeContest(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mod-contest', id] }),
  })

  const processMutation = useMutation({
    mutationFn: () => adminApi.processContest(Number(id)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['mod-contest', id] })
      const d = res.data?.processing
      if (d) {
        setProcessMsg(
          d.reprocessed
            ? `✅ Ricalcolo completato: ${d.couponsProcessed} schedine elaborate, ${d.winners} vincitori.`
            : `✅ Elaborazione completata: ${d.couponsProcessed} schedine, ${d.winners} vincitori.`
        )
      }
    },
    onError: (err) => {
      setProcessMsg('❌ ' + (err.response?.data?.error || 'Errore durante l\'elaborazione'))
    },
  })

  function getScore(matchId, side, match) {
    const local = scoreValues[matchId]
    if (local && local[side] !== undefined) return local[side]
    if (side === 'home') return match.homeScore ?? ''
    return match.awayScore ?? ''
  }

  function setScore(matchId, side, value) {
    setScoreValues((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value },
    }))
  }

  function previewResult(matchId, match) {
    const home = getScore(matchId, 'home', match)
    const away = getScore(matchId, 'away', match)
    if (home === '' || away === '') return null
    const h = Number(home), a = Number(away)
    if (h > a) return '1'
    if (h === a) return 'X'
    return '2'
  }

  async function handleSaveResult(match) {
    const home = getScore(match.id, 'home', match)
    const away = getScore(match.id, 'away', match)
    if (home === '' || away === '') return
    setSavingResult(match.id)
    resultMutation.mutate({ matchId: match.id, homeScore: Number(home), awayScore: Number(away) })
  }

  const canEnterResults = contest?.status === 'CLOSED' || contest?.status === 'OPEN' || contest?.status === 'PROCESSED'
  const canClose = contest?.status === 'OPEN'
  const canProcess = contest?.status === 'CLOSED' || contest?.status === 'PROCESSED'
  const allResultsEntered = matches?.length > 0 && matches.every((m) => m.officialResult != null)

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <button
        onClick={() => navigate('/mod/contests')}
        className="flex items-center gap-2 text-gds-gray hover:text-gds-dark text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Torna ai concorsi
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gds-dark">
            {contest?.name ?? `Concorso #${id}`}
          </h1>
          {contest && (
            <div className="flex items-center gap-3 mt-1">
              <Badge color={STATUS_COLOR[contest.status] || 'gray'}>
                {STATUS_LABEL[contest.status] || contest.status}
              </Badge>
              <span className="text-xs text-gds-gray">
                {contest.matchCount ?? 0} partite · {contest.couponCount ?? 0} schedine
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canClose && (
            <Button
              variant="secondary"
              loading={closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              Chiudi concorso
            </Button>
          )}
          {canProcess && (
            <Button
              loading={processMutation.isPending}
              onClick={() => { setProcessMsg(null); processMutation.mutate() }}
              disabled={!allResultsEntered}
              title={!allResultsEntered ? 'Inserisci tutti i risultati prima di elaborare' : ''}
            >
              <RefreshCw size={15} />
              {contest?.status === 'PROCESSED' ? 'Ricalcola vincitori' : 'Elabora concorso'}
            </Button>
          )}
        </div>
      </div>

      {/* Messaggio elaborazione */}
      {processMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          processMsg.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
        }`}>
          {processMsg}
        </div>
      )}

      {!allResultsEntered && canProcess && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
          ⚠️ Alcune partite non hanno ancora un risultato. Inseriscili tutti per poter elaborare.
        </div>
      )}

      {/* Tabella partite */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gds-dark text-white">
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">Casa</th>
              <th className="px-4 py-3 text-left font-semibold">Ospite</th>
              <th className="px-4 py-3 text-left font-semibold">Data/ora</th>
              <th className="px-4 py-3 text-left font-semibold">Risultato</th>
            </tr>
          </thead>
          <tbody>
            {matches?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gds-gray">
                  Nessuna partita in questo concorso.
                </td>
              </tr>
            )}
            {matches?.map((match, idx) => (
              <tr key={match.id} className="border-t border-gray-100 hover:bg-gds-pink-light transition-colors">
                <td className="px-4 py-3 text-gds-gray font-semibold text-xs">
                  {match.matchNumber ?? idx + 1}
                </td>
                <td className="px-4 py-3 font-medium text-gds-dark">{match.homeTeamName || '—'}</td>
                <td className="px-4 py-3 font-medium text-gds-dark">{match.awayTeamName || '—'}</td>
                <td className="px-4 py-3 text-gds-gray text-xs">
                  {match.scheduledAt
                    ? new Date(match.scheduledAt).toLocaleString('it-IT', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {canEnterResults ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min={0}
                        value={getScore(match.id, 'home', match)}
                        onChange={(e) => setScore(match.id, 'home', e.target.value)}
                        placeholder="0"
                        className="w-12 text-center rounded-lg border border-gray-200 px-1 py-1 text-sm
                          bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
                      />
                      <span className="text-gds-gray font-bold text-xs">–</span>
                      <input
                        type="number" min={0}
                        value={getScore(match.id, 'away', match)}
                        onChange={(e) => setScore(match.id, 'away', e.target.value)}
                        placeholder="0"
                        className="w-12 text-center rounded-lg border border-gray-200 px-1 py-1 text-sm
                          bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
                      />
                      {(() => {
                        const preview = previewResult(match.id, match)
                        return preview ? (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gds-dark">
                            {preview}
                          </span>
                        ) : null
                      })()}
                      <button
                        onClick={() => handleSaveResult(match)}
                        disabled={savingResult === match.id}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-40"
                        title="Salva risultato"
                      >
                        {savingResult === match.id ? <Spinner size="sm" /> : <Check size={15} />}
                      </button>
                      {match.officialResult && (
                        <Badge color="green">
                          {match.homeScore}–{match.awayScore} ({match.officialResult})
                        </Badge>
                      )}
                    </div>
                  ) : (
                    match.officialResult
                      ? <Badge color="green">{match.homeScore}–{match.awayScore} ({match.officialResult})</Badge>
                      : <span className="text-gds-gray text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
