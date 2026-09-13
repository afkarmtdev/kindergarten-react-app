const WAVE_PATHS = {
  // Original smooth sine wave
  smooth:
    'M0,44 C180,88 360,0 540,44 C720,88 900,0 1080,44 C1260,88 1380,22 1440,44 L1440,88 L0,88 Z',
  // Steeper, single-arch wave
  peak: 'M0,66 C240,0 480,0 720,44 C960,88 1200,88 1440,22 L1440,88 L0,88 Z',
  // Triple-bump playful wave
  bumpy:
    'M0,55 C120,22 240,22 360,55 C480,88 600,88 720,55 C840,22 960,22 1080,55 C1200,88 1320,88 1440,55 L1440,88 L0,88 Z',
  // Scalloped semicircle bumps — hand-drawn feel (18 bumps, md and up)
  scallop:
    'M0,80 Q40,30 80,80 Q120,30 160,80 Q200,30 240,80 Q280,30 320,80 Q360,30 400,80 Q440,30 480,80 Q520,30 560,80 Q600,30 640,80 Q680,30 720,80 Q760,30 800,80 Q840,30 880,80 Q920,30 960,80 Q1000,30 1040,80 Q1080,30 1120,80 Q1160,30 1200,80 Q1240,30 1280,80 Q1320,30 1360,80 Q1400,30 1440,80 L1440,88 L0,88 Z',
} as const

/**
 * Phone-width scallop: 6 bumps instead of 18. The SVG is stretched to the
 * viewport width, so on a 400px phone the desktop bumps shrink to ~22px wide
 * while staying 25px tall and read as a row of spikes. Six bumps keep the
 * proportions relaxed, roughly 70px wide bumps on a phone.
 */
const SCALLOP_MOBILE =
  'M0,80 Q120,30 240,80 Q360,30 480,80 Q600,30 720,80 Q840,30 960,80 Q1080,30 1200,80 Q1320,30 1440,80 L1440,88 L0,88 Z'

type WaveVariant = keyof typeof WAVE_PATHS

/**
 * Decorative section divider. The wave is painted in the colour of the NEXT section,
 * so it sits at the bottom of a section and "bites" into it.
 *
 * Prefer `fillClassName` with Tailwind fill utilities (e.g. `fill-wash-sky`,
 * `fill-white dark:fill-gray-950`) so the colour follows the light/dark tokens.
 * `fill` remains for one-off literal colours.
 *
 * The wrapper carries the `lp-wave` class: a rule in index.css pulls whatever
 * follows a wave-ending section up by 1px so the two overlap. Without it, the
 * section edge lands on a fractional device pixel on phones and both the wave
 * and the next band get an anti-aliased half-covered row there, which shows as
 * a hairline of page background between them.
 */
export function Wave({
  fill,
  fillClassName,
  variant = 'smooth',
}: {
  fill?: string
  fillClassName?: string
  variant?: WaveVariant
}) {
  const pathProps = {
    fill: fillClassName ? undefined : fill,
  }
  return (
    <div className="lp-wave" style={{ lineHeight: 0, display: 'block' }}>
      <svg
        viewBox="0 0 1440 88"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '88px' }}
      >
        {variant === 'scallop' ? (
          <>
            <path
              d={SCALLOP_MOBILE}
              {...pathProps}
              className={`md:hidden ${fillClassName ?? ''}`}
            />
            <path
              d={WAVE_PATHS.scallop}
              {...pathProps}
              className={`hidden md:block ${fillClassName ?? ''}`}
            />
          </>
        ) : (
          <path d={WAVE_PATHS[variant]} {...pathProps} className={fillClassName} />
        )}
      </svg>
    </div>
  )
}
