import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { schoolInfoApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import type { DayKey, OperatingHours } from '@/types'

const DAY_KEYS: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: '', close: '' },
  tuesday: { open: '', close: '' },
  wednesday: { open: '', close: '' },
  thursday: { open: '', close: '' },
  friday: { open: '', close: '' },
  saturday: { open: '', close: '' },
  sunday: { open: '', close: '' },
}

export function SchoolInfoSection() {
  const t = useT()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    school_name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: null as string | null,
    whatsapp_number: '',
    operating_hours: DEFAULT_HOURS as OperatingHours,
    google_maps_embed_url: '',
    facebook_url: '',
    instagram_url: '',
  })
  const [isDirty, setIsDirty] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['school-info'],
    queryFn: () => schoolInfoApi.get(),
  })

  useEffect(() => {
    if (data?.data) {
      const {
        school_name,
        address,
        phone,
        email,
        logo_url,
        whatsapp_number,
        operating_hours,
        google_maps_embed_url,
        facebook_url,
        instagram_url,
      } = data.data
      setForm({
        school_name,
        address,
        phone,
        email,
        logo_url,
        whatsapp_number: whatsapp_number ?? '',
        operating_hours: operating_hours ?? DEFAULT_HOURS,
        google_maps_embed_url: google_maps_embed_url ?? '',
        facebook_url: facebook_url ?? '',
        instagram_url: instagram_url ?? '',
      })
      setIsDirty(false)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: () => schoolInfoApi.update(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-info'] })
      toast.success(t('settingsSchoolInfoSaved'))
      setIsDirty(false)
    },
    onError: () => toast.error('Failed to save school info. Please try again.'),
  })

  const set = (field: Exclude<keyof typeof form, 'operating_hours'>, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await compressImage(file, 400, 0.9)
      const path = `logo-${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('school-logo')
        .upload(path, compressed, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('school-logo').getPublicUrl(path)
      set('logo_url', urlData.publicUrl)
    } catch {
      toast.error('Logo upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange'
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {t('settingsSchoolInfo')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('settingsSchoolInfoDesc')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Logo upload */}
          <div>
            <p className={labelCls}>{t('settingsLogo')}</p>
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-36 h-36 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 hover:border-kinder-orange hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 overflow-hidden group"
              >
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="School logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <>
                    <Upload
                      size={22}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-kinder-orange transition-colors"
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-kinder-orange transition-colors font-medium">
                      {uploading ? t('uploading') : t('settingsLogoUpload')}
                    </span>
                  </>
                )}
              </button>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-kinder-orange transition-colors disabled:opacity-50"
                >
                  <Upload size={12} />
                  {uploading ? t('uploading') : t('settingsLogoChange')}
                </button>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, SVG — max 2 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* School Name */}
          <div>
            <label className={labelCls}>{t('settingsSchoolName')}</label>
            <input
              type="text"
              value={form.school_name}
              onChange={(e) => set('school_name', e.target.value)}
              placeholder={t('settingsSchoolNamePlaceholder')}
              className={inputCls}
            />
          </div>

          {/* Address */}
          <div>
            <label className={labelCls}>{t('settingsAddress')}</label>
            <textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder={t('settingsAddressPlaceholder')}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Phone + Email */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className={labelCls}>{t('settingsPhone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder={t('settingsPhonePlaceholder')}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>{t('settingsEmail')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder={t('settingsEmailPlaceholder')}
                className={inputCls}
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className={labelCls}>{t('settingsWhatsapp')}</label>
            <input
              type="text"
              value={form.whatsapp_number}
              onChange={(e) => set('whatsapp_number', e.target.value)}
              placeholder={t('settingsWhatsappPlaceholder')}
              className={inputCls}
            />
          </div>

          {/* Operating Hours — per-day grid */}
          <div>
            <p className={labelCls}>{t('settingsOperatingHours')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {t('settingsOperatingHoursHelper')}
            </p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_100px_100px] bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t('settingsDayColumn')}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">
                  {t('dayOpen')}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">
                  {t('dayClose')}
                </span>
              </div>
              {DAY_KEYS.map((day, idx) => {
                const { open, close } = form.operating_hours[day]
                const isClosed = !open && !close
                return (
                  <div
                    key={day}
                    className={`grid grid-cols-[1fr_100px_100px] items-center px-3 py-2 gap-2 ${
                      idx < DAY_KEYS.length - 1
                        ? 'border-b border-gray-100 dark:border-gray-800'
                        : ''
                    } ${isClosed ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isClosed
                          ? 'text-gray-400 dark:text-gray-600'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t(
                        `day${day.charAt(0).toUpperCase() + day.slice(1)}` as Parameters<
                          typeof t
                        >[0]
                      )}
                      {isClosed && (
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-600">
                          — {t('dayClosed')}
                        </span>
                      )}
                    </span>
                    <input
                      type="time"
                      value={open}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          operating_hours: {
                            ...prev.operating_hours,
                            [day]: { ...prev.operating_hours[day], open: e.target.value },
                          },
                        }))
                        setIsDirty(true)
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange"
                    />
                    <input
                      type="time"
                      value={close}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          operating_hours: {
                            ...prev.operating_hours,
                            [day]: { ...prev.operating_hours[day], close: e.target.value },
                          },
                        }))
                        setIsDirty(true)
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Google Maps Embed URL */}
          <div>
            <label className={labelCls}>{t('settingsGoogleMaps')}</label>
            <input
              type="text"
              value={form.google_maps_embed_url}
              onChange={(e) => set('google_maps_embed_url', e.target.value)}
              placeholder="https://www.google.com/maps/embed?..."
              className={inputCls}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('settingsGoogleMapsHelper')}
            </p>
          </div>

          {/* Facebook + Instagram */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className={labelCls}>{t('settingsFacebook')}</label>
              <input
                type="url"
                value={form.facebook_url}
                onChange={(e) => set('facebook_url', e.target.value)}
                placeholder={t('settingsFacebookPlaceholder')}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>{t('settingsInstagram')}</label>
              <input
                type="url"
                value={form.instagram_url}
                onChange={(e) => set('instagram_url', e.target.value)}
                placeholder={t('settingsInstagramPlaceholder')}
                className={inputCls}
              />
            </div>
          </div>
        </>
      )}

      {/* Save */}
      <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending || uploading}
          className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-orange-600 transition-colors"
        >
          {mutation.isPending ? t('saving2') : t('save')}
        </button>
      </div>
    </div>
  )
}
