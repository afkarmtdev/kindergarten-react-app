import { useState } from 'react'
import { useT } from '@/hooks/useT'
import { useLandingSection } from '@/hooks/useLandingSection'
import { WebsiteSectionCard } from './WebsiteSectionCard'
import { BilingualField } from './BilingualField'
import { ToggleSwitch } from './ToggleSwitch'
import { PhotoUploadTile } from './PhotoUploadTile'

const MAX_PHOTOS = 3
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1'
const INPUT_CLS =
  'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange'

/** Settings > Website > Our Story — founding year, story, teaching approach, principal message, photos. */
export function WebsiteStorySection() {
  const t = useT()
  const [uploading, setUploading] = useState(false)
  const { value, update, isDirty, isLoading, hasSchoolInfo, schoolInfo, save, isSaving } =
    useLandingSection('about')

  const principalName = schoolInfo?.principal_name ?? ''
  const photoSlots = [...value.photo_urls, ...Array(MAX_PHOTOS).fill(null)].slice(0, MAX_PHOTOS)

  const setPhoto = (index: number, url: string | null) => {
    const next = [...value.photo_urls]
    if (url === null) next.splice(index, 1)
    else if (index < next.length) next[index] = url
    else next.push(url)
    update({ photo_urls: next })
  }

  return (
    <WebsiteSectionCard
      title={t('settingsNavStory')}
      description={t('settingsStoryDesc')}
      isLoading={isLoading}
      hasSchoolInfo={hasSchoolInfo}
      isDirty={isDirty}
      isSaving={isSaving}
      saveDisabled={uploading}
      onSave={save}
    >
      <ToggleSwitch
        checked={value.enabled}
        onChange={(enabled) => update({ enabled })}
        label={t('settingsShowSection')}
      />

      <div className="w-full sm:w-40">
        <label className={LABEL_CLS}>{t('settingsFoundedYear')}</label>
        <input
          type="number"
          min={1900}
          max={2100}
          value={value.founded_year ?? ''}
          onChange={(e) =>
            update({ founded_year: e.target.value === '' ? null : Number(e.target.value) })
          }
          className={INPUT_CLS}
        />
      </div>

      <BilingualField
        label={t('settingsStoryText')}
        value={value.story}
        onChange={(story) => update({ story })}
        multiline
        rows={4}
      />
      <BilingualField
        label={t('settingsApproachText')}
        value={value.approach}
        onChange={(approach) => update({ approach })}
        multiline
        rows={3}
      />

      <div className="flex flex-col sm:flex-row gap-5">
        <div>
          <p className={LABEL_CLS}>{t('settingsPrincipalPhoto')}</p>
          <PhotoUploadTile
            value={value.principal_photo_url}
            onChange={(principal_photo_url) => update({ principal_photo_url })}
            folder="principal"
            onUploadingChange={setUploading}
          />
        </div>
        <div className="flex-1">
          <BilingualField
            label={
              principalName
                ? `${t('settingsPrincipalMessage')} (${principalName})`
                : t('settingsPrincipalMessage')
            }
            value={value.principal_message}
            onChange={(principal_message) => update({ principal_message })}
            multiline
            rows={4}
            hint={t('settingsPrincipalNameHint')}
          />
        </div>
      </div>

      <div>
        <p className={LABEL_CLS}>{t('settingsStoryPhotos')}</p>
        <div className="flex flex-wrap gap-4">
          {photoSlots.map((url: string | null, i) => (
            <PhotoUploadTile
              key={url ?? `slot-${i}`}
              value={url}
              onChange={(next) => setPhoto(i, next)}
              folder="about"
              size="sm"
              onUploadingChange={setUploading}
            />
          ))}
        </div>
      </div>
    </WebsiteSectionCard>
  )
}
