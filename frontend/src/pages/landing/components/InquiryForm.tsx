import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useFadeIn } from '@/hooks/useFadeIn'
import { inquiriesApi } from '@/lib/api'
import { Wave } from './Wave'
import { StarField } from './StarField'

const CONFETTI_COLORS = ['#FF6B35', '#4D96FF', '#6BCB77', '#FFD93D', '#C77DFF', '#FF85A2']

const CONFETTI_PARTICLES: {
  left: string
  delay: string
  dur: string
  color: string
  size: number
  rot: number
}[] = [
  { left: '5%', delay: '0s', dur: '2.2s', color: CONFETTI_COLORS[0], size: 8, rot: 30 },
  { left: '12%', delay: '0.1s', dur: '2.5s', color: CONFETTI_COLORS[3], size: 6, rot: 60 },
  { left: '20%', delay: '0.3s', dur: '2.0s', color: CONFETTI_COLORS[1], size: 10, rot: 15 },
  { left: '28%', delay: '0s', dur: '2.8s', color: CONFETTI_COLORS[4], size: 7, rot: 90 },
  { left: '36%', delay: '0.2s', dur: '2.1s', color: CONFETTI_COLORS[2], size: 8, rot: 45 },
  { left: '44%', delay: '0.4s', dur: '2.6s', color: CONFETTI_COLORS[5], size: 6, rot: 120 },
  { left: '52%', delay: '0.1s', dur: '2.3s', color: CONFETTI_COLORS[0], size: 9, rot: 20 },
  { left: '60%', delay: '0.3s', dur: '2.0s', color: CONFETTI_COLORS[3], size: 7, rot: 75 },
  { left: '68%', delay: '0s', dur: '2.7s', color: CONFETTI_COLORS[1], size: 8, rot: 50 },
  { left: '76%', delay: '0.2s', dur: '2.4s', color: CONFETTI_COLORS[4], size: 6, rot: 100 },
  { left: '84%', delay: '0.1s', dur: '2.2s', color: CONFETTI_COLORS[2], size: 10, rot: 35 },
  { left: '92%', delay: '0.3s', dur: '2.5s', color: CONFETTI_COLORS[5], size: 7, rot: 65 },
  { left: '8%', delay: '0.5s', dur: '2.9s', color: CONFETTI_COLORS[3], size: 6, rot: 80 },
  { left: '33%', delay: '0.6s', dur: '2.1s', color: CONFETTI_COLORS[0], size: 8, rot: 110 },
  { left: '57%', delay: '0.5s', dur: '2.8s', color: CONFETTI_COLORS[2], size: 7, rot: 25 },
  { left: '80%', delay: '0.4s', dur: '2.3s', color: CONFETTI_COLORS[5], size: 9, rot: 55 },
]

const CONFETTI_CSS = `
  @keyframes lp-confetti-fall {
    0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
  }
`

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
    <section className="relative overflow-hidden bg-white dark:bg-[#150f2a] py-24 transition-colors duration-200">
      <style dangerouslySetInnerHTML={{ __html: CONFETTI_CSS }} />
      <StarField variant="a" className="hidden dark:block" />
      <div
        ref={ref}
        className={`relative max-w-3xl mx-auto px-4 sm:px-6 ${isVisible ? 'lp-fade-up' : 'opacity-0'}`}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-kinder-orange via-kinder-pink to-kinder-purple bg-clip-text text-transparent leading-tight">
            {t('inquiryTitle')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mt-2">
            {t('inquirySubtitle')}
          </p>
        </div>

        {view === 'thankYou' ? (
          <div className="relative overflow-hidden bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-10 text-center">
            {/* Confetti burst */}
            {CONFETTI_PARTICLES.map((p, i) => (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: p.left,
                  top: 0,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: 2,
                  transform: `rotate(${p.rot}deg)`,
                  animation: `lp-confetti-fall ${p.dur} ${p.delay} ease-in forwards`,
                }}
                aria-hidden="true"
              />
            ))}

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
        <Wave fill="#6BCB77" />
      </div>
    </section>
  )
}
