import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { feePlansApi } from '@/lib/api'
import { useFeePlansStore } from '@/store/feePlansStore'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/Skeletons'
import { FeePlanModal } from '@/components/admin/FeePlanModal'
import { GenerateFeesModal } from '@/components/admin/GenerateFeesModal'
import { DeleteDialog } from '@/components/ui/DeleteDialog'
import type { FeePlan } from '@/types'

const LIMIT = 9

const TYPE_COLORS: Record<string, string> = {
  tuition: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  activity: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  uniform: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  registration: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function FeePlansPage() {
  usePageTitle('Fee Plans')
  const t = useT()
  const queryClient = useQueryClient()
  const { page, search, setPage, setSearch } = useFeePlansStore()

  const [modalPlan, setModalPlan] = useState<FeePlan | null | undefined>(undefined)
  const [generatePlan, setGeneratePlan] = useState<FeePlan | null | undefined>(undefined)
  const [deletingPlan, setDeletingPlan] = useState<FeePlan | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['fee-plans', { page, search }],
    queryFn: () => feePlansApi.getAll({ page, limit: LIMIT, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feePlansApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['fee-plans'] })
      const snapshot = queryClient.getQueriesData<{
        data: { id: string }[]
        meta: { total: number }
      }>({ queryKey: ['fee-plans'] })
      queryClient.setQueriesData<{ data: { id: string }[]; meta: { total: number } }>(
        { queryKey: ['fee-plans'] },
        (old) =>
          old?.data
            ? {
                ...old,
                data: old.data.filter((item) => item.id !== id),
                meta: { ...old.meta, total: Math.max(0, (old.meta?.total ?? 1) - 1) },
              }
            : old
      )
      return { snapshot }
    },
    onSuccess: () => {
      toast.success('Fee plan removed')
      setDeletingPlan(null)
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Failed to remove fee plan. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] })
    },
  })

  const typeLabel = (tp: string) => {
    const map: Record<string, string> = {
      tuition: t('feeTypeTuition'),
      activity: t('feeTypeActivity'),
      uniform: t('feeTypeUniform'),
      registration: t('feeTypeRegistration'),
      other: t('feeTypeOther'),
    }
    return map[tp] ?? tp
  }

  const plans = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 1
  const totalPlans = data?.meta.total ?? 0

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-fun font-bold text-gray-900 dark:text-gray-100">
            {t('feePlans')}
          </h1>
          {data && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {data.meta.total} {t('feePlans').toLowerCase()}
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder={t('searchFeePlans')} />
          <button
            onClick={() => setModalPlan(null)}
            className="flex items-center justify-center gap-2 bg-kinder-orange text-white px-5 py-2.5 rounded-xl font-semibold text-sm w-full md:w-auto hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            {t('addFeePlan')}
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-3xl p-5 border-2 border-gray-200 dark:border-gray-800 animate-pulse h-36"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title={search ? t('noFeePlansFound') : t('noFeePlansFound')}
          subtitle={!search ? t('addFirstFeePlan') : undefined}
        />
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border-2 border-gray-200 dark:border-gray-800 flex flex-col gap-3"
            >
              {/* Type badge + amount */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[plan.type] ?? TYPE_COLORS.other}`}
                >
                  {typeLabel(plan.type)}
                </span>
                <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                  RM {Number(plan.amount).toFixed(2)}
                </span>
              </div>

              {/* Name */}
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug">
                {plan.name}
              </p>
              {plan.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {plan.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setGeneratePlan(plan)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-kinder-orange hover:text-orange-600 transition-colors"
                >
                  <Zap size={13} />
                  {t('usePlan')}
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => setModalPlan(plan)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-kinder-blue hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingPlan(plan)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalPlans}
            limit={LIMIT}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modals */}
      {modalPlan !== undefined && (
        <FeePlanModal plan={modalPlan} onClose={() => setModalPlan(undefined)} />
      )}
      {generatePlan !== undefined && (
        <GenerateFeesModal prefillPlan={generatePlan} onClose={() => setGeneratePlan(undefined)} />
      )}
      <DeleteDialog
        show={!!deletingPlan}
        itemName={deletingPlan?.name}
        onConfirm={() => {
          if (deletingPlan) {
            deleteMutation.mutate(deletingPlan.id)
            setDeletingPlan(null)
          }
        }}
        onCancel={() => setDeletingPlan(null)}
      />
    </div>
  )
}
