export function Wave({ fill }: { fill: string }) {
  return (
    <div style={{ lineHeight: 0, display: 'block' }}>
      <svg
        viewBox="0 0 1440 88"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '88px' }}
      >
        <path
          d="M0,44 C180,88 360,0 540,44 C720,88 900,0 1080,44 C1260,88 1380,22 1440,44 L1440,88 L0,88 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}
