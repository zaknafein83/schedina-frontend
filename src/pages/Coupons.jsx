import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { couponApi, adminApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import Badge from '../components/ui/Badge'
import {
  FileText, ChevronDown, ChevronRight, Search,
} from 'lucide-react'

const COUPON_STATUS = {
  DRAFT:          { label: 'Bozza',           color: 'gray' },
  CONFIRMED:      { label: 'Confermata',      color: 'blue' },
  PENDING_RESULT: { label: 'In attesa esito', color: 'yellow' },
  PROCESSED:      { label: 'Elaborata',       color: 'blue' },
  WINNING:        { label: 'Vincente',        color: 'green' },
  NOT_WINNING:    { label: 'Non vincente',    color: 'red' },
  CANCELLED:      { label: 'Annullata',       color: 'gray' },
}

const CONTEST_STATUS = {
  DRAFT:      { label: 'Bozza',          color: 'gray' },
  SCHEDULED:  { label: 'Programmato',    color: 'gray' },
  OPEN:       { label: 'Aperto',         color: 'green' },
  CLOSED:     { label: 'Chiuso',         color: 'yellow' },
  PROCESSING: { label: 'In elaborazione', color: 'blue' },
  PROCESSED:  { label: 'Elaborato',      color: 'dark' },
  CANCELLED:  { label: 'Annullato',      color: 'gray' },
}

function CouponDetail({ couponId, isAdmin }) {
  const { data, isLoading } = useQuery({
    queryKey: ['coupon-detail', isAdmin ? 'admin' : 'user', couponId],
    queryFn: () => (isAdmin ? adminApi.getCoupon(couponId) : couponApi.get(couponId))
      .then((r) => r.data),
    staleTime: 30_000,
  })

  if (isLoading) {
    return <div className="flex justify-center py-3"><Spinner /></div>
  }
  if (!data?.predictions?.length) {
    return <p className="text-xs text-gds-gray py-2">Nessuna predizione.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {data.predictions.map((p) => {
        const hasResult = p.officialResult != null
        return (
          <div
            key={p.matchId}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border
              ${p.isCorrect === true  ? 'bg-green-50 border-green-200' :
                p.isCorrect === false ? 'bg-red-50   border-red-200'   :
                                         'bg-white   border-gray-100'}`}
          >
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-gds-dark font-medium truncate">
                {p.homeTeamName} vs {p.awayTeamName}
              </p>
              {hasResult && (
                <p className="text-xs text-gds-gray mt-0.5 font-mono">
                  {p.homeScore}–{p.awayScore}
                  <span className="ml-1 font-bold">({p.officialResult})</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {p.choices.map((c) => (
                <span key={c} className="bg-gds-pink text-white text-xs font-bold rounded px-1.5 py-0.5">
                  {c}
                </span>
              ))}
              {p.isCorrect === true  && <span className="text-green-600 ml-1">✓</span>}
              {p.isCorrect === false && <span className="text-red-500 ml-1">✗</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CouponRow({ coupon, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const status = COUPON_STATUS[coupon.status] || { label: coupon.status, color: 'gray' }

  return (
    <div className="border-t border-gray-100">
      <div
        className="flex items-center gap-3 px-6 py-3 hover:bg-gds-pink-light cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded
          ? <ChevronDown size={14} className="text-gds-gray shrink-0" />
          : <ChevronRight size={14} className="text-gds-gray shrink-0" />}

        <span className="text-xs font-mono text-gds-gray w-12 shrink-0">
          #{coupon.id}
        </span>

        {isAdmin && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gds-dark truncate">{coupon.userName}</p>
            <p className="text-xs text-gds-gray truncate">{coupon.userEmail}</p>
          </div>
        )}
        {!isAdmin && <div className="flex-1" />}

        <Badge color={status.color}>{status.label}</Badge>

        {coupon.correctCount != null && (
          <span className="text-xs text-gds-gray w-20 text-right">
            {coupon.correctCount} corretti
          </span>
        )}

        <span className="text-xs text-gds-gray w-28 text-right hidden sm:inline">
          {new Date(coupon.createdAt).toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>

      {expanded && (
        <div className="px-6 pb-4 bg-gds-pink-light/30">
          <CouponDetail couponId={coupon.id} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  )
}

function ContestSection({ entry, isAdmin, userFilter, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const cs = CONTEST_STATUS[entry.contestStatus] || { label: entry.contestStatus, color: 'gray' }

  const filteredCoupons = useMemo(() => {
    if (!isAdmin || !userFilter) return entry.coupons
    const needle = userFilter.toLowerCase()
    return entry.coupons.filter((c) =>
      (c.userName  || '').toLowerCase().includes(needle) ||
      (c.userEmail || '').toLowerCase().includes(needle)
    )
  }, [entry.coupons, isAdmin, userFilter])

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 bg-gds-dark text-white text-left hover:bg-gds-dark/90 transition-colors"
      >
        {open
          ? <ChevronDown size={18} />
          : <ChevronRight size={18} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{entry.contestName}</p>
        </div>
        <Badge color={cs.color}>{cs.label}</Badge>
        <span className="text-xs text-gray-300">
          {isAdmin && userFilter
            ? `${filteredCoupons.length} di ${entry.couponCount}`
            : `${entry.couponCount} ${entry.couponCount === 1 ? 'schedina' : 'schedine'}`}
        </span>
      </button>

      {open && (
        <div>
          {filteredCoupons.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gds-gray text-center">
              Nessuna schedina che corrisponda al filtro.
            </p>
          ) : (
            filteredCoupons.map((c) => (
              <CouponRow key={c.id} coupon={c} isAdmin={isAdmin} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Coupons() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MOD'
  const [userFilter, setUserFilter] = useState('')

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ['coupons-by-contest', isAdmin ? 'admin' : 'user'],
    queryFn: () => (isAdmin ? adminApi.getCouponsByContest() : couponApi.listByContest())
      .then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }
  if (isError) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-6 text-center">
        Errore nel caricamento delle schedine.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gds-dark">Schedine</h1>
        {isAdmin && groups?.length > 0 && (
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gds-gray" />
            <input
              type="text"
              placeholder="Filtra per nome o email"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white
                outline-none focus:ring-2 focus:ring-gds-pink focus:border-gds-pink"
            />
          </div>
        )}
      </div>

      {!groups || groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gds-gray">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Nessuna schedina ancora.</p>
          <p className="text-sm mt-1">
            {isAdmin
              ? 'Nessun utente ha ancora giocato una schedina.'
              : 'Partecipa a un concorso per iniziare!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g, idx) => (
            <ContestSection
              key={g.contestId}
              entry={g}
              isAdmin={isAdmin}
              userFilter={userFilter}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
