import { Check, X } from 'lucide-react'

/** Pillola di un pronostico (1X2 o U/O) con stato di correttezza ed esito ufficiale. */
function Pick({ label, choice, correct, result }) {
  const color = correct === true ? 'text-green-700 bg-green-50 border-green-200'
    : correct === false ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-gds-white bg-gds-surface border-gds-border'
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${color}`}>
      <span className="text-gds-gray">{label}</span>
      <strong>{choice}</strong>
      {correct === true && <Check size={13} className="text-green-600" />}
      {correct === false && <X size={13} className="text-red-500" />}
      {result != null && correct === false && <span className="text-gds-gray">→ {result}</span>}
    </div>
  )
}

/** Lista delle selezioni di una schedina: per ogni partita 1X2 + Under/Over. */
export default function SchedinaSelezioni({ selezioni }) {
  if (!selezioni?.length) return <p className="text-sm text-gds-gray">Nessuna selezione.</p>
  return (
    <ul className="space-y-2">
      {selezioni.map((sel, i) => (
        <li key={i} className="border border-gds-border rounded-lg px-3 py-2">
          <p className="text-sm font-medium text-gds-white mb-1.5">{sel.home} – {sel.away}</p>
          <div className="flex flex-wrap gap-1.5">
            <Pick label="1X2" choice={sel.choice1x2} correct={sel.correct1x2} result={sel.result1x2} />
            <Pick label={`U/O ${sel.overUnderLine ?? ''}`.trim()} choice={sel.choiceUo} correct={sel.correctUo} result={sel.resultUO} />
          </div>
        </li>
      ))}
    </ul>
  )
}
