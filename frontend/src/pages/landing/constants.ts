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
  @keyframes lp-pin-in {
    from { opacity: 0; transform: translateY(24px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  .lp-pin-in { animation: lp-pin-in 0.35s ease both; }
  @keyframes lp-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .lp-fade-up { animation: lp-fade-up 0.6s ease both; }

  @keyframes lp-mesh-gradient {
    0%   { background-position: 0% 50%; }
    25%  { background-position: 50% 0%; }
    50%  { background-position: 100% 50%; }
    75%  { background-position: 50% 100%; }
    100% { background-position: 0% 50%; }
  }
  .lp-mesh-gradient {
    background-size: 400% 400%;
    animation: lp-mesh-gradient 15s ease infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .lp-mesh-gradient {
      animation: none;
      background-size: 100% 100%;
    }
  }

  .lp-parallax-slow {
    transform: translateY(calc(var(--scroll-y, 0) * -0.03px));
    will-change: transform;
  }
  .lp-parallax-medium {
    transform: translateY(calc(var(--scroll-y, 0) * -0.06px));
    will-change: transform;
  }
  .lp-parallax-fast {
    transform: translateY(calc(var(--scroll-y, 0) * -0.1px));
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .lp-parallax-slow,
    .lp-parallax-medium,
    .lp-parallax-fast {
      transform: none !important;
    }
  }

  @keyframes lp-twinkle {
    0%, 100% { opacity: 0.12; transform: scale(0.8); }
    50%       { opacity: 0.70; transform: scale(1.2); }
  }
  @keyframes lp-twinkle-slow {
    0%, 100% { opacity: 0.08; transform: scale(0.85); }
    50%       { opacity: 0.50; transform: scale(1.15); }
  }
  .lp-twinkle      { animation: lp-twinkle      2.4s ease-in-out infinite; }
  .lp-twinkle-slow { animation: lp-twinkle-slow 4.2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .lp-twinkle, .lp-twinkle-slow { animation: none; opacity: 0.30; }
  }

  @keyframes lp-shooting-star {
    0%    { opacity: 0;    transform: rotate(35deg) translateX(0px); }
    1.5%  { opacity: 0.90; }
    6%    { opacity: 0;    transform: rotate(35deg) translateX(-460px); }
    6.01% { opacity: 0;    transform: rotate(35deg) translateX(0px); }
    100%  { opacity: 0;    transform: rotate(35deg) translateX(0px); }
  }
  .lp-shooting-star { animation: lp-shooting-star 13s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .lp-shooting-star { display: none; }
  }
`

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
