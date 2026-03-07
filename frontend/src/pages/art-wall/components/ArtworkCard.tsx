import { useState } from 'react'
import { Pencil, Trash2, ImageIcon } from 'lucide-react'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import { getRotation, getPushpinColor } from '../constants'
import type { ArtWallItem } from '@/types'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  item: ArtWallItem
  design?: 'polaroid' | 'default'
  size?: Size
  onEdit?: (item: ArtWallItem) => void
  onDelete?: (item: ArtWallItem) => void
}

const PIN: Record<Size, { head: string; highlight: string; needle: string; offset: string }> = {
  sm: {
    head: 'w-4 h-4',
    highlight: 'top-0.5 left-1 w-1 h-0.5',
    needle: 'w-0.5 h-1',
    offset: '-top-2',
  },
  md: {
    head: 'w-5 h-5',
    highlight: 'top-0.5 left-1.5 w-1.5 h-1',
    needle: 'w-0.5 h-1',
    offset: '-top-2.5',
  },
  lg: {
    head: 'w-6 h-6',
    highlight: 'top-1 left-1.5 w-2 h-1.5',
    needle: 'w-1 h-1.5',
    offset: '-top-3',
  },
}

const POLAROID: Record<
  Size,
  {
    frame: string
    captionPt: string
    captionPb: string
    captionMin: string
    captionFont: string
    nameFont: string
    dateFont: string
    actionIcon: number
    actionLabel: boolean
  }
> = {
  sm: {
    frame: '6px 6px 0',
    captionPt: '8px',
    captionPb: '8px',
    captionMin: '36px',
    captionFont: 'text-[9px]',
    nameFont: 'text-[8px]',
    dateFont: 'text-[8px]',
    actionIcon: 10,
    actionLabel: false,
  },
  md: {
    frame: '8px 8px 0',
    captionPt: '10px',
    captionPb: '10px',
    captionMin: '44px',
    captionFont: 'text-[10px]',
    nameFont: 'text-[9px]',
    dateFont: 'text-[8px]',
    actionIcon: 11,
    actionLabel: false,
  },
  lg: {
    frame: '10px 10px 0',
    captionPt: '10px',
    captionPb: '12px',
    captionMin: '52px',
    captionFont: 'text-[11px]',
    nameFont: 'text-[10px]',
    dateFont: 'text-[9px]',
    actionIcon: 11,
    actionLabel: true,
  },
}

export function ArtworkCard({ item, design = 'default', size = 'md', onEdit, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false)
  const rotation = item.tilt_angle ?? getRotation(item.id)
  const pinColor = getPushpinColor(item.id)
  const hasActions = !!(onEdit || onDelete)
  const pin = PIN[size]
  const pol = POLAROID[size]

  return (
    <>
      <div className="relative group" style={{ transform: `rotate(${rotation}deg)` }}>
        {/* Pushpin */}
        <div
          className={`absolute ${pin.offset} left-1/2 -translate-x-1/2 z-10 flex flex-col items-center`}
        >
          <div
            className={`${pin.head} rounded-full relative`}
            style={{
              background: `radial-gradient(circle at 35% 35%, ${pinColor.head}, ${pinColor.shadow})`,
              boxShadow: `0 2px 4px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.3)`,
            }}
          >
            <div className={`absolute ${pin.highlight} rounded-full bg-white/40 rotate-[-20deg]`} />
          </div>
          <div
            className={`${pin.needle} bg-gradient-to-b from-gray-400 to-transparent rounded-b-full -mt-0.5`}
          />
        </div>

        {design === 'polaroid' ? (
          /* Polaroid: white frame, square photo, cursive caption strip */
          <div
            className={`bg-white shadow-lg ${!item.is_visible ? 'opacity-50' : ''}`}
            style={{ padding: pol.frame }}
          >
            <div className="overflow-hidden aspect-square">
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.caption ?? 'Artwork'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon size={24} className="text-gray-300" />
                </div>
              )}
            </div>

            <div
              className="px-1.5 text-center"
              style={{
                paddingTop: pol.captionPt,
                paddingBottom: hasActions ? '4px' : pol.captionPb,
                minHeight: pol.captionMin,
              }}
            >
              {item.caption && (
                <p
                  className={`${pol.captionFont} text-gray-700 line-clamp-2 leading-snug`}
                  style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', cursive" }}
                >
                  {item.caption}
                </p>
              )}
              {item.student_name && (
                <p
                  className={`${pol.nameFont} text-gray-400 mt-0.5`}
                  style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', cursive" }}
                >
                  — {item.student_name}
                </p>
              )}
              {item.artwork_date && (
                <p className={`${pol.dateFont} text-gray-300 mt-0.5`}>
                  {new Date(item.artwork_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {hasActions && (
              <div className="flex justify-end gap-1 px-1.5 pb-1.5 border-t border-gray-100 pt-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-kinder-blue hover:bg-kinder-blue/10 transition-colors rounded opacity-50 group-hover:opacity-100"
                  >
                    <Pencil size={pol.actionIcon} />
                    {pol.actionLabel && 'Edit'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => setShowDelete(true)}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded opacity-50 group-hover:opacity-100"
                  >
                    <Trash2 size={pol.actionIcon} />
                    {pol.actionLabel && 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Default: rounded card, coloured badge, variable-height photo */
          <div
            className={`bg-amber-50 dark:bg-gray-900 rounded-2xl shadow-sm border border-amber-200/60 dark:border-gray-800 overflow-hidden pt-2 ${
              !item.is_visible ? 'opacity-50' : ''
            }`}
          >
            <div className="rounded-xl overflow-hidden mx-2 aspect-square">
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.caption ?? 'Artwork'}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-xl">
                  <ImageIcon size={32} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>

            <div className="p-2.5 space-y-1">
              {item.caption && (
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                  {item.caption}
                </p>
              )}
              {item.student_name && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-kinder-yellow/20 text-amber-700 dark:bg-kinder-yellow/10 dark:text-amber-300">
                  {item.student_name}
                </span>
              )}
              {item.artwork_date && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {new Date(item.artwork_date).toLocaleDateString()}
                </p>
              )}

              {hasActions && (
                <div className="flex gap-1 pt-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-kinder-blue hover:bg-kinder-blue/10 dark:hover:text-kinder-blue dark:hover:bg-kinder-blue/10 transition-colors rounded-lg"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => setShowDelete(true)}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {onDelete && (
        <DeleteDialog
          show={showDelete}
          itemName={item.caption || undefined}
          onConfirm={() => {
            setShowDelete(false)
            onDelete(item)
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
