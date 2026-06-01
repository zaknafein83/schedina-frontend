import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Combobox con barra di ricerca: input filtrabile + lista a discesa.
 * Props:
 *   items       — array di { id, label, meta? }
 *   value       — id selezionato (string)
 *   onChange    — (id: string) => void  ('' per deselezionare)
 *   placeholder — testo del campo di ricerca
 *   emptyText   — testo quando nessun risultato
 *   disabled
 */
export default function SearchSelect({
  items = [],
  value,
  onChange,
  placeholder = 'Cerca…',
  emptyText = 'Nessun risultato',
  disabled = false,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  const selected = items.find((it) => String(it.id) === String(value))
  const q = query.trim().toLowerCase()
  const filtered = q
    ? items.filter((it) => `${it.label} ${it.meta || ''}`.toLowerCase().includes(q))
    : items

  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function pick(it) { onChange(String(it.id)); setOpen(false); setQuery('') }

  return (
    <div className="relative max-w-md" ref={boxRef}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gds-gray pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          value={open ? query : (selected ? selected.label : '')}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gds-border bg-gds-surface pl-9 pr-8 py-2 text-sm text-gds-white outline-none focus:ring-2 focus:ring-gds-pink disabled:opacity-50"
        />
        {selected && !open && (
          <button
            type="button"
            onClick={() => { onChange(''); setQuery('') }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gds-gray hover:text-gds-white"
            aria-label="Deseleziona"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gds-border bg-gds-surface shadow-xl">
          {filtered.length === 0 && <p className="px-3 py-2 text-xs text-gds-gray">{emptyText}</p>}
          {filtered.map((it) => {
            const sel = String(it.id) === String(value)
            return (
              <button
                type="button"
                key={it.id}
                onClick={() => pick(it)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gds-pink-light ${sel ? 'text-gds-pink' : 'text-gds-white'}`}
              >
                <span className="truncate">{it.label}</span>
                {it.meta && <span className="text-xs text-gds-gray shrink-0">{it.meta}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
