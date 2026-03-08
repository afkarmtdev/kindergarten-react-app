import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Palette } from 'lucide-react'
import { artWallApi } from '@/lib/api'
import { Pagination } from '@/components/ui/Pagination'
import { useT } from '@/hooks/useT'
import { CORK_STYLE, CORK_STYLE_DARK } from '@/pages/art-wall/constants'
import { ArtworkCard } from '@/pages/art-wall/components/ArtworkCard'
import { ArtworkCardSkeleton } from '@/pages/art-wall/components/ArtworkCardSkeleton'
import { ArtworkLightbox } from '@/pages/art-wall/components/ArtworkLightbox'
import { useSettingsStore } from '@/store/settingsStore'
const LIMIT = 6

export function StudentArtwork({ studentId }: { studentId: string }) {
  const t = useT()
  const darkMode = useSettingsStore((s) => s.darkMode)
  const [page, setPage] = useState(1)
  const [lightboxId, setLightboxId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['art-wall-student', studentId, page],
    queryFn: () => artWallApi.getByStudent(studentId, { page, limit: LIMIT }),
    enabled: !!studentId,
    placeholderData: (prev: unknown) => prev,
  })

  const items: import('@/types').ArtWallItem[] = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="mt-6 mb-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Palette size={18} className="text-kinder-purple" />
          {t('studentArtwork')}
        </h2>

        {isLoading ? (
          <div
            className="bg-amber-100/80 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-300/60 dark:border-amber-800/30"
            style={darkMode ? CORK_STYLE_DARK : CORK_STYLE}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArtworkCardSkeleton key={i} design="polaroid" size="sm" index={i} />
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('noArtwork')}</p>
        ) : (
          <div
            className="bg-amber-100/80 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-300/60 dark:border-amber-800/30"
            style={darkMode ? CORK_STYLE_DARK : CORK_STYLE}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pt-8">
              {items.map((item) => (
                <ArtworkCard
                  key={item.id}
                  item={item}
                  design="polaroid"
                  size="sm"
                  onView={(i) => setLightboxId(i.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ArtworkLightbox
        items={items}
        activeId={lightboxId}
        onClose={() => setLightboxId(null)}
        onNavigate={setLightboxId}
      />

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
