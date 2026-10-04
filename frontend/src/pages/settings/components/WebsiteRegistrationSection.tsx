import { useState } from 'react'
import { useT } from '@/hooks/useT'
import { useLandingSection } from '@/hooks/useLandingSection'
import { WebsiteSectionCard } from './WebsiteSectionCard'
import { ToggleSwitch } from './ToggleSwitch'
import { PhotoUploadTile } from './PhotoUploadTile'

const LABEL_CLS = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1'

/** Settings > Website > Registration QR — the code visitors scan to open the school's enrolment form. */
export function WebsiteRegistrationSection() {
  const t = useT()
  const [uploading, setUploading] = useState(false)
  const { value, update, isDirty, isLoading, hasSchoolInfo, save, isSaving } =
    useLandingSection('registration')

  return (
    <WebsiteSectionCard
      title={t('settingsNavRegistration')}
      description={t('settingsRegistrationDesc')}
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

      <div>
        <p className={LABEL_CLS}>{t('settingsRegistrationQr')}</p>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
          <PhotoUploadTile
            value={value.qr_url}
            onChange={(qr_url) => update({ qr_url })}
            folder="registration"
            onUploadingChange={setUploading}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 sm:pt-1 max-w-sm">
            {t('settingsRegistrationQrHint')}
          </p>
        </div>
      </div>
    </WebsiteSectionCard>
  )
}
