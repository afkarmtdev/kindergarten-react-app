const WAVE_PATHS = {
  // Original smooth sine wave
  smooth:
    'M0,44 C180,88 360,0 540,44 C720,88 900,0 1080,44 C1260,88 1380,22 1440,44 L1440,88 L0,88 Z',
  // Steeper, single-arch wave
  peak: 'M0,66 C240,0 480,0 720,44 C960,88 1200,88 1440,22 L1440,88 L0,88 Z',
  // Triple-bump playful wave
  bumpy:
    'M0,55 C120,22 240,22 360,55 C480,88 600,88 720,55 C840,22 960,22 1080,55 C1200,88 1320,88 1440,55 L1440,88 L0,88 Z',
} as const

type WaveVariant = keyof typeof WAVE_PATHS

export function Wave({ fill, variant = 'smooth' }: { fill: string; variant?: WaveVariant }) {
  return (
    <div style={{ lineHeight: 0, display: 'block' }}>
      <svg
        viewBox="0 0 1440 88"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '88px' }}
      >
        <path d={WAVE_PATHS[variant]} fill={fill} />
      </svg>
    </div>
  )
}
