import { useRef, useState } from 'react'
import { Download, Upload, Loader2, FileText } from 'lucide-react'

/**
 * Barra export/import riutilizzabile.
 * Props:
 *   exportFn    — funzione async che chiama l'API e ritorna { data: [...] }
 *   importFn    — funzione async che riceve il testo del file
 *   filename    — nome del file esportato (es. "leghe.json")
 *   onImported  — callback chiamata dopo import riuscito
 *   templateUrl — (opzionale) URL del template CSV da scaricare
 */
export default function ImportExport({ exportFn, importFn, filename, onImported, templateUrl }) {
  const fileRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok'|'err', text }

  async function handleExport() {
    setExporting(true)
    setMessage(null)
    try {
      const res = await exportFn()
      const json = JSON.stringify(res.data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMessage({ type: 'ok', text: `Esportati ${res.data.length} record` })
    } catch {
      setMessage({ type: 'err', text: 'Errore durante l\'esportazione' })
    } finally {
      setExporting(false)
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setMessage(null)
    try {
      const text = await file.text()
      const res  = await importFn(text)
      setMessage({ type: 'ok', text: `Importati ${res.data.imported} record` })
      onImported?.()
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Errore durante l\'importazione'
      setMessage({ type: 'err', text: msg })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs px-2 py-1 rounded-lg ${
          message.type === 'ok'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-600'
        }`}>
          {message.text}
        </span>
      )}

      {templateUrl && (
        <a
          href={templateUrl}
          download
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-dashed border-gray-300
            hover:bg-gray-50 text-gds-gray hover:text-gds-dark transition-colors"
          title="Scarica template CSV"
        >
          <FileText size={14} />
          Template
        </a>
      )}

      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200
          hover:bg-gray-50 text-gds-gray hover:text-gds-dark transition-colors disabled:opacity-50"
        title="Esporta JSON"
      >
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Esporta
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200
          hover:bg-gray-50 text-gds-gray hover:text-gds-dark transition-colors disabled:opacity-50"
        title="Importa JSON o CSV"
      >
        {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Importa
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
