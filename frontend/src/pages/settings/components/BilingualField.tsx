import type { BilingualText } from '@/types'

interface BilingualFieldProps {
  label: string
  value: BilingualText
  onChange: (next: BilingualText) => void
  placeholderEn?: string
  placeholderMs?: string
  multiline?: boolean
  rows?: number
  hint?: string
}

const INPUT_CLS =
  'w-full pl-12 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange'

/** One label, two inputs (EN + BM). The language tag sits inside the input on the left. */
export function BilingualField({
  label,
  value,
  onChange,
  placeholderEn,
  placeholderMs,
  multiline = false,
  rows = 3,
  hint,
}: BilingualFieldProps) {
  const renderInput = (lang: 'en' | 'ms', placeholder?: string) => {
    const tag = lang === 'en' ? 'EN' : 'BM'
    const common = {
      value: value[lang],
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...value, [lang]: e.target.value }),
    }
    return (
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 pointer-events-none select-none">
          {tag}
        </span>
        {multiline ? (
          <textarea {...common} rows={rows} className={`${INPUT_CLS} resize-y`} />
        ) : (
          <input type="text" {...common} className={INPUT_CLS} />
        )}
      </div>
    )
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </label>
      <div className="space-y-2">
        {renderInput('en', placeholderEn)}
        {renderInput('ms', placeholderMs)}
      </div>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}
