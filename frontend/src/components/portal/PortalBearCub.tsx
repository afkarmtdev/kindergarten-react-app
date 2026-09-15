// Small upright cub for the portal header menu and "Powered by" footer.
// Waves the Jalur Gemilang during Malaysia Day week.
import { StickerBear } from '@/components/ui/StickerBear'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'

export function PortalBearCub({ size = 24 }: { size?: number }) {
  const malaysiaDay = useMalaysiaDay()
  return <StickerBear size={size} tilt={0} flag={malaysiaDay ? 'malaysia' : 'none'} />
}
