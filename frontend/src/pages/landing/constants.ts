import { BookOpen, Shield, Music, Palette, Sun, Users } from 'lucide-react'
import { APP_NAME } from '@/lib/version'
import type { Announcement } from '@/types'

export const KEYFRAMES = `
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-18px) rotate(6deg); }
  }
  @keyframes lp-float-alt {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-12px) rotate(-8deg); }
    66%      { transform: translateY(-6px)  rotate(4deg); }
  }
  @keyframes lp-float-slow {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-26px) scale(1.06); }
  }
  @keyframes lp-spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes lp-entrance {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-slide-in {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes lp-card-exit {
    from { opacity: 1; transform: translateX(0px) scale(1); }
    to   { opacity: 0; transform: translateX(-40px) scale(0.96); }
  }
  @keyframes lp-card-enter {
    from { opacity: 0; transform: translateX(40px) scale(0.96); }
    to   { opacity: 1; transform: translateX(0px) scale(1); }
  }
  .lp-float        { animation: lp-float      4s   ease-in-out infinite; }
  .lp-float-alt    { animation: lp-float-alt  5.5s ease-in-out infinite; }
  .lp-float-slow   { animation: lp-float-slow 7s   ease-in-out infinite; }
  .lp-spin-slow    { animation: lp-spin-slow  12s  linear     infinite; }
  .lp-enter-0      { animation: lp-entrance   0.8s ease         both; }
  .lp-slide-in     { animation: lp-slide-in   0.35s ease        both; }
  .lp-enter-1      { animation: lp-entrance   0.8s ease 0.18s   both; }
  .lp-enter-2      { animation: lp-entrance   0.8s ease 0.36s   both; }
  .lp-card-exit    { animation: lp-card-exit  0.15s ease        forwards; }
  .lp-card-enter   { animation: lp-card-enter 0.18s ease        both; }
  @keyframes lp-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
`

export const FEATURES = [
  {
    icon: BookOpen,
    color: 'bg-kinder-blue',
    titleKey: 'featureLearnTitle',
    descKey: 'featureLearnDesc',
  },
  {
    icon: Shield,
    color: 'bg-kinder-pink',
    titleKey: 'featureSafeTitle',
    descKey: 'featureSafeDesc',
  },
  {
    icon: Music,
    color: 'bg-kinder-purple',
    titleKey: 'featureArtsTitle',
    descKey: 'featureArtsDesc',
  },
  {
    icon: Palette,
    color: 'bg-kinder-green',
    titleKey: 'featurePlayTitle',
    descKey: 'featurePlayDesc',
  },
  {
    icon: Sun,
    color: 'bg-kinder-yellow',
    titleKey: 'featureOutdoorTitle',
    descKey: 'featureOutdoorDesc',
  },
  {
    icon: Users,
    color: 'bg-kinder-orange',
    titleKey: 'featureClassTitle',
    descKey: 'featureClassDesc',
  },
] as const

export const TESTIMONIALS = [
  {
    quote: `${APP_NAME} has been a wonderful experience for our daughter. She comes home every day excited to share what she learned!`,
    name: 'Puan Siti Rahimah',
    role: 'Parent of Aisyah, Sunflower Class',
  },
  {
    quote: `The teachers are incredibly dedicated. Our son's confidence has grown so much since joining ${APP_NAME}.`,
    name: 'Encik Ahmad Fauzi',
    role: 'Parent of Haziq, Rainbow Class',
  },
  {
    quote:
      "A safe, nurturing environment with a fantastic curriculum. We couldn't be happier with our choice!",
    name: 'Mrs. Priya Krishnan',
    role: 'Parent of Arjun, Butterfly Class',
  },
]

export const NOTICE_CATEGORY_COLORS: Record<Announcement['category'], string> = {
  general: 'bg-kinder-blue/10 text-kinder-blue',
  holiday: 'bg-kinder-green/10 text-kinder-green',
  event: 'bg-kinder-purple/10 text-kinder-purple',
  reminder: 'bg-kinder-yellow/10 text-yellow-600',
}

export const NOTICE_CATEGORY_GRADIENTS: Record<Announcement['category'], string> = {
  general: 'from-kinder-blue/20 to-kinder-blue/10',
  holiday: 'from-kinder-green/20 to-kinder-green/10',
  event: 'from-kinder-purple/20 to-kinder-purple/10',
  reminder: 'from-kinder-yellow/20 to-kinder-yellow/10',
}

export const GALLERY_PLACEHOLDERS = [
  { id: 'p1', gradient: 'from-kinder-yellow/40 to-kinder-orange/30', label: 'Classroom Moments' },
  { id: 'p2', gradient: 'from-kinder-blue/30 to-kinder-purple/20', label: 'Art & Craft' },
  { id: 'p3', gradient: 'from-kinder-green/30 to-kinder-blue/20', label: 'Outdoor Play' },
  { id: 'p4', gradient: 'from-kinder-pink/30 to-kinder-purple/30', label: 'Story Time' },
  { id: 'p5', gradient: 'from-kinder-orange/30 to-kinder-yellow/20', label: 'Music & Dance' },
  { id: 'p6', gradient: 'from-kinder-purple/30 to-kinder-pink/20', label: 'Science Explore' },
]
