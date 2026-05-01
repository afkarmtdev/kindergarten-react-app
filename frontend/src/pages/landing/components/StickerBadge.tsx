import type { ReactNode } from 'react'

export function StickerBadge({
  children,
  color = 'bg-kinder-yellow',
  textColor = 'text-gray-900',
  rotate = -8,
  className = '',
}: {
  children: ReactNode
  color?: string
  textColor?: string
  rotate?: number
  className?: string
}) {
  return (
    <span
      className={`inline-block ${color} ${textColor} font-fun font-bold text-xs uppercase tracking-wide px-3 py-1 rounded-full shadow-md border-2 border-white dark:border-gray-900 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  )
}
