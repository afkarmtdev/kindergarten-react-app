// Bear family for the portal login — papa (blue bow) and mama (pink bow,
// eyelashes) leaning in over a smaller grinning cub. Three StickerBears in a
// row; `size` is the total width.
import { StickerBear, BEAR_BOW_BLUE, BEAR_BOW_PINK } from '@/components/ui/StickerBear'

export function PortalBearFamily({ size = 96 }: { size?: number }) {
  const parent = size * 0.42
  const cub = size * 0.32
  return (
    <div className="flex items-end justify-center" style={{ width: size }} aria-hidden="true">
      <div style={{ marginRight: -size * 0.04 }}>
        <StickerBear size={parent} bowColor={BEAR_BOW_BLUE} tilt={-10} />
      </div>
      <div style={{ marginBottom: -size * 0.02 }}>
        <StickerBear size={cub} mood="grin" tilt={0} />
      </div>
      <div style={{ marginLeft: -size * 0.04 }}>
        <StickerBear size={parent} bowColor={BEAR_BOW_PINK} tilt={10} lashes />
      </div>
    </div>
  )
}
