import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { inquiriesApi } from '@/lib/api'
import { Wave } from './Wave'

export function InquiryForm() {
  const t = useT()
  const { ref, isVisible } = useFadeIn()
  const [view, setView] = useState<'form' | 'thankYou'>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    parent_name: '',
    child_name: '',
    child_age: '',
    phone: '',
    message: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      inquiriesApi.submit({
        parent_name: form.parent_name,
        child_name: form.child_name,
        child_age: Number(form.child_age),
        phone: form.phone,
        message: form.message || undefined,
      }),
    onSuccess: () => {
      setView('thankYou')
      setErrorMsg('')
    },
    onError: () => {
      setErrorMsg(t('inquiryError'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    mutation.mutate()
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-kinder-orange focus:ring-1 focus:ring-kinder-orange text-sm transition-colors'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <section className="bg-white dark:bg-gray-950 py-24 transition-colors duration-200">
      <div
        ref={ref}
        className={`max-w-3xl mx-auto px-4 sm:px-6 ${isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('inquiryTitle')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
            {t('inquirySubtitle')}
          </p>
        </div>

        {view === 'thankYou' ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500 dark:text-green-400" />
            </div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xl mb-2">
              {t('inquiryThankYouTitle')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{t('inquiryThankYouBody')}</p>
            <button
              onClick={() => {
                setView('form')
                setForm({ parent_name: '', child_name: '', child_age: '', phone: '', message: '' })
              }}
              className="text-sm font-semibold text-kinder-orange hover:underline"
            >
              {t('inquirySendAnother')}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelCls}>{t('inquiryParentName')}</label>
                <input
                  type="text"
                  required
                  value={form.parent_name}
                  onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))}
                  className={inputCls}
                  placeholder={t('inquiryParentName')}
                />
              </div>
              <div>
                <label className={labelCls}>{t('inquiryPhone')}</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputCls}
                  placeholder="+60XXXXXXXXX"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelCls}>{t('inquiryChildName')}</label>
                <input
                  type="text"
                  required
                  value={form.child_name}
                  onChange={(e) => setForm((f) => ({ ...f, child_name: e.target.value }))}
                  className={inputCls}
                  placeholder={t('inquiryChildName')}
                />
              </div>
              <div>
                <label className={labelCls}>{t('inquiryChildAge')}</label>
                <select
                  required
                  value={form.child_age}
                  onChange={(e) => setForm((f) => ({ ...f, child_age: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">{t('inquirySelectAge')}</option>
                  {[2, 3, 4, 5, 6, 7].map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className={labelCls}>{t('inquiryMessage')}</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={t('inquiryMessage')}
              />
            </div>

            {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="bg-kinder-orange text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {mutation.isPending ? t('inquirySubmitting') : t('inquirySubmit')}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="mt-16">
        <Wave fill="#C77DFF" />
      </div>
    </section>
  )
}
