import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contestApi, couponApi, listiniApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import { ArrowLeft, Trophy } from 'lucide-react'

const CHOICES_1X2 = ['1', 'X', '2']
const CHOICES_UO  = ['U', 'O']

function choicesFor(match) {
  return match.betType === 'UNDER_OVER' ? CHOICES_UO : CHOICES_1X2
}

function ChoiceButton({ choice, selected, onClick }) {
  const isUO = choice === 'U' || choice === 'O'
  return (
    <button
      type="button"
      onClick={() => onClick(choice)}
      className={`h-10 rounded-lg text-sm font-bold transition-colors border-2 px-3
        ${isUO ? 'min-w-[3rem]' : 'w-10'}
        ${
          selected
            ? 'bg-gds-pink border-gds-pink text-white'
            : 'bg-white border-gray-200 text-gds-dark hover:border-gds-pink hover:text-gds-pink'
        }`}
    >
      {choice}
    </button>
  )
}

function MatchSideBetsInline({ match, values, onChange }) {
  const { data: sideBets } = useQuery({
    queryKey: ['contest-match-side-bets', match.id],
    queryFn: () => contestApi.getMatchSideBets(match.id).then((r) => r.data),
    staleTime: 60_000,
  })
  const { data: homePlayers } = useQuery({
    queryKey: ['listini-players', match.homeTeamId],
    queryFn: () => listiniApi.players({ teamId: match.homeTeamId }).then((r) => r.data),
    enabled: !!(sideBets || []).find((b) => b.betType === 'FIRST_SCORER'),
    staleTime: 60_000,
  })
  const { data: awayPlayers } = useQuery({
    queryKey: ['listini-players', match.awayTeamId],
    queryFn: () => listiniApi.players({ teamId: match.awayTeamId }).then((r) => r.data),
    enabled: !!(sideBets || []).find((b) => b.betType === 'FIRST_SCORER'),
    staleTime: 60_000,
  })

  if (!sideBets || sideBets.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 mt-1 w-full max-w-[260px]">
      {sideBets.map((b) => (
        <div key={b.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gds-gray">{b.label}:</span>
          {b.betType === 'GOAL_NOGOAL' ? (
            <select
              value={values[b.id] || ''}
              onChange={(e) => onChange(b.id, e.target.value)}
              className="rounded border border-gray-200 px-2 py-1 text-xs bg-white"
            >
              <option value="">—</option>
              <option value="GOAL">Goal</option>
              <option value="NOGOAL">No goal</option>
            </select>
          ) : (
            <select
              value={values[b.id] || ''}
              onChange={(e) => onChange(b.id, e.target.value)}
              className="rounded border border-gray-200 px-2 py-1 text-xs bg-white max-w-[180px]"
            >
              <option value="">—</option>
              <option value="NONE">Nessuno</option>
              {(homePlayers || []).map((p) => (
                <option key={`h-${p.id}`} value={p.id}>{p.fullName} ({match.homeTeamName})</option>
              ))}
              {(awayPlayers || []).map((p) => (
                <option key={`a-${p.id}`} value={p.id}>{p.fullName} ({match.awayTeamName})</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ContestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [predictions, setPredictions] = useState({})
  // sideChoices: { [matchSidePredictionId]: choice }
  const [sideChoices, setSideChoices] = useState({})
  const [submitError, setSubmitError] = useState('')

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['contest-matches', id],
    queryFn: () => contestApi.getMatches(id).then((r) => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: (payload) => couponApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      navigate('/my-coupons')
    },
    onError: (err) => {
      setSubmitError(
        err.response?.data?.message || 'Errore nell\'invio della schedina.'
      )
    },
  })

  function toggleChoice(matchId, choice, match) {
    setPredictions((prev) => {
      const current = prev[matchId] || []
      // Under/Over: selezione singola (U o O), niente doppie
      if (match.betType === 'UNDER_OVER') {
        return { ...prev, [matchId]: current.includes(choice) ? [] : [choice] }
      }
      // 1X2: toggle normale (doppia/tripla)
      if (current.includes(choice)) {
        return { ...prev, [matchId]: current.filter((c) => c !== choice) }
      }
      return { ...prev, [matchId]: [...current, choice] }
    })
  }

  function handleSubmit() {
    setSubmitError('')
    const predList = matches?.map((m) => ({
      matchId: m.id,
      choices: predictions[m.id] || [],
    }))
    const missing = predList?.filter((p) => p.choices.length === 0)
    if (missing?.length > 0) {
      setSubmitError(
        `Devi selezionare almeno un esito per ogni partita (mancano ${missing.length} partite).`
      )
      return
    }
    const sidePredictions = Object.entries(sideChoices)
      .filter(([, v]) => v && v.length > 0)
      .map(([sid, v]) => ({ matchSidePredictionId: Number(sid), choice: String(v) }))
    submitMutation.mutate({
      contestId: Number(id),
      predictions: predList,
      sidePredictions: sidePredictions.length > 0 ? sidePredictions : undefined,
    })
  }

  if (matchesLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gds-gray hover:text-gds-dark text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Torna ai concorsi
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gds-pink-light rounded-lg">
          <Trophy size={22} className="text-gds-pink" />
        </div>
        <h1 className="text-2xl font-bold text-gds-dark">Compila la schedina</h1>
      </div>

      {/* Match list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-4 md:px-6 py-3 bg-gds-dark text-white text-sm font-semibold flex items-center justify-between">
          <span>Partita</span>
          <span>Esito</span>
        </div>

        {matches?.map((match, idx) => (
          <div
            key={match.id}
            className={`px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4
              ${idx % 2 === 0 ? '' : 'bg-gds-gray-light/50'} hover:bg-gds-pink-light transition-colors`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xs font-bold text-gds-gray w-6 shrink-0 pt-0.5">
                {match.matchNumber ?? idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gds-dark text-sm">
                  {match.homeTeamName} <span className="text-gds-gray font-normal">vs</span> {match.awayTeamName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {match.scheduledAt && (
                    <p className="text-xs text-gds-gray">
                      {new Date(match.scheduledAt).toLocaleString('it-IT', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                  {match.betType === 'UNDER_OVER' && (
                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                      U/O {match.overUnderLine}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex gap-1.5">
                {choicesFor(match).map((c) => (
                  <ChoiceButton
                    key={c}
                    choice={c}
                    selected={(predictions[match.id] || []).includes(c)}
                    onClick={(choice) => toggleChoice(match.id, choice, match)}
                  />
                ))}
              </div>
              <MatchSideBetsInline
                match={match}
                values={sideChoices}
                onChange={(sid, v) => setSideChoices((prev) => ({ ...prev, [sid]: v }))}
              />
            </div>
          </div>
        ))}
      </div>

      {submitError && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {submitError}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          loading={submitMutation.isPending}
          size="lg"
        >
          Invia schedina
        </Button>
      </div>
    </div>
  )
}
