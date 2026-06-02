/** Formatta un importo in euro, es. 500000 -> "€ 500.000". */
export function formatEuro(amount) {
  const n = Number(amount) || 0
  return '€ ' + new Intl.NumberFormat('it-IT').format(n)
}
