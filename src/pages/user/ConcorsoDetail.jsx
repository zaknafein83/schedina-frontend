import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { concorsoApi, schedinaApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function ConcorsoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [choices, setChoices] = useState({}) // { betId: choiceRef }
  const [error, setError] = useState('')

  const { data: concorso, isLoading } = useQuery({
    queryKey: ['concorso', id],
    queryFn: () => concorsoApi.get(id).then((r) => r.data),
  })
  const { data: bets } = useQuery({
    queryKey: ['concorso-scommesse', id],
    queryFn: () => concorsoApi.getScommesse(id).then((r) => r.data),
  })

  const submit = useMutation({
    mutationFn: async () => {
      const selezioni = Object.entries(choices).map(([betId, choiceRef]) => ({ betId: Number(betId), choiceRef }))
      const res = await schedinaApi.create({ concorsoId: Number(id), selezioni })
      await schedinaApi.confirm(res.data.id)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-schedine'] })
      navigate('/schedine')
    },
    onError: (e) => setError(e.response?.data?.error || 'Errore nell\'invio della schedina'),
  })

  function pick(betId, ref) {
    setChoices((prev) => ({ ...prev, [betId]: ref }))
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!concorso) return <div className="text-gds-gray">Concorso non trovato.</div>

  const isOpen = concorso.status === 'OPEN'
  const answered = Object.keys(choices).length
  const total = bets?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/concorsi" className="inline-flex items-center gap-1 text-sm text-gds-gray hover:text-gds-pink mb-4">
        <ArrowLeft size={16} /> Concorsi
      </Link>

      <h1 className="text-2xl font-bold text-gds-dark">{concorso.name}</h1>
      {concorso.description && <p className="text-gds-gray mt-1 mb-6">{concorso.description}</p>}

      {!isOpen && (
        <div className="bg-yellow-50 text-yellow-800 rounded-xl p-4 mb-6 text-sm">
          Questo concorso non è aperto alle giocate.
        </div>
      )}

      <div className="space-y-3">
        {bets?.map((bet) => (
          <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
            <p className="font-semibold text-gds-dark mb-2">{bet.label}</p>
            <div className="flex flex-wrap gap-2">
              {bet.options?.map((o) => {
                const selected = choices[bet.id] === o.ref
                return (
                  <button key={o.id} disabled={!isOpen} onClick={() => pick(bet.id, o.ref)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
                      selected
                        ? 'bg-gds-pink text-white border-gds-pink'
                        : 'bg-white text-gds-dark border-gray-200 hover:border-gds-pink'
                    }`}>
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 mt-4 text-sm">{error}</div>}

      {isOpen && (
        <div className="sticky bottom-0 mt-6 bg-white/90 backdrop-blur rounded-xl shadow-lg p-4 flex items-center justify-between">
          <span className="text-sm text-gds-gray">{answered}/{total} pronostici</span>
          <Button onClick={() => { setError(''); submit.mutate() }} loading={submit.isPending} disabled={answered === 0}>
            <Trophy size={16} /> Conferma schedina
          </Button>
        </div>
      )}
    </div>
  )
}
