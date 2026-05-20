import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { seasonCouponApi } from '../../api/client'
import Spinner from '../../components/Spinner'
import { Trophy, ChevronRight } from 'lucide-react'

const STATUS_LABELS = {
  DRAFT: 'Bozza',
  CONFIRMED: 'Confermata',
  PROCESSED: 'In elaborazione',
  WINNING: 'Vincente',
  NOT_WINNING: 'Non vincente',
  CANCELLED: 'Annullata',
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSED: 'bg-yellow-100 text-yellow-800',
  WINNING: 'bg-green-100 text-green-800',
  NOT_WINNING: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
}

export default function MySeasonCoupons() {
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['my-season-coupons'],
    queryFn: () => seasonCouponApi.list().then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gds-dark mb-6">Le mie schedine stagionali</h1>

      {coupons?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <Trophy size={48} className="mx-auto text-gds-gray mb-4" />
          <p className="text-gds-gray">Non hai ancora compilato schedine stagionali.</p>
        </div>
      )}

      <div className="space-y-3">
        {coupons?.map((c) => (
          <Link
            key={c.id}
            to={`/my-season-coupons/${c.id}`}
            className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 hover:bg-gds-pink-light transition-colors"
          >
            <div>
              <div className="font-bold text-gds-dark">{c.poolName}</div>
              <div className="text-xs text-gds-gray mt-1">
                Creata il {new Date(c.createdAt).toLocaleDateString()}
                {c.correctCount != null && ` · ${c.correctCount} esatti`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                {STATUS_LABELS[c.status] || c.status}
              </span>
              <ChevronRight size={16} className="text-gds-gray" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
