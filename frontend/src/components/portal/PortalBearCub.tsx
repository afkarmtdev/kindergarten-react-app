// Small upright cub for the portal header menu and "Powered by" footer.
import { StickerBear } from '@/components/ui/StickerBear'

export function PortalBearCub({ size = 24 }: { size?: number }) {
  return <StickerBear size={size} tilt={0} />
}
