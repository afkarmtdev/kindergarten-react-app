import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchBar({ value, onChange, placeholder = 'Search...', debounceMs = 350 }: SearchBarProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [local, debounceMs]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
        placeholder={placeholder}
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
