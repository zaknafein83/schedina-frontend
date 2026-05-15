import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/AuthContext'
import { BookOpen, User, Shield, Crown } from 'lucide-react'

import userMd from '../manual/user.md?raw'
import modMd from '../manual/mod.md?raw'
import adminMd from '../manual/admin.md?raw'

const TABS = [
  { key: 'user',  label: 'Utente',         icon: User,   md: userMd  },
  { key: 'mod',   label: 'Moderatore',     icon: Shield, md: modMd   },
  { key: 'admin', label: 'Amministratore', icon: Crown,  md: adminMd },
]

const mdComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-black text-gds-dark mt-2 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-gds-dark mt-8 mb-3 pb-2 border-b border-gds-gray-light">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-gds-dark mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-gds-dark leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1 text-gds-dark">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 text-gds-dark">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gds-dark">{children}</strong>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <pre className="bg-gds-dark text-gray-100 rounded-lg p-4 overflow-x-auto text-sm mb-4">
          <code>{children}</code>
        </pre>
      )
    }
    return (
      <code className="bg-gds-gray-light text-gds-pink px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gds-pink bg-gds-pink-light/30 pl-4 py-2 my-4 italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-gds-pink hover:underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <figure className="my-6">
      <img
        src={src}
        alt={alt}
        className="rounded-lg border border-gds-gray-light shadow-sm max-w-full"
        loading="lazy"
      />
      {alt && (
        <figcaption className="text-center text-xs text-gds-gray mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-gds-gray-light text-left px-3 py-2 font-semibold border border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-gray-200 align-top">{children}</td>
  ),
}

export default function Manual() {
  const { user } = useAuth()
  const defaultTab =
    user?.role === 'ADMIN' ? 'admin' : user?.role === 'MOD' ? 'mod' : 'user'
  const [tab, setTab] = useState(defaultTab)
  const current = TABS.find((t) => t.key === tab)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="text-gds-pink" size={28} />
        <h1 className="text-3xl font-black text-gds-dark">Guida</h1>
      </div>

      <p className="text-gds-gray mb-6">
        Manuale operativo dell'app Schedina. Seleziona la sezione corrispondente al
        tuo ruolo. Tutte le sezioni sono consultabili da qualunque utente loggato.
      </p>

      <div className="flex gap-1 mb-6 border-b border-gds-gray-light overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-gds-pink text-gds-pink'
                  : 'border-transparent text-gds-gray hover:text-gds-dark'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </div>

      <article className="bg-white rounded-xl shadow-sm border border-gds-gray-light p-6 sm:p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {current.md}
        </ReactMarkdown>
      </article>
    </div>
  )
}
