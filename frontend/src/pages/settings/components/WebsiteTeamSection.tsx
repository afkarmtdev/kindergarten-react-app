import { useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLandingSection } from '@/hooks/useLandingSection'
import { EMPTY_TEXT } from '@/lib/landingContent'
import { WebsiteSectionCard } from './WebsiteSectionCard'
import { BilingualField } from './BilingualField'
import { ToggleSwitch } from './ToggleSwitch'
import { PhotoUploadTile } from './PhotoUploadTile'
import type { TeamMember } from '@/types'

const MAX_MEMBERS = 24
const INPUT_CLS =
  'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange'

/** Settings > Website > Team — the people parents will meet, with photo, name and role. */
export function WebsiteTeamSection() {
  const t = useT()
  const [uploading, setUploading] = useState(false)
  const { value, update, isDirty, isLoading, hasSchoolInfo, save, isSaving } =
    useLandingSection('team')

  const members = value.members
  const hasBlankName = members.some((m) => m.name.trim() === '')

  const setMember = (id: string, patch: Partial<TeamMember>) =>
    update({ members: members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

  const remove = (id: string) => update({ members: members.filter((m) => m.id !== id) })

  const add = () =>
    update({
      members: [
        ...members,
        { id: crypto.randomUUID(), name: '', role: EMPTY_TEXT, photo_url: null },
      ],
    })

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= members.length) return
    const next = [...members]
    ;[next[index], next[j]] = [next[j], next[index]]
    update({ members: next })
  }

  return (
    <WebsiteSectionCard
      title={t('settingsNavTeam')}
      description={t('settingsTeamDesc')}
      isLoading={isLoading}
      hasSchoolInfo={hasSchoolInfo}
      isDirty={isDirty}
      isSaving={isSaving}
      saveDisabled={uploading || hasBlankName}
      onSave={save}
    >
      <ToggleSwitch
        checked={value.enabled}
        onChange={(enabled) => update({ enabled })}
        label={t('settingsShowSection')}
      />

      {members.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          {t('settingsNoMembers')}
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => (
            <div
              key={m.id}
              className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <PhotoUploadTile
                value={m.photo_url}
                onChange={(photo_url) => setMember(m.id, { photo_url })}
                folder="team"
                shape="circle"
                size="sm"
                onUploadingChange={setUploading}
              />
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {t('settingsMemberName')}
                  </label>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => setMember(m.id, { name: e.target.value })}
                    className={INPUT_CLS}
                  />
                </div>
                <BilingualField
                  label={t('settingsMemberRole')}
                  value={m.role}
                  onChange={(role) => setMember(m.id, { role })}
                />
              </div>
              <div className="flex sm:flex-col gap-1 self-start">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={t('settingsMoveUp')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-kinder-orange hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === members.length - 1}
                  aria-label={t('settingsMoveDown')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-kinder-orange hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={t('deleteBtn')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={members.length >= MAX_MEMBERS}
        className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-extrabold text-sm hover:border-kinder-orange hover:text-kinder-orange transition-colors disabled:opacity-40"
      >
        <Plus size={16} strokeWidth={3} />
        {t('settingsAddMember')}
      </button>
    </WebsiteSectionCard>
  )
}
