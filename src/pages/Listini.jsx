import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listiniApi, adminApi } from '../api/client'
import Spinner from '../components/Spinner'
import { Users, User, Trophy } from 'lucide-react'

const ROLE_LABELS = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', FWD: 'Attaccante' }

export default function Listini() {
  const [tab, setTab] = useState('teams')
  const [leagueFilter, setLeagueFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Le leghe sono read via endpoint admin, ma se l'utente non è admin/mod fallisce.
  // Per evitare errori UI, useremo getLeagues solo se utile; in alternativa, leggiamo
  // l'elenco leghe dalle squadre stesse.
  const { data: leaguesAdmin } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: () => adminApi.getLeagues().then((r) => r.data),
    retry: false,
  })

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['listini-teams-all', leagueFilter],
    queryFn: () => listiniApi.teams(leagueFilter || undefined).then((r) => r.data),
  })

  const leaguesFromTeams = Array.from(new Map(
    (teams || []).filter((t) => t.leagueId).map((t) => [t.leagueId, { id: t.leagueId, name: null }])
  ).values())
  const leagues = leaguesAdmin || leaguesFromTeams

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['listini-players-all', leagueFilter, teamFilter, roleFilter],
    queryFn: () => {
      const params = {}
      if (leagueFilter) params.leagueId = leagueFilter
      if (teamFilter) params.teamId = teamFilter
      if (roleFilter) params.role = roleFilter
      return listiniApi.players(params).then((r) => r.data)
    },
    enabled: tab === 'players',
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gds-pink-light rounded-lg">
          <Trophy size={22} className="text-gds-pink" />
        </div>
        <h1 className="text-2xl font-bold text-gds-white">Listini</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gds-border">
        <button
          onClick={() => setTab('teams')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'teams' ? 'border-gds-pink text-gds-pink' : 'border-transparent text-gds-gray hover:text-gds-white'
          }`}
        >
          <Users size={14} className="inline mr-1" /> Squadre
        </button>
        <button
          onClick={() => setTab('players')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'players' ? 'border-gds-pink text-gds-pink' : 'border-transparent text-gds-gray hover:text-gds-white'
          }`}
        >
          <User size={14} className="inline mr-1" /> Giocatori
        </button>
      </div>

      {/* Filtri */}
      <div className="bg-gds-surface rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-gds-white block mb-1">Lega</label>
          <select
            value={leagueFilter}
            onChange={(e) => { setLeagueFilter(e.target.value); setTeamFilter('') }}
            className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface"
          >
            <option value="">Tutte le leghe</option>
            {leagues?.map((l) => (
              <option key={l.id} value={l.id}>{l.name || `Lega #${l.id}`}</option>
            ))}
          </select>
        </div>
        {tab === 'players' && (
          <>
            <div>
              <label className="text-sm font-medium text-gds-white block mb-1">Squadra</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface"
              >
                <option value="">Tutte le squadre</option>
                {(teams || []).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gds-white block mb-1">Ruolo</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-gds-border px-3 py-2 text-sm bg-gds-surface"
              >
                <option value="">Tutti i ruoli</option>
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Tabella */}
      <div className="bg-gds-surface rounded-xl shadow-sm overflow-hidden">
        {tab === 'teams' ? (
          teamsLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gds-dark text-white">
                  <th className="px-6 py-3 text-left font-semibold">Squadra</th>
                  <th className="px-6 py-3 text-left font-semibold">Sigla</th>
                </tr>
              </thead>
              <tbody>
                {teams?.length === 0 && (
                  <tr><td colSpan={2} className="text-center py-10 text-gds-gray">Nessuna squadra.</td></tr>
                )}
                {teams?.map((t) => (
                  <tr key={t.id} className="border-t border-gds-border">
                    <td className="px-6 py-3 font-medium text-gds-white">{t.name}</td>
                    <td className="px-6 py-3 text-gds-gray">{t.shortName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
        ) : (
          playersLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gds-dark text-white">
                  <th className="px-6 py-3 text-left font-semibold">Cognome</th>
                  <th className="px-6 py-3 text-left font-semibold">Nome</th>
                  <th className="px-6 py-3 text-left font-semibold">Squadra</th>
                  <th className="px-6 py-3 text-left font-semibold">Ruolo</th>
                </tr>
              </thead>
              <tbody>
                {players?.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-gds-gray">Nessun giocatore.</td></tr>
                )}
                {players?.map((p) => (
                  <tr key={p.id} className="border-t border-gds-border">
                    <td className="px-6 py-3 font-medium text-gds-white">{p.lastName}</td>
                    <td className="px-6 py-3 text-gds-white">{p.firstName}</td>
                    <td className="px-6 py-3 text-gds-gray">{p.teamName || '—'}</td>
                    <td className="px-6 py-3 text-gds-gray">{ROLE_LABELS[p.role] || p.role || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
        )}
      </div>
    </div>
  )
}
