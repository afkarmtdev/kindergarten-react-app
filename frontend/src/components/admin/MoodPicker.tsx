import { Smile, Meh, Coffee, Frown } from 'lucide-react'
import type { DailyReport } from '../../types'

type Mood = DailyReport['mood']

interface Props {
  value: Mood
  onChange: (mood: Mood) => void
}

const OPTIONS: { value: NonNullable<Mood>; icon: typeof Smile; color: string; active: string }[] = [
  {
    value: 'happy',
    icon: Smile,
    color: 'text-green-500 border-green-200 dark:border-green-800',
    active: 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600',
  },
  {
    value: 'okay',
    icon: Meh,
    color: 'text-yellow-500 border-yellow-200 dark:border-yellow-800',
    active: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600',
  },
  {
    value: 'tired',
    icon: Coffee,
    color: 'text-orange-500 border-orange-200 dark:border-orange-800',
    active: 'bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-600',
  },
  {
    value: 'upset',
    icon: Frown,
    color: 'text-red-500 border-red-200 dark:border-red-800',
    active: 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600',
  },
]

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map(({ value: opt, icon: Icon, color, active }) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? null : opt)}
          className={`p-1.5 rounded-lg border transition-all ${
            value === opt ? active : `border-transparent hover:bg-gray-100 dark:hover:bg-gray-800`
          }`}
          title={opt}
        >
          <Icon
            className={`w-4 h-4 ${value === opt ? color.split(' ')[0] : 'text-gray-400 dark:text-gray-600'}`}
          />
        </button>
      ))}
    </div>
  )
}
