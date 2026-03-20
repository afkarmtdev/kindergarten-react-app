import { DoodleStar } from '@/components/landing/doodles/DoodleStar'
import { DoodleCloud } from '@/components/landing/doodles/DoodleCloud'
import { DoodleHeart } from '@/components/landing/doodles/DoodleHeart'
import { DoodleFlower } from '@/components/landing/doodles/DoodleFlower'
import { DoodleSpiral } from '@/components/landing/doodles/DoodleSpiral'

/* ── Dark-mode floating doodles ── */
const DARK_ICONS = [
  {
    top: '8%',
    left: '5%',
    anim: 'lp-float',
    delay: '0s',
    opacity: 0.12,
    el: <DoodleStar size={36} color="#FFD93D" />,
  },
  {
    top: '18%',
    left: '85%',
    anim: 'lp-float-alt',
    delay: '1.2s',
    opacity: 0.1,
    el: <DoodleCloud size={40} color="#4D96FF" />,
  },
  {
    top: '35%',
    left: '92%',
    anim: 'lp-float-slow',
    delay: '0.5s',
    opacity: 0.1,
    el: <DoodleHeart size={28} color="#FF85A2" />,
  },
  {
    top: '50%',
    left: '3%',
    anim: 'lp-float-alt',
    delay: '2s',
    opacity: 0.12,
    el: <DoodleFlower size={34} color="#6BCB77" />,
  },
  {
    top: '65%',
    left: '88%',
    anim: 'lp-float',
    delay: '1.5s',
    opacity: 0.1,
    el: <DoodleStar size={28} color="#C77DFF" />,
  },
  {
    top: '78%',
    left: '7%',
    anim: 'lp-float-slow',
    delay: '0.8s',
    opacity: 0.1,
    el: <DoodleSpiral size={30} color="#FF6B35" />,
  },
  {
    top: '28%',
    left: '4%',
    anim: 'lp-float',
    delay: '3s',
    opacity: 0.08,
    el: <DoodleCloud size={32} color="#FFD93D" />,
  },
  {
    top: '88%',
    left: '90%',
    anim: 'lp-float-alt',
    delay: '2.5s',
    opacity: 0.1,
    el: <DoodleFlower size={28} color="#FF85A2" />,
  },
]

/* ── Light-mode floating doodles — use the actual kinder palette, bolder opacity ── */
const LIGHT_ICONS = [
  {
    top: '6%',
    left: '4%',
    anim: 'lp-float',
    delay: '0s',
    opacity: 0.45,
    el: <DoodleStar size={36} color="#FFD93D" />,
  },
  {
    top: '20%',
    left: '88%',
    anim: 'lp-float-alt',
    delay: '1s',
    opacity: 0.35,
    el: <DoodleCloud size={40} color="#4D96FF" />,
  },
  {
    top: '38%',
    left: '93%',
    anim: 'lp-float-slow',
    delay: '0.5s',
    opacity: 0.4,
    el: <DoodleHeart size={28} color="#FF85A2" />,
  },
  {
    top: '52%',
    left: '2%',
    anim: 'lp-float-alt',
    delay: '2s',
    opacity: 0.4,
    el: <DoodleFlower size={34} color="#6BCB77" />,
  },
  {
    top: '68%',
    left: '90%',
    anim: 'lp-float',
    delay: '1.5s',
    opacity: 0.35,
    el: <DoodleStar size={28} color="#C77DFF" />,
  },
  {
    top: '80%',
    left: '6%',
    anim: 'lp-float-slow',
    delay: '0.8s',
    opacity: 0.4,
    el: <DoodleSpiral size={30} color="#FF6B35" />,
  },
  {
    top: '30%',
    left: '3%',
    anim: 'lp-float',
    delay: '3s',
    opacity: 0.3,
    el: <DoodleCloud size={32} color="#FFD93D" />,
  },
  {
    top: '88%',
    left: '91%',
    anim: 'lp-float-alt',
    delay: '2.5s',
    opacity: 0.35,
    el: <DoodleFlower size={28} color="#FF85A2" />,
  },
]

/* ── Dark-mode nebula glow blobs ── */
const DARK_BLOBS = [
  { top: '5%', left: '5%', size: 'w-96 h-96', color: '#7C3AED', opacity: 0.12 },
  { top: '15%', left: '85%', size: 'w-96 h-96', color: '#0D9488', opacity: 0.1 },
  { top: '55%', left: '0%', size: 'w-80 h-80', color: '#BE185D', opacity: 0.1 },
  { top: '65%', left: '90%', size: 'w-80 h-80', color: '#4D96FF', opacity: 0.1 },
]

/* ── Light-mode pastel blobs — warm watercolor feel ── */
const LIGHT_BLOBS = [
  { top: '0%', left: '0%', size: 'w-[28rem] h-[28rem]', color: '#FECDD3', opacity: 0.6 },
  { top: '10%', left: '85%', size: 'w-[26rem] h-[26rem]', color: '#BFDBFE', opacity: 0.5 },
  { top: '50%', left: '-5%', size: 'w-96 h-96', color: '#DDD6FE', opacity: 0.5 },
  { top: '65%', left: '85%', size: 'w-96 h-96', color: '#FDE68A', opacity: 0.45 },
]

function BlobLayer({ blobs, className }: { blobs: typeof DARK_BLOBS; className: string }) {
  return (
    <div className={className}>
      {blobs.map(({ top, left, size, color, opacity }, i) => (
        <div
          key={i}
          className={`absolute ${size} rounded-full`}
          style={{
            top,
            left,
            background: `radial-gradient(circle, ${color}, transparent 70%)`,
            opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}

function IconLayer({ icons, className }: { icons: typeof DARK_ICONS; className: string }) {
  return (
    <div className={className}>
      {icons.map(({ top, left, anim, delay, opacity, el }, i) => (
        <div key={i} className="absolute" style={{ top, left }}>
          <div className={anim} style={{ animationDelay: delay, opacity }}>
            {el}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PortalFloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Light mode layers */}
      <BlobLayer blobs={LIGHT_BLOBS} className="absolute inset-0 block dark:hidden" />
      <IconLayer icons={LIGHT_ICONS} className="absolute inset-0 block dark:hidden" />
      {/* Dark mode layers */}
      <BlobLayer blobs={DARK_BLOBS} className="absolute inset-0 hidden dark:block" />
      <IconLayer icons={DARK_ICONS} className="absolute inset-0 hidden dark:block" />
    </div>
  )
}
