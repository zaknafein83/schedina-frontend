import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { concorsoApi, schedinaApi, listiniApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import MontepremiPanel from '../../components/MontepremiPanel'
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react'

const X12 = [{ ref: '1', label: '1' }, { ref: 'X', label: 'X' }, { ref: '2', label: '2' }]

export default function ConcorsoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [picks, setPicks] = useState({}) // { matchId: { choice1x2, choiceUo } }
  const [error, setError] = useState('')

  const { data: concorso, isLoading } = useQuery({ queryKey: ['concorso', id], queryFn: () => concorsoApi.get(id).then((r) => r.data) })
  const { data: partite } = useQuery({ queryKey: ['concorso-partite', id], queryFn: () => concorsoApi.partite(id).then((r) => r.data) })
  const { data: montepremi } = useQuery({ queryKey: ['concorso-montepremi', id], queryFn: () => concorsoApi.montepremi(id).then((r) => r.data) })
  const { data: leagues } = useQuery({ queryKey: ['listini-leagues'], queryFn: () => listiniApi.leagues().then((r) => r.data) })
  const leagueName = (lid) => leagues?.find((l) => l.id === lid)?.name || ''

  // Una sola schedina per utente/concorso: se ne ha già una (non annullata), niente nuova giocata.
  const { data: mySchedine } = useQuery({ queryKey: ['my-schedine'], queryFn: () => schedinaApi.listMine().then((r) => r.data) })
  const mySchedina = (mySchedine || []).find((s) => s.concorsoId === Number(id) && s.status !== 'CANCELLED')
  const { data: myDetail } = useQuery({
    queryKey: ['my-schedina', mySchedina?.id],
    queryFn: () => schedinaApi.get(mySchedina.id).then((r) => r.data),
    enabled: !!mySchedina,
  })
  // Mostra in sola lettura i pronostici già giocati.
  useEffect(() => {
    if (myDetail?.selezioni) {
      const p = {}
      myDetail.selezioni.forEach((s) => { p[s.matchId] = { choice1x2: s.choice1x2, choiceUo: s.choiceUo } })
      setPicks(p)
    }
  }, [myDetail])

  const submit = useMutation({
    mutationFn: async () => {
      const pronostici = (partite || []).map((m) => ({ matchId: m.id, choice1x2: picks[m.id]?.choice1x2, choiceUo: picks[m.id]?.choiceUo }))
      const res = await schedinaApi.create({ concorsoId: Number(id), pronostici })
      await schedinaApi.confirm(res.data.id)
      return res.data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-schedine'] }); navigate('/schedine') },
    onError: (e) => setError(e.response?.data?.error || "Errore nell'invio della schedina"),
  })

  function pick1x2(matchId, ref) { setPicks((p) => ({ ...p, [matchId]: { ...p[matchId], choice1x2: ref } })) }
  function pickUo(matchId, ref) { setPicks((p) => ({ ...p, [matchId]: { ...p[matchId], choiceUo: ref } })) }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!concorso) return <div className="text-gds-gray">Concorso non trovato.</div>

  const isOpen = concorso.status === 'OPEN'
  const alreadyPlayed = !!mySchedina
  const canPlay = isOpen && !alreadyPlayed
  const total = partite?.length ?? 0
  const completed = (partite || []).filter((m) => picks[m.id]?.choice1x2 && picks[m.id]?.choiceUo).length
  const allDone = total > 0 && completed === total

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/concorsi" className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Concorsi
      </Link>

      <h1 className="text-2xl font-bold text-gds-white">{concorso.name}</h1>
      <p className="text-gds-gray mt-1 mb-4">Pronostica esito 1X2 e Under/Over per ogni partita.</p>

      {/* Montepremi e potenziali vincite per soglia */}
      <div className="mb-6">
        <MontepremiPanel projection={montepremi} title="Montepremi e potenziali vincite" />
      </div>

      {alreadyPlayed ? (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-xl p-4 mb-6 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>Hai già giocato la tua schedina per questo concorso (1X2 + Under/Over). Puoi giocarne una sola. <Link to="/schedine" className="underline font-semibold">Le mie schedine</Link></span>
        </div>
      ) : (!isOpen && <div className="bg-yellow-50 text-yellow-800 rounded-xl p-4 mb-6 text-sm">Questo concorso non è aperto alle giocate.</div>)}

      <div className="space-y-3">
        {partite?.map((m) => {
          const p = picks[m.id] || {}
          const uo = [{ ref: 'U', label: `Under ${m.overUnderLine}` }, { ref: 'O', label: `Over ${m.overUnderLine}` }]
          return (
            <div key={m.id} className="bg-gds-surface rounded-xl shadow-sm p-4">
              {leagueName(m.leagueId) && <p className="text-xs text-gds-pink mb-0.5">{leagueName(m.leagueId)}</p>}
              <p className="font-semibold text-gds-white mb-3">{m.homeTeamName} – {m.awayTeamName}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gds-gray mb-1">Esito 1X2</p>
                  <div className="flex flex-wrap gap-2">
                    {X12.map((o) => <PickButton key={o.ref} disabled={!canPlay} selected={p.choice1x2 === o.ref} onClick={() => pick1x2(m.id, o.ref)} label={o.label} />)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gds-gray mb-1">Under/Over {m.overUnderLine}</p>
                  <div className="flex flex-wrap gap-2">
                    {uo.map((o) => <PickButton key={o.ref} disabled={!canPlay} selected={p.choiceUo === o.ref} onClick={() => pickUo(m.id, o.ref)} label={o.label} />)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 mt-4 text-sm">{error}</div>}

      {canPlay && (
        <div className="sticky bottom-0 mt-6 bg-gds-surface/90 backdrop-blur rounded-xl shadow-lg p-4 flex items-center justify-between">
          <span className="text-sm text-gds-gray">{completed}/{total} partite complete</span>
          <Button onClick={() => { setError(''); submit.mutate() }} loading={submit.isPending} disabled={!allDone}>
            <FileText size={16} /> Conferma schedina
          </Button>
        </div>
      )}
    </div>
  )
}

function PickButton({ selected, disabled, onClick, label }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
        selected ? 'bg-gds-pink text-white border-gds-pink' : 'bg-gds-surface text-gds-white border-gds-border hover:border-gds-pink'
      }`}>{label}</button>
  )
}
