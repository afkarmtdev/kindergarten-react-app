import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { documentNumberingApi } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useT } from '@/hooks/useT'
import type { DocumentSegment } from '@/types'

type SegmentType = 'constant' | 'year' | 'month' | 'serial'

interface LocalSegment extends DocumentSegment {
  _id: string // local React key
}

let _uid = 0
const uid = () => `seg-${++_uid}`

function buildPreview(segments: LocalSegment[]): string {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return [...segments]
    .sort((a, b) => a.order - b.order)
    .map((seg) => {
      if (seg.type === 'constant') return seg.value ?? ''
      if (seg.type === 'year') return year
      if (seg.type === 'month') return month
      if (seg.type === 'serial') return '1'.padStart(seg.total_chars ?? 4, '0')
      return ''
    })
    .join('')
}

export function SettingsPage() {
  usePageTitle('Settings')
  const t = useT()
  const queryClient = useQueryClient()

  const [segments, setSegments] = useState<LocalSegment[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['document-numbering', 'receipt'],
    queryFn: () => documentNumberingApi.get('receipt'),
  })

  // Populate local state when data loads
  useEffect(() => {
    if (data?.data) {
      const loaded: LocalSegment[] = (data.data.segments ?? []).map((s) => ({
        ...s,
        _id: uid(),
      }))
      setSegments(loaded.length > 0 ? loaded : defaultSegments())
      setIsDirty(false)
    } else if (data && !data.data) {
      // No config yet — show a sensible default
      setSegments(defaultSegments())
      setIsDirty(false)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (segs: DocumentSegment[]) =>
      documentNumberingApi.update('receipt', { segments: segs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-numbering'] })
      toast.success(t('formatSaved'))
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to save format. Please try again.'),
  })

  const doSave = () => {
    const clean: DocumentSegment[] = segments.map(({ _id, ...s }, i) => ({
      ...s,
      order: i + 1,
    }))
    mutation.mutate(clean)
  }

  const handleSave = () => {
    if (data?.data && data.data.current_serial > 0) {
      setShowConfirm(true)
      return
    }
    doSave()
  }

  const update = useCallback((id: string, patch: Partial<LocalSegment>) => {
    setSegments((prev) => prev.map((s) => (s._id === id ? { ...s, ...patch } : s)))
    setIsDirty(true)
  }, [])

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      { _id: uid(), order: prev.length + 1, type: 'constant', value: '' },
    ])
    setIsDirty(true)
  }

  const removeSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s._id !== id))
    setIsDirty(true)
  }

  const preview = buildPreview(segments)
  const lastIsSerial = segments.length > 0 && segments[segments.length - 1].type === 'serial'

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8">
        {t('settingsPage')}
      </h1>

      {/* Document Numbering Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        {/* Clickable header */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors rounded-t-2xl"
        >
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('documentNumbering')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('documentNumberingDesc')}
            </p>
          </div>
          {isOpen ? (
            <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="p-6 space-y-6 border-t border-gray-100 dark:border-gray-800">
            {/* Live preview */}
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl px-4 py-3 border border-orange-100 dark:border-orange-900/40">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
                {t('formatPreview')}
              </p>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider">
                {preview || <span className="text-gray-400 text-base">—</span>}
              </p>
            </div>

            {/* Segment rows */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {segments.map((seg, idx) => (
                  <SegmentRow
                    key={seg._id}
                    seg={seg}
                    index={idx}
                    total={segments.length}
                    onUpdate={(patch) => update(seg._id, patch)}
                    onRemove={() => removeSegment(seg._id)}
                  />
                ))}
              </div>
            )}

            {/* Add segment — disabled when last segment is serial */}
            <div>
              <button
                onClick={addSegment}
                disabled={lastIsSerial}
                className="flex items-center gap-2 text-sm font-semibold text-kinder-orange hover:text-orange-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Plus size={16} />
                {t('addSegment')}
              </button>
              {lastIsSerial && (
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {t('serialMustBeLast')}
                </p>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleSave}
                disabled={!isDirty || mutation.isPending}
                className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-orange-600 transition-colors"
              >
                {mutation.isPending ? t('saving2') : t('saveFormat')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm format change dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('confirmFormatChange')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t('confirmFormatChangeBody')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  doSave()
                }}
                className="flex-1 bg-kinder-orange text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                {t('confirmFormatChangeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Segment row component ─────────────────────────────────────────────────────
function SegmentRow({
  seg,
  index,
  total,
  onUpdate,
  onRemove,
}: {
  seg: LocalSegment
  index: number
  total: number
  onUpdate: (patch: Partial<LocalSegment>) => void
  onRemove: () => void
}) {
  const t = useT()

  const typeOptions: { value: SegmentType; label: string }[] = [
    { value: 'constant', label: t('segmentConstant') },
    { value: 'year', label: t('segmentYear') },
    { value: 'month', label: t('segmentMonth') },
    { value: 'serial', label: t('segmentSerial') },
  ]

  const resetOptions = [
    { value: 'no_reset', label: t('resetNoReset') },
    { value: 'monthly', label: t('resetMonthly') },
    { value: 'yearly', label: t('resetYearly') },
  ]

  const inputCls =
    'w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange'

  return (
    <div className="flex items-start gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
      {/* Drag handle (visual only) */}
      <div className="mt-2 text-gray-300 dark:text-gray-600 cursor-grab">
        <GripVertical size={16} />
      </div>

      {/* Row number */}
      <span className="mt-2 text-xs font-bold text-gray-400 dark:text-gray-500 w-4 flex-shrink-0">
        {index + 1}
      </span>

      {/* Type dropdown */}
      <div className="flex-shrink-0 w-36">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
          {t('segmentType')}
        </p>
        <select
          value={seg.type}
          onChange={(e) =>
            onUpdate({
              type: e.target.value as SegmentType,
              value: '',
              total_chars: 4,
              reset_by: 'no_reset',
              start_from: 1,
            })
          }
          className={inputCls}
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic fields */}
      <div className="flex gap-2 flex-1 flex-wrap">
        {seg.type === 'constant' && (
          <div className="flex-1 min-w-24">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {t('segmentValue')}
            </p>
            <input
              type="text"
              value={seg.value ?? ''}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder='e.g. "RCP-"'
              className={inputCls}
            />
          </div>
        )}

        {(seg.type === 'year' || seg.type === 'month') && (
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              &nbsp;
            </p>
            <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
              {t('autoIndicator')} (
              {seg.type === 'year'
                ? new Date().getFullYear()
                : (new Date().getMonth() + 1).toString().padStart(2, '0')}
              )
            </div>
          </div>
        )}

        {seg.type === 'serial' && (
          <>
            <div className="w-20">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {t('segmentTotalChars')}
              </p>
              <input
                type="number"
                min={1}
                max={20}
                value={seg.total_chars ?? 4}
                onChange={(e) => onUpdate({ total_chars: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
            <div className="w-36">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {t('segmentResetBy')}
              </p>
              <select
                value={seg.reset_by ?? 'no_reset'}
                onChange={(e) => onUpdate({ reset_by: e.target.value as LocalSegment['reset_by'] })}
                className={inputCls}
              >
                {resetOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {t('segmentStartFrom')}
              </p>
              <input
                type="number"
                min={1}
                value={seg.start_from ?? 1}
                onChange={(e) => onUpdate({ start_from: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
          </>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={total <= 1}
        className="mt-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function defaultSegments(): LocalSegment[] {
  return [
    { _id: uid(), order: 1, type: 'constant', value: 'RCP-' },
    { _id: uid(), order: 2, type: 'year' },
    { _id: uid(), order: 3, type: 'month' },
    { _id: uid(), order: 4, type: 'serial', total_chars: 4, reset_by: 'monthly', start_from: 1 },
  ]
}
