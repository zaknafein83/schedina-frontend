import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, listiniApi } from '../../api/client'
import Spinner from '../Spinner'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Plus, Trash2, Check, Undo2 } from 'lucide-react'

const BET_TYPES = [
  { value: 'GOAL_NOGOAL',  label: 'Gol/No gol' },
  { value: 'FIRST_SCORER', label: 'Primo marcatore' },
]

/**
 * Modal che gestisce i side bet di una partita (gol/no gol, primo marcatore).
 * Usabile sia da admin che da mod (endpoint accetta entrambi).
 *
 * Props:
 *  - match: { id, homeTeamId, awayTeamId, homeTeamName, awayTeamName }
 *  - isOpen, onClose
 */
export default function MatchSideBetsModal({ match, isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(null) // 'GOAL_NOGOAL' | 'FIRST_SCORER' | null
  const [resolving, setResolving] = useState(null) // bet | null
  const [resolveValue, setResolveValue] = useState('')

  const { data: sideBets, isLoading } = useQuery({
    queryKey: ['admin-match-side-bets', match?.id],
    queryFn: () => adminApi.getMatchSideBets(match.id).then((r) => r.data),
    enabled: isOpen && !!match?.id,
  })

  // Giocatori delle due squadre (per la risoluzione primo marcatore)
  const { data: homePlayers } = useQuery({
    queryKey: ['listini-players', match?.homeTeamId],
    queryFn: () => listiniApi.players({ teamId: match.homeTeamId }).then((r) => r.data),
    enabled: isOpen && !!match?.homeTeamId,
  })
  const { data: awayPlayers } = useQuery({
    queryKey: ['listini-players', match?.awayTeamId],
    queryFn: () => listiniApi.players({ teamId: match.awayTeamId }).then((r) => r.data),
    enabled: isOpen && !!match?.awayTeamId,
  })

  const createMutation = useMutation({
    mutationFn: (betType) => adminApi.createMatchSideBet(match.id, { betType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-match-side-bets', match.id] })
      setAdding(null)
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore creazione'),
  })

  const deleteMutation = useMutation({
    mutationFn: (sid) => adminApi.deleteMatchSideBet(match.id, sid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-match-side-bets', match.id] }),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ sid, value }) => adminApi.resolveMatchSideBet(match.id, sid, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-match-side-bets', match.id] })
      setResolving(null); setResolveValue('')
    },
    onError: (err) => alert(err.response?.data?.error || 'Errore'),
  })

  if (!match) return null

  const existingTypes = (sideBets || []).map((b) => b.betType)
  const availableTypes = BET_TYPES.filter((t) => !existingTypes.includes(t.value))

  function openResolve(bet) {
    setResolving(bet)
    setResolveValue(bet.officialResult || '')
  }

  function confirmResolve() {
    if (!resolveValue) { alert('Seleziona/inserisci un valore'); return }
    resolveMutation.mutate({ sid: resolving.id, value: resolveValue })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Side bet — ${match.homeTeamName} vs ${match.awayTeamName}`}>
      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {sideBets?.length === 0 && (
            <p className="text-sm text-gds-gray">Nessun side bet configurato per questa partita.</p>
          )}
          {sideBets?.map((b) => (
            <div key={b.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gds-dark">{b.label}</div>
                <div className="text-xs text-gds-gray">
                  Tipo: {b.betType} ·
                  Stato: <strong>{b.status === 'RESOLVED' ? 'Risolto' : 'In attesa'}</strong>
                  {b.officialResultLabel && <> · Risultato: <strong>{b.officialResultLabel}</strong></>}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openResolve(b)}
                  className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                  title={b.status === 'RESOLVED' ? 'Modifica risultato' : 'Risolvi'}
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Eliminare il side bet?')) deleteMutation.mutate(b.id) }}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {availableTypes.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gds-gray mb-2">Aggiungi:</div>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((t) => (
                  <Button key={t.value} variant="secondary" onClick={() => createMutation.mutate(t.value)}>
                    <Plus size={14} /> {t.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {resolving && (
            <div className="border border-gds-pink rounded-lg p-3 bg-gds-pink-light/30">
              <div className="text-sm font-medium text-gds-dark mb-2">Risolvi: {resolving.label}</div>
              {resolving.betType === 'GOAL_NOGOAL' ? (
                <select
                  value={resolveValue}
                  onChange={(e) => setResolveValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="">— Seleziona —</option>
                  <option value="GOAL">Gol (entrambe segnano)</option>
                  <option value="NOGOAL">No gol</option>
                </select>
              ) : (
                <select
                  value={resolveValue}
                  onChange={(e) => setResolveValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="">— Seleziona giocatore —</option>
                  <option value="NONE">Nessun marcatore</option>
                  {(homePlayers || []).map((p) => (
                    <option key={`h-${p.id}`} value={p.id}>{match.homeTeamName} — {p.fullName}</option>
                  ))}
                  {(awayPlayers || []).map((p) => (
                    <option key={`a-${p.id}`} value={p.id}>{match.awayTeamName} — {p.fullName}</option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setResolving(null)}>
                  <Undo2 size={14} /> Annulla
                </Button>
                <Button onClick={confirmResolve} loading={resolveMutation.isPending}>Conferma</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
