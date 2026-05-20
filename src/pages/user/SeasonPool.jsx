import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { seasonPoolApi, seasonCouponApi, listiniApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import { Trophy } from 'lucide-react'

export default function SeasonPoolUser() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [choices, setChoices] = useState({}) // betId -> choiceRef (string)

  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ['user-season-pools'],
    queryFn: () => seasonPoolApi.listOpen().then((r) => r.data),
  })

  const pool = pools?.[0] // in pratica una sola attiva

  const { data: bets, isLoading: betsLoading } = useQuery({
    queryKey: ['user-season-bets', pool?.id],
    queryFn: () => seasonPoolApi.getBets(pool.id).then((r) => r.data),
    enabled: !!pool,
  })

  // Carichiamo team e player per i dropdown (read-only via admin API: utenti loggati
  // hanno comunque accesso via /admin/players? No. Useremo l'endpoint /listini in Fase 10.
  // Per ora ricicliamo gli endpoint admin — nota: questo richiederebbe ADMIN/MOD.
  // Per disaccoppiare, accediamo via i dati embedded nel bet (officialResultLabel) — non basta.
  // Per Fase 7 usiamo la chiamata pubblica /listini che faremo in Fase 10, ma per
  // funzionare ORA mostriamo SOLO i dati che il bet già conosce.
  // → Per ora chiediamo a chi sviluppa la pagina di completarla quando la fase 10 sarà attiva.

  // Verifica se l'utente ha già una schedina per la pool
  const { data: myCoupons } = useQuery({
    queryKey: ['my-season-coupons'],
    queryFn: () => seasonCouponApi.list().then((r) => r.data),
  })

  const existingCoupon = useMemo(() => {
    if (!pool || !myCoupons) return null
    return myCoupons.find((c) => c.seasonPoolId === pool.id && c.status !== 'CANCELLED')
  }, [pool, myCoupons])

  const createMutation = useMutation({
    mutationFn: (data) => seasonCouponApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-season-coupons'] })
      navigate(`/my-season-coupons/${res.data.id}`)
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore creazione schedina'),
  })

  // Raggruppa i bet per torneo
  const betsByTournament = useMemo(() => {
    if (!bets) return {}
    const grouped = {}
    for (const b of bets) {
      const key = b.tournamentName || '—'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(b)
    }
    return grouped
  }, [bets])

  if (poolsLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!pool) {
    return (
      <div className="text-center py-20">
        <Trophy size={48} className="mx-auto text-gds-gray mb-4" />
        <h1 className="text-xl font-bold text-gds-dark">Nessuna pool stagionale aperta</h1>
        <p className="text-sm text-gds-gray mt-2">Torna più tardi quando l'amministrazione apre i pronostici stagionali.</p>
      </div>
    )
  }

  if (existingCoupon) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <h1 className="text-xl font-bold text-gds-dark mb-2">Schedina già compilata</h1>
        <p className="text-sm text-gds-gray mb-4">
          Hai già una schedina per <strong>{pool.name}</strong> (stato: {existingCoupon.status}).
        </p>
        <Button onClick={() => navigate(`/my-season-coupons/${existingCoupon.id}`)}>
          Vedi schedina
        </Button>
      </div>
    )
  }

  const allChosen = bets && bets.every((b) => choices[b.id])

  function submit() {
    const payload = {
      seasonPoolId: pool.id,
      predictions: bets.map((b) => ({ seasonBetId: b.id, choiceRef: String(choices[b.id]) })),
    }
    createMutation.mutate(payload)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gds-dark">{pool.name}</h1>
        <p className="text-sm text-gds-gray mt-1">
          Stagione {pool.seasonLabel} · {bets?.length || 0} pronostici · Chiusura {pool.closeAt ? new Date(pool.closeAt).toLocaleString() : '—'}
        </p>
      </div>

      {betsLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <>
          {Object.entries(betsByTournament).map(([tournamentName, list]) => (
            <div key={tournamentName} className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
              <div className="bg-gds-dark text-white px-4 py-2 font-semibold">{tournamentName}</div>
              <div className="divide-y divide-gray-100">
                {list.map((b) => (
                  <BetSelector
                    key={b.id}
                    bet={b}
                    value={choices[b.id] || ''}
                    onChange={(v) => setChoices((c) => ({ ...c, [b.id]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={submit} disabled={!allChosen} loading={createMutation.isPending}>
              Conferma schedina ({Object.keys(choices).length}/{bets?.length || 0})
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function BetSelector({ bet, value, onChange }) {
  const { data: teams } = useQuery({
    queryKey: ['listini-teams'],
    queryFn: () => listiniApi.teams().then((r) => r.data),
    enabled: bet.targetKind === 'TEAM',
    staleTime: 60_000,
  })
  const { data: players } = useQuery({
    queryKey: ['listini-players'],
    queryFn: () => listiniApi.players().then((r) => r.data),
    enabled: bet.targetKind === 'PLAYER',
    staleTime: 60_000,
  })

  const options = bet.targetKind === 'TEAM'
    ? (teams || []).map((t) => ({ id: t.id, name: t.name }))
    : (players || []).map((p) => ({ id: p.id, name: p.fullName + (p.teamName ? ` (${p.teamName})` : '') }))

  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-gds-dark">{bet.label}</div>
        <div className="text-xs text-gds-gray">{bet.targetKind === 'TEAM' ? 'Squadra' : 'Giocatore'}</div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink min-w-[200px]"
      >
        <option value="">— Seleziona —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  )
}
