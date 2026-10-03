// Small upright mascot for the portal header menu and "Powered by" footer.
// Waves the Jalur Gemilang during Malaysia Day week.
import { Mascot } from '@/components/ui/Mascot'
import { useMalaysiaDay } from '@/hooks/useMalaysiaDay'

export function PortalBearCub({ size = 24 }: { size?: number }) {
  const malaysiaDay = useMalaysiaDay()
  return <Mascot size={size} tilt={0} flag={malaysiaDay ? 'malaysia' : 'none'} />
}
