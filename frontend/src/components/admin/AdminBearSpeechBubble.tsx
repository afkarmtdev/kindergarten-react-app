const ZZZ_KEYFRAMES = `
  @keyframes admin-bear-zzz {
    0%, 100% { transform: translateY(0) scale(1);       opacity: 0.7; }
    50%       { transform: translateY(-5px) scale(1.15); opacity: 1;   }
  }
`

type AdminBearSpeechBubbleProps = {
  variant: 'sleeping' | 'waking' | 'hidden'
  message?: string
}

export function AdminBearSpeechBubble({ variant, message }: AdminBearSpeechBubbleProps) {
  const visible = variant !== 'hidden'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ZZZ_KEYFRAMES }} />
      <div
        className={`absolute top-full left-0 mt-1 pointer-events-none w-max max-w-[130px] z-10
          transition-[opacity,transform] duration-200 ease-out
          ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 -translate-y-1'}`}
        style={{ transformOrigin: 'top left' }}
      >
        <div
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
            rounded-xl px-3 py-1.5 flex items-end justify-center gap-1 leading-none"
        >
          {variant === 'sleeping' ? (
            <>
              <span
                className="text-gray-700 dark:text-gray-200 select-none"
                style={{
                  fontSize: 10,
                  animation: 'admin-bear-zzz 1.6s ease-in-out infinite',
                  animationDelay: '0s',
                  display: 'inline-block',
                }}
              >
                z
              </span>
              <span
                className="text-gray-700 dark:text-gray-200 select-none"
                style={{
                  fontSize: 12,
                  animation: 'admin-bear-zzz 1.6s ease-in-out infinite',
                  animationDelay: '0.3s',
                  display: 'inline-block',
                }}
              >
                z
              </span>
              <span
                className="text-gray-800 dark:text-white font-bold select-none"
                style={{
                  fontSize: 14,
                  animation: 'admin-bear-zzz 1.6s ease-in-out infinite',
                  animationDelay: '0.6s',
                  display: 'inline-block',
                }}
              >
                Z
              </span>
            </>
          ) : (
            <span className="text-[11px] font-bold text-gray-800 dark:text-white text-center leading-snug">
              {message}
            </span>
          )}
        </div>

        {/* Centered tail pointing UP — sits at top of bubble, overlaps bubble border by 1px */}
        <svg
          className="absolute left-5"
          style={{ top: -6 }}
          width="12"
          height="7"
          viewBox="0 0 12 7"
          aria-hidden="true"
        >
          <polygon points="0,7 6,0 12,7" className="fill-white dark:fill-gray-800" />
          <polyline
            points="0,7 6,0 12,7"
            fill="none"
            strokeWidth="1"
            className="stroke-gray-200 dark:stroke-gray-600"
          />
        </svg>
      </div>
    </>
  )
}
