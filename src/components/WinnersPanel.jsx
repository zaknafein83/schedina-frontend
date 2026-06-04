import { Trophy } from 'lucide-react'
import { formatEuro } from '../utils/format'

/**
 * Pannello dei vincitori di una modalità (Totocalcio 1X2 o Under/Over).
 * winners: [{ id, name, count, prize }]
 */
export default function WinnersPanel({ title, winners }) {
  return (
    <div className="bg-gds-surface rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-gds-pink" />
        <h3 className="font-semibold text-gds-white">{title}</h3>
        <span className="text-xs text-gds-gray">({winners.length})</span>
      </div>
      {winners.length === 0 ? (
        <p className="text-sm text-gds-gray">Nessun vincitore.</p>
      ) : (
        <ul className="space-y-1.5">
          {winners.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gds-white truncate">{w.name} <span className="text-gds-gray">· {w.count} esatti</span></span>
              <span className="font-semibold text-gds-pink shrink-0">{formatEuro(w.prize)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Costruisce le due liste vincitori (1X2 / U/O) da un elenco di schedine. */
export function winnersFromSchedine(schedine) {
  const name = (s) => {
    const full = [s.userFirstName, s.userLastName].filter(Boolean).join(' ').trim()
    const uname = s.userUsername || s.userEmail
    if (full && uname) return `${full} (${uname})`
    return full || uname || `utente ${s.userId}`
  }
  const totocalcio = (schedine || []).filter((s) => s.isWinner1x2)
    .map((s) => ({ id: s.id, name: name(s), count: s.correct1x2Count, prize: s.prize1x2 }))
  const underOver = (schedine || []).filter((s) => s.isWinnerUo)
    .map((s) => ({ id: s.id, name: name(s), count: s.correctUoCount, prize: s.prizeUo }))
  return { totocalcio, underOver }
}
