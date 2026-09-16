// Shared tokens, sample data and markup helpers for the dashboard direction artboards.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const sidebar = readFileSync(join(here, '_sidebar.html'), 'utf8')

export const T = {
  page: '#FDF6F0',
  panel: '#FFFAF5',
  card: '#FFFFFF',
  border: '#ECDED0',
  track: '#F3EAE0',
  ink: '#342A22',
  muted: '#625448',
  muted2: '#78685A',
  muted3: '#948272',
  muted4: '#B2A08E',
  orange: '#FF6B35',
  blue: '#4D96FF',
  green: '#6BCB77',
  yellow: '#FFD93D',
  purple: '#C77DFF',
  pink: '#FF85A2',
  wash: {
    sky: ['#E3EEFF', '#2F6FD6'],
    mint: ['#E4F5E7', '#3E9D4C'],
    butter: ['#FFF6D6', '#D9A400'],
    blush: ['#FFE6EC', '#E0567A'],
    lavender: ['#F1E4FF', '#9B4FE0'],
    peach: ['#FFE9DF', '#E85D22'],
    ocean: ['#DEF4F6', '#1E8A96'],
  },
}

export const FUN = "font-family: 'Fredoka', sans-serif; font-weight: 700;"

// Sample children. status: present | late | absent | excused
export const CLASSES = [
  {
    name: 'Sunflower',
    teacher: 'Teacher Aina',
    wash: 'butter',
    kids: [
      ['Aisha Humaira', 'AH', 'blush', 'present'],
      ['Daniel Raj', 'DR', 'sky', 'late'],
      ['Haziq Iman', 'HI', 'lavender', 'present'],
      ['Nur Zara', 'NZ', 'butter', 'present'],
      ['Mei Wen', 'MW', 'mint', 'absent'],
      ['Arjun Pillai', 'AP', 'peach', 'present'],
      ['Sofea Lim', 'SL', 'sky', 'present'],
      ['Imran Hakim', 'IH', 'mint', 'present'],
      ['Chloe Tan', 'CT', 'blush', 'present'],
      ['Zayn Idris', 'ZI', 'lavender', 'present'],
    ],
  },
  {
    name: 'Rainbow',
    teacher: 'Teacher Suraya',
    wash: 'sky',
    kids: [
      ['Ethan Wong', 'EW', 'sky', 'present'],
      ['Batrisyia Amin', 'BA', 'blush', 'present'],
      ['Kavin Raj', 'KR', 'peach', 'present'],
      ['Ayla Sofia', 'AS', 'lavender', 'present'],
      ['Rayyan Aziz', 'RA', 'mint', 'excused'],
      ['Jia Hui', 'JH', 'butter', 'present'],
      ['Amirul Hafiz', 'AH', 'sky', 'present'],
      ['Nadia Rose', 'NR', 'blush', 'present'],
    ],
  },
  {
    name: 'Little Stars',
    teacher: 'Teacher Priya',
    wash: 'mint',
    kids: [
      ['Omar Faris', 'OF', 'peach', 'present'],
      ['Hana Yusof', 'HY', 'lavender', 'present'],
      ['Lucas Lee', 'LL', 'sky', 'present'],
      ['Iris Chong', 'IC', 'blush', 'present'],
      ['Danish Iqbal', 'DI', 'mint', 'present'],
      ['Meera Nair', 'MN', 'butter', 'present'],
      ['Adam Harith', 'AH', 'sky', 'present'],
      ['Qistina Balqis', 'QB', 'lavender', 'present'],
    ],
  },
]

export const STATUS_RING = {
  present: T.green,
  late: T.yellow,
  absent: T.pink,
  excused: T.blue,
}

export const STATUS_PILL = {
  present: ['Present', T.wash.mint[0], T.wash.mint[1]],
  late: ['Late', T.wash.butter[0], T.wash.butter[1]],
  absent: ['Away', T.wash.blush[0], T.wash.blush[1]],
  excused: ['Excused', T.wash.sky[0], T.wash.sky[1]],
}

export function avatar(initials, wash, size = 34, ring) {
  const [bg, fg] = T.wash[wash]
  const ringStyle = ring ? ` box-shadow: 0 0 0 3px ${T.card}, 0 0 0 6px ${ring};` : ''
  return `<div title="${initials}" style="width: ${size}px; height: ${size}px; border-radius: 999px; background: ${bg}; color: ${fg}; display: flex; align-items: center; justify-content: center; ${FUN} font-size: ${Math.round(size * 0.38)}px; flex-shrink: 0;${ringStyle}">${initials}</div>`
}

export function pill(text, bg, fg, extra = '') {
  return `<span style="font-size: 11px; font-weight: 800; color: ${fg}; background: ${bg}; padding: 4px 10px; border-radius: 999px; white-space: nowrap; ${extra}">${text}</span>`
}

export function sticker(text, rotate = -3, bg = T.yellow, fg = T.ink) {
  return `<span style="align-self: flex-start; background: ${bg}; color: ${fg}; ${FUN} font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 14px; border-radius: 999px; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.10); transform: rotate(${rotate}deg); white-space: nowrap;">${text}</span>`
}

export function btn(text, kind = 'primary') {
  if (kind === 'primary')
    return `<span style="background: ${T.orange}; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 12px 22px; border-radius: 999px; box-shadow: 0 6px 16px rgba(255,107,53,0.30); white-space: nowrap;">${text}</span>`
  if (kind === 'small')
    return `<span style="background: ${T.card}; color: ${T.ink}; font-weight: 800; font-size: 12px; padding: 7px 14px; border-radius: 999px; border: 2px solid ${T.border}; white-space: nowrap;">${text}</span>`
  return `<span style="background: ${T.card}; color: ${T.ink}; font-weight: 800; font-size: 14px; padding: 12px 20px; border-radius: 999px; border: 2px solid ${T.border}; white-space: nowrap;">${text}</span>`
}

export function link(text) {
  return `<span style="font-size: 13px; font-weight: 800; color: ${T.orange}; white-space: nowrap;">${text} &rarr;</span>`
}

const ICONS = {
  check: '<path d="M5 12l5 5 9-10"></path>',
  clipboard: '<rect x="5" y="3" width="14" height="18" rx="3"></rect><path d="M9 3v2h6V3M9 11h6M9 15h4"></path>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"></rect><path d="M3 10h18M16 15h2"></path>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M3 8l9 6 9-6"></path>',
  cake: '<path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"></path><path d="M12 12V8M9 12V9M15 12V9"></path><path d="M12 5c0-1 1-2 1-3-1 1-2 2-2 3a1 1 0 0 0 1 1 1 1 0 0 0 1-1"></path>',
  brush: '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 3 0 4-1a9 9 0 0 0-6-12z"></path><circle cx="8" cy="10" r="1"></circle><circle cx="12" cy="7" r="1"></circle><circle cx="16" cy="10" r="1"></circle>',
  chart: '<path d="M3 17l6-6 4 4 8-8"></path><path d="M14 7h7v7"></path>',
  clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"></rect><path d="M8 2v4M16 2v4M3 10h18"></path>',
  users: '<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"></path><circle cx="17" cy="9" r="2.5"></circle><path d="M21.5 19c0-2.5-2-4.5-4.5-4.5"></path>',
  sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path>',
  door: '<path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"></path><circle cx="14.5" cy="12" r="1"></circle>',
  apple: '<path d="M12 6c-3-3-8-1-8 5 0 5 4 10 8 10s8-5 8-10c0-6-5-8-8-5z"></path><path d="M12 6c0-2 1-3 2-4"></path>',
  pin: '<path d="M12 2l3 3-1 6 4 3v2H6v-2l4-3-1-6z"></path><path d="M12 16v6"></path>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"></path>',
}

export function icon(name, size = 18, color = 'currentColor', sw = 2.2) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
}

export function tile(name, wash, size = 44) {
  const [bg, fg] = T.wash[wash]
  return `<div style="width: ${size}px; height: ${size}px; border-radius: 14px; background: ${bg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon(name, Math.round(size * 0.48), fg)}</div>`
}

export function wrap(body, height = 1080) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap">
  <style>
    body { margin: 0; font-family: 'Nunito', 'Segoe UI', sans-serif; background: ${T.page}; }
    a { color: ${T.orange}; text-decoration: none; } a:hover { color: #e96908; }
  </style>
</helmet>
<div style="width: 1440px; min-height: ${height}px; display: flex; background: ${T.page}; color: ${T.ink}; font-family: 'Nunito', 'Segoe UI', sans-serif;">

${sidebar}
${body}
</div>
</x-dc>
</body>
</html>
`
}

