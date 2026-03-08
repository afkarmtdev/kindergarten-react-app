import { PIN, POLAROID } from './ArtworkCard'
import type { Size } from './ArtworkCard'
import { PUSHPIN_COLORS } from '../constants'

interface Props {
  design?: 'polaroid' | 'default'
  size?: Size
  index?: number
}

export function ArtworkCardSkeleton({ design = 'default', size = 'md', index = 0 }: Props) {
  const pin = PIN[size]
  const pol = POLAROID[size]
  const pinColor = PUSHPIN_COLORS[index % PUSHPIN_COLORS.length]

  return (
    <div className="relative">
      {/* Pin — fully rendered, not part of the pulse */}
      <div
        className={`absolute ${pin.offset} left-1/2 -translate-x-1/2 z-10 flex flex-col items-center`}
      >
        <div
          className={`${pin.head} rounded-full relative`}
          style={{
            background: `radial-gradient(circle at 35% 35%, ${pinColor.head}, ${pinColor.shadow})`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.3)`,
          }}
        />
        <div
          className={`${pin.needle} bg-gradient-to-b from-gray-400 to-transparent rounded-b-full -mt-0.5`}
        />
      </div>

      {design === 'polaroid' ? (
        <div
          className="animate-pulse bg-white dark:bg-gray-800 shadow-lg"
          style={{ padding: pol.frame }}
        >
          <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
          <div
            className="px-1.5 flex flex-col items-center gap-1.5"
            style={{
              paddingTop: pol.captionPt,
              paddingBottom: pol.captionPb,
              minHeight: pol.captionMin,
            }}
          >
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ) : (
        <div className="animate-pulse bg-amber-50 dark:bg-gray-900 rounded-2xl border border-amber-200/60 dark:border-gray-800 overflow-hidden pt-2">
          <div className="rounded-xl bg-gray-200 dark:bg-gray-700 mx-2 aspect-square" />
          <div className="p-2.5 space-y-1.5">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      )}
    </div>
  )
}
