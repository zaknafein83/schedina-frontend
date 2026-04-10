import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contestApi, couponApi, adminApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import { ArrowLeft, Trophy } from 'lucide-react'

const CHOICES = ['1', 'X', '2']

function ChoiceButton({ choice, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(choice)}
      className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors border-2
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

export default function ContestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [predictions, setPredictions] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [ruleId, setRuleId] = useState('')

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['contest-matches', id],
    queryFn: () => contestApi.getMatches(id).then((r) => r.data),
  })

  // Fetch rules from admin endpoint since there is no user-facing rules list
  const { data: rules } = useQuery({
    queryKey: ['rules'],
    queryFn: () => adminApi.getRules().then((r) => r.data),
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

  function toggleChoice(matchId, choice) {
    setPredictions((prev) => {
      const current = prev[matchId] || []
      if (current.includes(choice)) {
        return { ...prev, [matchId]: current.filter((c) => c !== choice) }
      }
      return { ...prev, [matchId]: [...current, choice] }
    })
  }

  function handleSubmit() {
    setSubmitError('')
    if (!ruleId) {
      setSubmitError('Seleziona una regola di gioco.')
      return
    }
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
    submitMutation.mutate({
      contestId: Number(id),
      ruleId: Number(ruleId),
      predictions: predList,
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

      {/* Rule selector */}
      {rules && rules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <label className="text-sm font-medium text-gds-dark block mb-2">
            Regola di gioco
          </label>
          <select
            value={ruleId}
            onChange={(e) => setRuleId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gds-dark
              bg-white outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
          >
            <option value="">-- Seleziona una regola --</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Match list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-3 bg-gds-dark text-white text-sm font-semibold grid grid-cols-[2rem_1fr_auto] gap-4 items-center">
          <span>#</span>
          <span>Partita</span>
          <span>Esito</span>
        </div>

        {matches?.map((match, idx) => (
          <div
            key={match.id}
            className={`px-6 py-4 grid grid-cols-[2rem_1fr_auto] gap-4 items-center
              ${idx % 2 === 0 ? '' : 'bg-gds-gray-light/50'} hover:bg-gds-pink-light transition-colors`}
          >
            <span className="text-xs font-bold text-gds-gray">{match.matchNumber ?? idx + 1}</span>
            <div>
              <p className="font-semibold text-gds-dark text-sm">
                {match.homeTeamName} <span className="text-gds-gray font-normal">vs</span> {match.awayTeamName}
              </p>
              {match.scheduledAt && (
                <p className="text-xs text-gds-gray mt-0.5">
                  {new Date(match.scheduledAt).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              {CHOICES.map((c) => (
                <ChoiceButton
                  key={c}
                  choice={c}
                  selected={(predictions[match.id] || []).includes(c)}
                  onClick={(choice) => toggleChoice(match.id, choice)}
                />
              ))}
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
