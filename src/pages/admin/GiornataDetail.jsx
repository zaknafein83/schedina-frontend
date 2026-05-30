import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { ArrowLeft, Trash2, Save, CalendarPlus, Lock, Unlock, Cog, Check, Coins, RotateCcw } from 'lucide-react'

const STATUS_COLOR = { DRAFT: 'gray', OPEN: 'green', CLOSED: 'yellow', PROCESSED: 'blue', CANCELLED: 'red' }
const SCH_COLOR = { WINNING: 'green', NOT_WINNING: 'red', CONFIRMED: 'blue', PROCESSED: 'yellow', DRAFT: 'gray', CANCELLED: 'gray' }

export default function GiornataDetail() {
  const { id } = useParams()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const queryClient = useQueryClient()
  const [matchModal, setMatchModal] = useState(false)

  const { data: giornata, isLoading } = useQuery({
    queryKey: ['admin-giornata', id],
    queryFn: () => adminApi.getGiornata(id).then((r) => r.data),
  })
  const { data: matches } = useQuery({
    queryKey: ['admin-giornata-matches', id],
    queryFn: () => adminApi.getMatches({ giornataId: id }).then((r) => r.data),
  })
  const { data: schedine } = useQuery({
    queryKey: ['admin-giornata-schedine', id],
    queryFn: () => adminApi.getSchedineByGiornata(id).then((r) => r.data),
  })
  const { data: teams } = useQuery({ queryKey: ['admin-teams-all'], queryFn: () => adminApi.getTeams().then((r) => r.data) })
  const { data: leagues } = useQuery({ queryKey: ['admin-leagues'], queryFn: () => adminApi.getLeagues().then((r) => r.data) })

  const teamName = (tid) => teams?.find((t) => t.id === Number(tid))?.name ?? '?'

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-giornata', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-giornata-matches', id] })
  }
  const invalidateAll = () => {
    invalidate()
    queryClient.invalidateQueries({ queryKey: ['admin-giornata-schedine', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-giornate'] })
  }

  const saveScore = useMutation({
    mutationFn: ({ matchId, home, away }) => adminApi.setMatchResult(matchId, Number(home), Number(away)),
    onSuccess: invalidate,
    onError: (e) => alert(e.response?.data?.error || 'Errore nel salvataggio del punteggio'),
  })
  const validateMatch = useMutation({ mutationFn: (matchId) => adminApi.validateMatch(matchId), onSuccess: invalidate })
  const deleteMatch = useMutation({ mutationFn: (matchId) => adminApi.deleteMatch(matchId), onSuccess: invalidate })
  const openG = useMutation({ mutationFn: () => adminApi.openGiornata(id), onSuccess: invalidateAll, onError: (e) => alert(e.response?.data?.error || 'Errore apertura') })
  const closeG = useMutation({ mutationFn: () => adminApi.closeGiornata(id), onSuccess: invalidateAll })
  const reopenG = useMutation({ mutationFn: () => adminApi.reopenGiornata(id), onSuccess: invalidateAll, onError: (e) => alert(e.response?.data?.error || 'Errore riapertura') })
  const processG = useMutation({ mutationFn: () => adminApi.processGiornata(id), onSuccess: invalidateAll })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!giornata) return <div className="text-gds-gray">Giornata non trovata.</div>

  const maxPunti = (matches?.length ?? 0) * 2

  return (
    <div>
      <Link to={`${basePath}/giornate`} className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Calendario
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gds-dark">{giornata.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={STATUS_COLOR[giornata.status]}>{giornata.status}</Badge>
            <span className="text-sm text-gds-gray">
              Regola: {giornata.ruleName || '— (nessuna)'} · soglie {(giornata.winningThresholds || []).join(', ') || '—'} · max {maxPunti} punti
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`${basePath}/scommesse?giornataId=${id}`}>
            <Button variant="secondary"><Coins size={16} /> Scommesse di giornata</Button>
          </Link>
          {giornata.status === 'DRAFT' && <Button variant="secondary" onClick={() => openG.mutate()}><Unlock size={16} /> Apri</Button>}
          {giornata.status === 'OPEN' && <Button variant="secondary" onClick={() => closeG.mutate()}><Lock size={16} /> Chiudi</Button>}
          {(giornata.status === 'CLOSED' || giornata.status === 'PROCESSED') &&
            <Button variant="secondary" onClick={() => processG.mutate()} loading={processG.isPending}><Cog size={16} /> Elabora</Button>}
          {(giornata.status === 'CLOSED' || giornata.status === 'PROCESSED') &&
            <Button variant="secondary" onClick={() => reopenG.mutate()} loading={reopenG.isPending}><RotateCcw size={16} /> Riapri</Button>}
        </div>
      </div>

      {/* Partite della giornata */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gds-dark">Partite ({matches?.length ?? 0})</h2>
        <Button size="sm" onClick={() => setMatchModal(true)}><CalendarPlus size={15} /> Aggiungi partita</Button>
      </div>
      <p className="text-xs text-gds-gray mb-3">Per ogni partita la schedina contiene due pronostici: esito 1X2 e Under/Over.</p>

      <div className="space-y-3 mb-8">
        {matches?.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gds-gray">Nessuna partita. Aggiungine una per comporre la schedina.</div>}
        {matches?.map((m) => (
          <MatchCard key={m.id} match={m}
            onSaveScore={(home, away) => saveScore.mutate({ matchId: m.id, home, away })}
            saving={saveScore.isPending}
            onValidate={() => validateMatch.mutate(m.id)}
            onDelete={() => { if (confirm('Eliminare la partita?')) deleteMatch.mutate(m.id) }} />
        ))}
      </div>

      {/* Schedine */}
      <h2 className="text-lg font-bold text-gds-dark mb-3">Schedine ({schedine?.length ?? 0})</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead><tr className="bg-gds-dark text-white">
            <th className="px-4 py-2.5 text-left font-semibold">ID</th><th className="px-4 py-2.5 text-left font-semibold">Utente</th>
            <th className="px-4 py-2.5 text-left font-semibold">Stato</th><th className="px-4 py-2.5 text-left font-semibold">Punti</th>
            <th className="px-4 py-2.5 text-left font-semibold">Vincente</th>
          </tr></thead>
          <tbody>
            {schedine?.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gds-gray">Nessuna schedina.</td></tr>}
            {schedine?.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-2.5 text-gds-gray">#{s.id}</td>
                <td className="px-4 py-2.5 text-gds-gray">utente {s.userId}</td>
                <td className="px-4 py-2.5"><Badge color={SCH_COLOR[s.status] ?? 'gray'}>{s.status}</Badge></td>
                <td className="px-4 py-2.5 font-semibold text-gds-dark">{s.correctCount ?? '—'}</td>
                <td className="px-4 py-2.5">{s.isWinner ? '🏆' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <AddMatchModal isOpen={matchModal} onClose={() => setMatchModal(false)}
        giornataId={id} teams={teams} leagues={leagues} onCreated={invalidate} />
    </div>
  )
}

/* ─── Card partita: punteggio + esiti calcolati ──────────────────────────────── */
function MatchCard({ match, onSaveScore, saving, onValidate, onDelete }) {
  const [h, setH] = useState(match?.homeScore ?? '')
  const [a, setA] = useState(match?.awayScore ?? '')
  const validated = match.status === 'VALIDATED'

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gds-dark">{match.homeTeamName} – {match.awayTeamName}</p>
          <p className="text-xs text-gds-gray">
            {match.scheduledAt && <>{String(match.scheduledAt).slice(0, 16).replace('T', ' ')} · </>}
            Under/Over {match.overUnderLine}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={0} value={h} onChange={(e) => setH(e.target.value)} placeholder="–" disabled={validated}
            className="w-14 text-center rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-gds-pink outline-none disabled:bg-gray-50" />
          <span className="text-gds-gray">-</span>
          <input type="number" min={0} value={a} onChange={(e) => setA(e.target.value)} placeholder="–" disabled={validated}
            className="w-14 text-center rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-gds-pink outline-none disabled:bg-gray-50" />
          {!validated && (
            <Button size="sm" variant="secondary" loading={saving}
              disabled={h === '' || a === ''} onClick={() => onSaveScore(h, a)}><Save size={14} /> Salva</Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {match.result1x2 && <Badge color="blue">Esito: {match.result1x2}</Badge>}
        {match.resultUO && <Badge color="blue">{match.resultUO === 'O' ? 'Over' : 'Under'} {match.overUnderLine}</Badge>}
        {!match.result1x2 && <span className="text-xs text-gds-gray">Punteggio non inserito</span>}
        {validated && <span className="text-xs text-green-700 font-medium inline-flex items-center gap-1"><Check size={13} /> validata</span>}
        <div className="ml-auto flex items-center gap-3">
          {!validated && match.result1x2 && (
            <button onClick={onValidate} className="text-xs text-gds-gray hover:text-green-600 inline-flex items-center gap-1"><Check size={13} /> Valida</button>
          )}
          <button onClick={onDelete} className="text-xs text-gds-gray hover:text-red-600 inline-flex items-center gap-1"><Trash2 size={13} /> Elimina</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: aggiungi partita (squadre stessa divisione, giornata mista) ─────── */
function AddMatchModal({ isOpen, onClose, giornataId, teams, leagues, onCreated }) {
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [when, setWhen] = useState('')
  const [line, setLine] = useState(2.5)
  const [err, setErr] = useState('')

  const homeLeague = teams?.find((t) => t.id === Number(home))?.leagueId
  const awayTeams = (teams || []).filter((t) => !homeLeague || t.leagueId === homeLeague)

  const create = useMutation({
    mutationFn: () => adminApi.createMatch({
      giornataId: Number(giornataId), homeTeamId: Number(home), awayTeamId: Number(away),
      scheduledAt: when, overUnderLine: Number(line),
    }),
    onSuccess: () => { reset(); onCreated(); onClose() },
    onError: (e) => setErr(e.response?.data?.error || 'Errore nella creazione della partita'),
  })

  function reset() { setHome(''); setAway(''); setWhen(''); setLine(2.5); setErr('') }
  function close() { reset(); onClose() }

  function submit() {
    setErr('')
    if (!home || !away) return setErr('Seleziona entrambe le squadre')
    if (home === away) return setErr('Casa e ospite non possono coincidere')
    if (!when) return setErr('Imposta data e ora')
    create.mutate()
  }

  const TeamSelect = ({ value, onChange, list, placeholder }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink">
      <option value="">{placeholder}</option>
      {(leagues || []).map((lg) => {
        const ts = (list || []).filter((t) => t.leagueId === lg.id)
        if (!ts.length) return null
        return <optgroup key={lg.id} label={lg.name}>{ts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
      })}
    </select>
  )

  return (
    <Modal isOpen={isOpen} onClose={close} title="Aggiungi partita" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gds-dark">Casa</label>
            <TeamSelect value={home} onChange={(v) => { setHome(v); setAway('') }} list={teams} placeholder="-- squadra casa --" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gds-dark">Ospite</label>
            <TeamSelect value={away} onChange={setAway} list={awayTeams} placeholder="-- squadra ospite --" /></div>
        </div>
        <p className="text-xs text-gds-gray -mt-2">Le due squadre devono essere della stessa divisione. La giornata può contenere partite di divisioni diverse.</p>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Data e ora" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          <Input label="Soglia Under/Over" type="number" step="0.5" value={line} onChange={(e) => setLine(e.target.value)} />
        </div>

        {err && <div className="bg-red-50 text-red-700 rounded-lg p-2.5 text-sm">{err}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={close}>Annulla</Button>
          <Button onClick={submit} loading={create.isPending}>Crea partita</Button>
        </div>
      </div>
    </Modal>
  )
}
