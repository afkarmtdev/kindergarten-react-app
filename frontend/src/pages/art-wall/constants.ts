// Pushpin head + needle color pairs
export const PUSHPIN_COLORS = [
  { head: '#FF6B35', shadow: '#cc5529' }, // kinder-orange
  { head: '#4D96FF', shadow: '#3a75cc' }, // kinder-blue
  { head: '#6BCB77', shadow: '#55a25f' }, // kinder-green
  { head: '#FFD93D', shadow: '#ccad31' }, // kinder-yellow
  { head: '#C77DFF', shadow: '#9f64cc' }, // kinder-purple
  { head: '#FF85A2', shadow: '#cc6a82' }, // kinder-pink
]

// Deterministic rotation from item id
export function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 7) - 3 // range: -3 to +3 degrees
}

// Deterministic pushpin color from item id
export function getPushpinColor(id: string): { head: string; shadow: string } {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 3) + id.charCodeAt(i)
    hash |= 0
  }
  return PUSHPIN_COLORS[Math.abs(hash) % PUSHPIN_COLORS.length]
}

// Cork board background style (reused across admin page, student profile, landing page)
export const CORK_STYLE = {
  backgroundImage: [
    'radial-gradient(ellipse at 20% 50%, rgba(139,90,43,0.12) 0%, transparent 50%)',
    'radial-gradient(ellipse at 80% 20%, rgba(160,110,60,0.10) 0%, transparent 40%)',
    'radial-gradient(circle, rgba(139,90,43,0.15) 1px, transparent 1px)',
    'radial-gradient(circle, rgba(160,110,60,0.08) 1.5px, transparent 1.5px)',
  ].join(', '),
  backgroundSize: '100% 100%, 100% 100%, 14px 14px, 23px 23px',
}

export const CORK_STYLE_DARK = {
  backgroundImage: [
    'radial-gradient(ellipse at 20% 50%, rgba(200,149,107,0.08) 0%, transparent 50%)',
    'radial-gradient(ellipse at 80% 20%, rgba(180,130,80,0.06) 0%, transparent 40%)',
    'radial-gradient(circle, rgba(200,149,107,0.10) 1px, transparent 1px)',
    'radial-gradient(circle, rgba(180,130,80,0.06) 1.5px, transparent 1.5px)',
  ].join(', '),
  backgroundSize: '100% 100%, 100% 100%, 14px 14px, 23px 23px',
}
