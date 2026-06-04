import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { ArrowLeft, Trash2, Save, CalendarPlus, Check } from 'lucide-react'

const ROLE_LABEL = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', FWD: 'Attaccante' }
const roleLabel = (r) => ROLE_LABEL[r] ?? r ?? ''

/** Data odierna in formato YYYY-MM-DD nel fuso locale (per gli input type="date"). */
function todayLocal() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

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
  const { data: teams } = useQuery({
    queryKey: ['admin-teams', giornata?.leagueId],
    queryFn: () => adminApi.getTeams(giornata.leagueId).then((r) => r.data),
    enabled: !!giornata?.leagueId,
  })
  const { data: players } = useQuery({
    queryKey: ['admin-players-league', giornata?.leagueId],
    queryFn: () => adminApi.getPlayers({ leagueId: giornata.leagueId }).then((r) => r.data),
    enabled: !!giornata?.leagueId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-giornata-matches', id] })

  const saveScore = useMutation({
    mutationFn: ({ matchId, home, away }) => adminApi.setMatchResult(matchId, Number(home), Number(away)),
    onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore punteggio'),
  })
  const validateMatch = useMutation({ mutationFn: (matchId) => adminApi.validateMatch(matchId), onSuccess: invalidate })
  const deleteMatch = useMutation({ mutationFn: (matchId) => adminApi.deleteMatch(matchId), onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore') })
  const setScorer = useMutation({
    mutationFn: ({ matchId, playerId }) => adminApi.setFirstScorer(matchId, playerId),
    onSuccess: invalidate, onError: (e) => alert(e.response?.data?.error || 'Errore marcatore'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!giornata) return <div className="text-gds-gray">Giornata non trovata.</div>

  return (
    <div>
      <Link to={`${basePath}/giornate`} className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Calendario
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gds-white">{giornata.name}</h1>
          <p className="text-sm text-gds-gray mt-1">{giornata.leagueName} · turno {giornata.number}</p>
        </div>
        <Button size="sm" onClick={() => setMatchModal(true)}><CalendarPlus size={15} /> Aggiungi partita</Button>
      </div>

      <p className="text-xs text-gds-gray mb-3">Le partite di questa giornata possono essere selezionate in un Concorso. Qui inserisci i punteggi e il primo marcatore.</p>

      <div className="space-y-3">
        {matches?.length === 0 && <div className="bg-gds-surface rounded-xl p-6 text-center text-gds-gray">Nessuna partita.</div>}
        {matches?.map((m) => (
          <MatchCard key={m.id} match={m} players={players}
            onSaveScore={(home, away) => saveScore.mutate({ matchId: m.id, home, away })}
            saving={saveScore.isPending}
            onValidate={() => validateMatch.mutate(m.id)}
            onScorer={(playerId) => setScorer.mutate({ matchId: m.id, playerId })}
            onDelete={() => { if (confirm('Eliminare la partita?')) deleteMatch.mutate(m.id) }} />
        ))}
      </div>

      <AddMatchModal isOpen={matchModal} onClose={() => setMatchModal(false)}
        giornataId={id} teams={teams} onCreated={invalidate} />
    </div>
  )
}

function MatchCard({ match, players, onSaveScore, saving, onValidate, onScorer, onDelete }) {
  const [h, setH] = useState(match?.homeScore ?? '')
  const [a, setA] = useState(match?.awayScore ?? '')
  const validated = match.status === 'VALIDATED'
  const matchPlayers = (players || []).filter((p) => p.teamId === match.homeTeamId || p.teamId === match.awayTeamId)

  return (
    <div className="bg-gds-surface rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gds-white">{match.homeTeamName} – {match.awayTeamName}</p>
          <p className="text-xs text-gds-gray">
            {match.scheduledAt && <>{String(match.scheduledAt).slice(0, 10)} · </>}
            Under/Over {match.overUnderLine}
            {match.concorsoId && <> · <span className="text-gds-pink">in concorso</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={0} value={h} onChange={(e) => setH(e.target.value)} placeholder="–" disabled={validated}
            className="w-14 text-center rounded-lg border border-gds-border px-2 py-1.5 text-sm bg-white text-gray-900 font-semibold focus:ring-2 focus:ring-gds-pink outline-none disabled:bg-gds-pink-light" />
          <span className="text-gds-gray">-</span>
          <input type="number" min={0} value={a} onChange={(e) => setA(e.target.value)} placeholder="–" disabled={validated}
            className="w-14 text-center rounded-lg border border-gds-border px-2 py-1.5 text-sm bg-white text-gray-900 font-semibold focus:ring-2 focus:ring-gds-pink outline-none disabled:bg-gds-pink-light" />
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

      {/* Primo marcatore (per la scommessa di partita) */}
      <div className="mt-3 pt-2 border-t border-gds-border flex items-center gap-2">
        <span className="text-xs text-gds-gray">Primo marcatore:</span>
        <select value={match.firstScorerOwnGoal ? '-1' : (match.firstScorerPlayerId ?? '')} onChange={(e) => onScorer(e.target.value ? Number(e.target.value) : null)}
          className="text-sm rounded-lg border border-gds-border px-2 py-1 bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink">
          <option value="">— nessuno —</option>
          {matchPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName} — {roleLabel(p.role)} · {p.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName}
            </option>
          ))}
          <option value="-1">⚽ Autogol</option>
        </select>
      </div>
    </div>
  )
}

function AddMatchModal({ isOpen, onClose, giornataId, teams, onCreated }) {
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [when, setWhen] = useState(todayLocal())
  const [line, setLine] = useState(3.5)
  const [err, setErr] = useState('')

  const create = useMutation({
    mutationFn: () => adminApi.createMatch({
      giornataId: Number(giornataId), homeTeamId: Number(home), awayTeamId: Number(away),
      // L'utente inserisce solo la data: la fissiamo a mezzanotte per il LocalDateTime del backend.
      scheduledAt: `${when}T00:00:00`, overUnderLine: Number(line),
    }),
    onSuccess: () => { reset(); onCreated(); onClose() },
    onError: (e) => setErr(e.response?.data?.error || 'Errore nella creazione'),
  })

  function reset() { setHome(''); setAway(''); setWhen(todayLocal()); setLine(3.5); setErr('') }
  function close() { reset(); onClose() }
  function submit() {
    setErr('')
    if (!home || !away) return setErr('Seleziona entrambe le squadre')
    if (home === away) return setErr('Casa e ospite non possono coincidere')
    if (!when) return setErr('Imposta la data')
    create.mutate()
  }

  const Select = ({ value, onChange, ph }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface outline-none focus:ring-2 focus:ring-gds-pink">
      <option value="">{ph}</option>
      {(teams || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  )

  return (
    <Modal isOpen={isOpen} onClose={close} title="Aggiungi partita" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gds-white">Casa</label>
            <Select value={home} onChange={setHome} ph="-- squadra casa --" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gds-white">Ospite</label>
            <Select value={away} onChange={setAway} ph="-- squadra ospite --" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Data" type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
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
