import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scommessaApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import Badge from '../../components/ui/Badge'
import { Coins, Check, X } from 'lucide-react'

const SCOPE_LABEL = { SEASON: 'Fine stagione', GIORNATA: 'Di giornata' }
const ST_COLOR = { OPEN: 'yellow', RESOLVED: 'green', VOID: 'gray' }

export default function Scommesse() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: bets, isLoading } = useQuery({
    queryKey: ['scommesse-open'],
    queryFn: () => scommessaApi.listOpen().then((r) => r.data),
  })
  const { data: mine } = useQuery({
    queryKey: ['scommesse-mine'],
    queryFn: () => scommessaApi.listMine().then((r) => r.data),
  })

  const myChoice = (scommessaId) => mine?.find((g) => g.scommessaId === scommessaId)?.choiceRef

  const place = useMutation({
    mutationFn: ({ scommessaId, choiceRef }) => scommessaApi.place(scommessaId, choiceRef),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scommesse-mine'] })
      setError('')
    },
    onError: (e) => setError(e.response?.data?.error || 'Errore nel piazzare la giocata'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Scommesse</h1>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <h2 className="text-lg font-bold text-gds-dark mb-3">Aperte</h2>
      {bets?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray mb-8">
          <Coins size={40} className="mx-auto mb-3 text-gray-300" />
          Nessuna scommessa aperta al momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {bets?.map((bet) => {
            const chosen = myChoice(bet.id)
            return (
              <div key={bet.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gds-dark">{bet.label}</p>
                  <span className="text-xs text-gds-gray bg-gds-gray-light px-2 py-0.5 rounded-full whitespace-nowrap">{SCOPE_LABEL[bet.scope] ?? bet.scope}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bet.options?.map((o) => {
                    const selected = chosen === o.ref
                    return (
                      <button key={o.id} onClick={() => place.mutate({ scommessaId: bet.id, choiceRef: o.ref })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          selected ? 'bg-gds-pink text-white border-gds-pink' : 'bg-white text-gds-dark border-gray-200 hover:border-gds-pink'
                        }`}>
                        {o.label}
                      </button>
                    )
                  })}
                </div>
                {chosen && <p className="text-xs text-green-700 mt-2 inline-flex items-center gap-1"><Check size={13} /> La tua giocata è registrata</p>}
              </div>
            )
          })}
        </div>
      )}

      <h2 className="text-lg font-bold text-gds-dark mb-3">Le mie giocate</h2>
      {mine?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gds-gray">Non hai ancora giocate.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mine?.map((g) => (
            <div key={g.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gds-dark">{g.scommessaLabel}</span>
                <Badge color={ST_COLOR[g.scommessaStatus] ?? 'gray'}>{g.scommessaStatus}</Badge>
              </div>
              <p className="text-sm text-gds-gray">
                Scelta: <strong className="text-gds-dark">{g.choiceLabel}</strong>
                {g.isCorrect === true && <Check size={15} className="inline ml-1 text-green-600" />}
                {g.isCorrect === false && <X size={15} className="inline ml-1 text-red-500" />}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
