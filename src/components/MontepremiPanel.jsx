import { Trophy } from 'lucide-react'
import { formatEuro } from '../utils/format'

/**
 * Mostra il montepremi (per gioco) e i premi per soglia, da una "projection".
 * projection: { managed, montepremi1x2, montepremiUo, schedineGiocate, prizes: [{threshold, amount1x2, amountUo, divided}] }
 */
export default function MontepremiPanel({ projection, title = 'Montepremi e premi' }) {
  if (!projection) return null
  const { managed, estimated, montepremi1x2, montepremiUo, schedineGiocate, prizes } = projection

  return (
    <div className="bg-gds-surface rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-gds-pink" />
        <h3 className="font-semibold text-gds-white">{title}</h3>
      </div>

      {managed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg border border-gds-pink/30 bg-gds-pink/10 px-3 py-2">
            <p className="text-xs text-gds-gray">Montepremi Totocalcio (1X2)</p>
            <p className="text-xl font-black text-gds-white">{formatEuro(montepremi1x2)}</p>
          </div>
          <div className="rounded-lg border border-gds-pink/30 bg-gds-pink/10 px-3 py-2">
            <p className="text-xs text-gds-gray">Montepremi Under/Over</p>
            <p className="text-xl font-black text-gds-white">{formatEuro(montepremiUo)}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[360px]">
        <thead><tr className="text-gds-gray">
          <th className="px-3 py-2 text-left font-medium">Soglia</th>
          <th className="px-3 py-2 text-left font-medium">Totocalcio (1X2)</th>
          <th className="px-3 py-2 text-left font-medium">Under/Over</th>
        </tr></thead>
        <tbody>
          {prizes?.length === 0 && (
            <tr><td colSpan={3} className="px-3 py-3 text-gds-gray text-center">Nessuna soglia (assegna una Regola).</td></tr>
          )}
          {prizes?.map((p) => (
            <tr key={p.threshold} className="border-t border-gds-border">
              <td className="px-3 py-2 font-semibold text-gds-white">{p.threshold}</td>
              <td className="px-3 py-2 text-gds-white">{formatEuro(p.amount1x2)}{p.divided && <span className="text-xs text-gds-gray"> · diviso</span>}</td>
              <td className="px-3 py-2 text-gds-white">{formatEuro(p.amountUo)}{p.divided && <span className="text-xs text-gds-gray"> · diviso</span>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>

      {managed && (
        <p className="text-xs text-gds-gray mt-2">
          {estimated
            ? <>Premi calcolati dal montepremi. I valori <strong>9</strong> e <strong>10</strong> sono <strong>stimati su {schedineGiocate} schedine</strong> (media dei concorsi precedenti) e cambieranno con le giocate. </>
            : <>Premi calcolati dal montepremi · {schedineGiocate} schedine giocate. </>}
          Le soglie 11/12/13 si dividono tra i vincitori; gli importi sono indicativi fino alla chiusura.
        </p>
      )}
    </div>
  )
}
