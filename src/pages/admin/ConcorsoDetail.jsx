import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { ArrowLeft, Plus, Trash2, Check, RotateCcw, Ban, Lock, Unlock, Cog, Save, CalendarPlus } from 'lucide-react'

const MARKETS = [
  { value: 'RESULT_1X2', label: 'Esito 1X2', target: 'TOKEN' },
  { value: 'UNDER_OVER', label: 'Under/Over', target: 'TOKEN' },
  { value: 'GOAL_NOGOAL', label: 'Gol/No gol', target: 'TOKEN' },
  { value: 'WINNER', label: 'Vincitore', target: 'TEAM' },
  { value: 'CLEAN_SHEET_TEAM', label: 'Più clean sheet', target: 'TEAM' },
  { value: 'MOST_GOALS_FOR', label: 'Più gol fatti', target: 'TEAM' },
  { value: 'LEAST_GOALS_AGAINST', label: 'Meno gol subiti', target: 'TEAM' },
  { value: 'FIRST_SCORER', label: 'Primo marcatore', target: 'PLAYER' },
  { value: 'TOP_SCORER', label: 'Capocannoniere', target: 'PLAYER' },
  { value: 'TOP_ASSIST', label: 'Miglior assist', target: 'PLAYER' },
  { value: 'BEST_GOALKEEPER', label: 'Miglior portiere', target: 'PLAYER' },
]
const MANUAL_MARKETS = MARKETS.filter((m) => m.target !== 'TOKEN')
const marketLabel = (m) => MARKETS.find((x) => x.value === m)?.label ?? m
const targetOf = (m) => MARKETS.find((x) => x.value === m)?.target ?? 'TOKEN'
const STATUS_COLOR = { DRAFT: 'gray', OPEN: 'green', CLOSED: 'yellow', PROCESSED: 'blue', CANCELLED: 'red' }
const BET_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }
const refLabel = (bet, ref) => bet.options?.find((o) => o.ref === ref)?.label ?? ref

export default function ConcorsoDetail() {
  const { id } = useParams()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/mod') ? '/mod' : '/admin'
  const queryClient = useQueryClient()

  const [matchModal, setMatchModal] = useState(false)
  const [betModal, setBetModal] = useState(false)
  const [options, setOptions] = useState([]) // opzioni per scommesse TEAM/PLAYER

  const { data: concorso, isLoading } = useQuery({
    queryKey: ['admin-concorso', id],
    queryFn: () => adminApi.getConcorso(id).then((r) => r.data),
  })
  const { data: bets } = useQuery({
    queryKey: ['admin-scommesse', id],
    queryFn: () => adminApi.getScommesse({ concorsoId: id }).then((r) => r.data),
  })
  const { data: schedine } = useQuery({
    queryKey: ['admin-schedine', id],
    queryFn: () => adminApi.getSchedineByConcorso(id).then((r) => r.data),
  })
  const { data: matches } = useQuery({ queryKey: ['admin-matches-all'], queryFn: () => adminApi.getMatches().then((r) => r.data) })
  const { data: teams } = useQuery({ queryKey: ['admin-teams-all'], queryFn: () => adminApi.getTeams().then((r) => r.data) })
  const { data: leagues } = useQuery({ queryKey: ['admin-leagues'], queryFn: () => adminApi.getLeagues().then((r) => r.data) })
  const { data: players } = useQuery({ queryKey: ['admin-players-all'], queryFn: () => adminApi.getPlayers().then((r) => r.data) })

  const matchById = Object.fromEntries((matches || []).map((m) => [m.id, m]))
  const teamName = (tid) => teams?.find((t) => t.id === Number(tid))?.name ?? '?'

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-scommesse', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-concorso', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-matches-all'] })
  }
  const invalidateAll = () => {
    invalidate()
    queryClient.invalidateQueries({ queryKey: ['admin-schedine', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-concorsi'] })
  }

  const resolveBet = useMutation({ mutationFn: ({ betId, ref }) => adminApi.resolveScommessa(betId, ref), onSuccess: invalidate })
  const unresolveBet = useMutation({ mutationFn: (betId) => adminApi.unresolveScommessa(betId), onSuccess: invalidate })
  const voidBet = useMutation({ mutationFn: (betId) => adminApi.voidScommessa(betId), onSuccess: invalidate })
  const deleteBet = useMutation({ mutationFn: (betId) => adminApi.deleteScommessa(betId), onSuccess: invalidate })
  const saveScore = useMutation({
    mutationFn: ({ matchId, home, away }) => adminApi.setMatchResult(matchId, Number(home), Number(away)),
    onSuccess: invalidate,
  })
  const openC = useMutation({ mutationFn: () => adminApi.openConcorso(id), onSuccess: invalidateAll })
  const closeC = useMutation({ mutationFn: () => adminApi.closeConcorso(id), onSuccess: invalidateAll })
  const processC = useMutation({ mutationFn: () => adminApi.processConcorso(id), onSuccess: invalidateAll })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!concorso) return <div className="text-gds-gray">Concorso non trovato.</div>

  const matchBets = (bets || []).filter((b) => b.matchId)
  const otherBets = (bets || []).filter((b) => !b.matchId)
  const matchGroups = []
  const seen = {}
  for (const b of matchBets) {
    if (!seen[b.matchId]) { seen[b.matchId] = { matchId: b.matchId, bets: [] }; matchGroups.push(seen[b.matchId]) }
    seen[b.matchId].bets.push(b)
  }

  return (
    <div>
      <Link to={`${basePath}/concorsi`} className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Concorsi
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gds-dark">{concorso.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge color={STATUS_COLOR[concorso.status]}>{concorso.status}</Badge>
            <span className="text-sm text-gds-gray">{concorso.kind === 'SEASON' ? 'Stagionale' : 'Giornata'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {concorso.status === 'DRAFT' && <Button variant="secondary" onClick={() => openC.mutate()}><Unlock size={16} /> Apri</Button>}
          {concorso.status === 'OPEN' && <Button variant="secondary" onClick={() => closeC.mutate()}><Lock size={16} /> Chiudi</Button>}
          {(concorso.status === 'CLOSED' || concorso.status === 'PROCESSED') &&
            <Button variant="secondary" onClick={() => processC.mutate()} loading={processC.isPending}><Cog size={16} /> Elabora</Button>}
        </div>
      </div>

      {/* Partite (pronostici 1X2 / U-O / Gol-Nogol legati a una partita) */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gds-dark">Partite ({matchGroups.length})</h2>
        <Button size="sm" onClick={() => setMatchModal(true)}><CalendarPlus size={15} /> Aggiungi partita</Button>
      </div>

      <div className="space-y-3 mb-8">
        {matchGroups.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gds-gray">Nessuna partita. Aggiungine una per comporre la schedina.</div>}
        {matchGroups.map((g) => (
          <MatchCard key={g.matchId} group={g} match={matchById[g.matchId]}
            onSaveScore={(home, away) => saveScore.mutate({ matchId: g.matchId, home, away })}
            saving={saveScore.isPending}
            onUnresolve={(betId) => unresolveBet.mutate(betId)}
            onDelete={(betId) => deleteBet.mutate(betId)} />
        ))}
      </div>

      {/* Altre scommesse (stagionali / manuali) */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gds-dark">Altre scommesse ({otherBets.length})</h2>
        <Button size="sm" variant="secondary" onClick={() => { setOptions([]); setBetModal(true) }}><Plus size={15} /> Aggiungi (vincitore, capocannoniere…)</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        {otherBets.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gds-gray col-span-full">Nessuna scommessa stagionale/manuale.</div>}
        {otherBets.map((bet) => (
          <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-semibold text-gds-dark">{bet.label}</p><p className="text-xs text-gds-gray">{marketLabel(bet.market)}</p></div>
              <Badge color={BET_COLOR[bet.status]}>{bet.status}</Badge>
            </div>
            {bet.status === 'RESOLVED' ? (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1"><Check size={15} /> {refLabel(bet, bet.officialResultRef)}</span>
                <button onClick={() => unresolveBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-gds-pink inline-flex items-center gap-1"><RotateCcw size={13} /> Annulla esito</button>
              </div>
            ) : bet.status === 'VOID' ? (
              <p className="mt-3 text-sm text-gds-gray italic">Annullata</p>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-gds-gray mb-1.5">Imposta l'esito vincente:</p>
                <div className="flex flex-wrap gap-1.5">
                  {bet.options?.map((o) => (
                    <button key={o.id} onClick={() => resolveBet.mutate({ betId: bet.id, ref: o.ref })}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 hover:border-gds-pink hover:bg-gds-pink-light text-gds-dark transition-colors">{o.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end gap-3">
              {bet.status !== 'VOID' && <button onClick={() => voidBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-yellow-600 inline-flex items-center gap-1"><Ban size={13} /> Annulla</button>}
              <button onClick={() => deleteBet.mutate(bet.id)} className="text-xs text-gds-gray hover:text-red-600 inline-flex items-center gap-1"><Trash2 size={13} /> Elimina</button>
            </div>
          </div>
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
                <td className="px-4 py-2.5 text-gds-gray">{s.userId}</td>
                <td className="px-4 py-2.5"><Badge color={s.status === 'WINNING' ? 'green' : s.status === 'NOT_WINNING' ? 'red' : 'gray'}>{s.status}</Badge></td>
                <td className="px-4 py-2.5 font-semibold text-gds-dark">{s.correctCount ?? '—'}</td>
                <td className="px-4 py-2.5">{s.isWinner ? '🏆' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <AddMatchModal isOpen={matchModal} onClose={() => setMatchModal(false)}
        concorsoId={id} teams={teams} leagues={leagues} teamName={teamName}
        onCreated={invalidate} />

      <AddBetModal isOpen={betModal} onClose={() => setBetModal(false)}
        concorsoId={id} teams={teams} players={players} options={options} setOptions={setOptions}
        onCreated={invalidate} />
    </div>
  )
}

/* ─── Card partita con inserimento punteggio ─────────────────────────────── */
function MatchCard({ group, match, onSaveScore, saving, onUnresolve, onDelete }) {
  const [h, setH] = useState(match?.homeScore ?? '')
  const [a, setA] = useState(match?.awayScore ?? '')
  const home = match?.homeTeamName ?? '?'
  const away = match?.awayTeamName ?? '?'

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gds-dark">{home} – {away}</p>
          {match?.scheduledAt && <p className="text-xs text-gds-gray">{String(match.scheduledAt).slice(0, 16).replace('T', ' ')}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={0} value={h} onChange={(e) => setH(e.target.value)} placeholder="–"
            className="w-14 text-center rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-gds-pink outline-none" />
          <span className="text-gds-gray">-</span>
          <input type="number" min={0} value={a} onChange={(e) => setA(e.target.value)} placeholder="–"
            className="w-14 text-center rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-gds-pink outline-none" />
          <Button size="sm" variant="secondary" loading={saving}
            disabled={h === '' || a === ''} onClick={() => onSaveScore(h, a)}><Save size={14} /> Salva</Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {group.bets.map((bet) => (
          <div key={bet.id} className="flex items-center gap-2 bg-gds-gray-light rounded-lg px-3 py-1.5">
            <span className="text-xs text-gds-gray">{marketLabel(bet.market)}</span>
            {bet.status === 'RESOLVED'
              ? <Badge color="green">{refLabel(bet, bet.officialResultRef)}</Badge>
              : bet.status === 'VOID' ? <Badge color="gray">annullata</Badge>
              : <Badge color="yellow">aperta</Badge>}
            {bet.status === 'RESOLVED' && (
              <button title="Annulla esito" onClick={() => onUnresolve(bet.id)} className="text-gds-gray hover:text-gds-pink"><RotateCcw size={13} /></button>
            )}
            <button title="Elimina pronostico" onClick={() => onDelete(bet.id)} className="text-gds-gray hover:text-red-600"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Modal: aggiungi partita (squadre + mercati) ────────────────────────── */
function AddMatchModal({ isOpen, onClose, concorsoId, teams, leagues, teamName, onCreated }) {
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [when, setWhen] = useState('')
  const [mk, setMk] = useState({ x1x2: true, uo: false, gg: false })
  const [line, setLine] = useState(2.5)
  const [err, setErr] = useState('')

  const homeLeague = teams?.find((t) => t.id === Number(home))?.leagueId
  // l'ospite deve essere della stessa lega della casa (vincolo backend)
  const awayTeams = (teams || []).filter((t) => !homeLeague || t.leagueId === homeLeague)

  const create = useMutation({
    mutationFn: async () => {
      const match = (await adminApi.createMatch({
        homeTeamId: Number(home), awayTeamId: Number(away), scheduledAt: when,
      })).data
      const hn = teamName(home), an = teamName(away)
      const tasks = []
      if (mk.x1x2) tasks.push(adminApi.createScommessa({ concorsoId: Number(concorsoId), market: 'RESULT_1X2', matchId: match.id, label: `${hn} – ${an} · Esito` }))
      if (mk.uo) tasks.push(adminApi.createScommessa({ concorsoId: Number(concorsoId), market: 'UNDER_OVER', matchId: match.id, overUnderLine: Number(line), label: `${hn} – ${an} · U/O ${line}` }))
      if (mk.gg) tasks.push(adminApi.createScommessa({ concorsoId: Number(concorsoId), market: 'GOAL_NOGOAL', matchId: match.id, label: `${hn} – ${an} · Gol/No gol` }))
      await Promise.all(tasks)
    },
    onSuccess: () => { reset(); onCreated(); onClose() },
    onError: (e) => setErr(e.response?.data?.error || 'Errore nella creazione della partita'),
  })

  function reset() { setHome(''); setAway(''); setWhen(''); setMk({ x1x2: true, uo: false, gg: false }); setLine(2.5); setErr('') }
  function close() { reset(); onClose() }

  function submit() {
    setErr('')
    if (!home || !away) return setErr('Seleziona entrambe le squadre')
    if (home === away) return setErr('Casa e ospite non possono coincidere')
    if (!when) return setErr('Imposta data e ora')
    if (!mk.x1x2 && !mk.uo && !mk.gg) return setErr('Seleziona almeno un mercato')
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
        <p className="text-xs text-gds-gray -mt-2">Le due squadre devono essere della stessa divisione. La schedina può contenere partite di divisioni diverse.</p>

        <Input label="Data e ora" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />

        <div>
          <label className="text-sm font-medium text-gds-dark">Mercati da creare</label>
          <div className="mt-1 space-y-2">
            <label className="flex items-center gap-2 text-sm text-gds-dark"><input type="checkbox" checked={mk.x1x2} onChange={(e) => setMk({ ...mk, x1x2: e.target.checked })} className="rounded text-gds-pink focus:ring-gds-pink" /> Esito 1X2</label>
            <label className="flex items-center gap-2 text-sm text-gds-dark">
              <input type="checkbox" checked={mk.uo} onChange={(e) => setMk({ ...mk, uo: e.target.checked })} className="rounded text-gds-pink focus:ring-gds-pink" /> Under/Over
              {mk.uo && <input type="number" step="0.5" value={line} onChange={(e) => setLine(e.target.value)} className="w-20 ml-2 rounded-lg border border-gray-200 px-2 py-1 text-sm" />}
            </label>
            <label className="flex items-center gap-2 text-sm text-gds-dark"><input type="checkbox" checked={mk.gg} onChange={(e) => setMk({ ...mk, gg: e.target.checked })} className="rounded text-gds-pink focus:ring-gds-pink" /> Gol/No gol</label>
          </div>
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

/* ─── Modal: scommessa stagionale/manuale (TEAM/PLAYER) ───────────────────── */
function AddBetModal({ isOpen, onClose, concorsoId, teams, players, options, setOptions, onCreated }) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { market: 'WINNER', label: '' } })
  const market = watch('market')
  const target = targetOf(market)

  const create = useMutation({
    mutationFn: (payload) => adminApi.createScommessa(payload),
    onSuccess: () => { reset(); setOptions([]); onCreated(); onClose() },
  })

  function toggle(ref, label) {
    setOptions((prev) => prev.some((o) => o.ref === ref) ? prev.filter((o) => o.ref !== ref) : [...prev, { ref: String(ref), label }])
  }

  function onSubmit(data) {
    if (options.length < 2) { alert('Seleziona almeno 2 opzioni'); return }
    create.mutate({ concorsoId: Number(concorsoId), label: data.label, market: data.market, options })
  }

  function close() { reset(); setOptions([]); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Aggiungi scommessa stagionale/manuale" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gds-dark">Mercato</label>
          <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink" {...register('market')}>
            {MANUAL_MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <Input label="Etichetta" placeholder="es. Vincitore Serie A" error={errors.label?.message} {...register('label', { required: 'Etichetta obbligatoria' })} />
        {target === 'TEAM' && <OptionPicker label="Squadre candidate" items={teams} getRef={(t) => t.id} getLabel={(t) => t.name} options={options} toggle={toggle} />}
        {target === 'PLAYER' && <OptionPicker label="Giocatori candidati" items={players} getRef={(p) => p.id} getLabel={(p) => `${p.firstName} ${p.lastName}`} options={options} toggle={toggle} />}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>Annulla</Button>
          <Button type="submit" loading={isSubmitting}>Crea</Button>
        </div>
      </form>
    </Modal>
  )
}

function OptionPicker({ label, items, getRef, getLabel, options, toggle }) {
  const [q, setQ] = useState('')
  const filtered = (items || []).filter((it) => getLabel(it).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gds-dark">{label} ({options.length} selezionate)</label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtra…"
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gds-pink mb-1" />
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
        {filtered.length === 0 && <p className="text-xs text-gds-gray px-1">Nessun elemento.</p>}
        {filtered.map((it) => {
          const ref = String(getRef(it))
          return (
            <label key={ref} className="flex items-center gap-2 text-sm px-1 py-0.5 hover:bg-gds-gray-light rounded cursor-pointer">
              <input type="checkbox" checked={options.some((o) => o.ref === ref)} onChange={() => toggle(ref, getLabel(it))} className="rounded text-gds-pink focus:ring-gds-pink" />
              {getLabel(it)}
            </label>
          )
        })}
      </div>
    </div>
  )
}
