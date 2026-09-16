// Direction B: "Classroom wall". The dashboard as the noticeboard by the
// staff-room door: pinned notes, a register sheet, a birthday sticker, the
// newest artwork, and letters in the tray. Playful; numbers stay small.
import { T, FUN, CLASSES, STATUS_PILL, avatar, icon, link, sticker } from './shared.mjs'

function pushpin(color) {
  return `<div style="position: absolute; top: -9px; left: 50%; transform: translateX(-50%); width: 18px; height: 18px; border-radius: 999px; background: ${color}; border: 3px solid #FFFFFF; box-shadow: 0 3px 6px rgba(52,42,34,0.25);"></div>`
}

function note({ bg, border, rotate, pin, inner, pad = '26px 24px 22px' }) {
  const b = border ? `border: 2px solid ${border};` : ''
  return `<div style="position: relative; background: ${bg}; ${b} border-radius: 20px; padding: ${pad}; transform: rotate(${rotate}deg); box-shadow: 0 8px 18px rgba(52,42,34,0.08); display: flex; flex-direction: column; gap: 12px;">
        ${pushpin(pin)}
        ${inner}
      </div>`
}

function registerRow(kid) {
  const [name, initials, wash, status] = kid
  const [label, bg, fg] = STATUS_PILL[status]
  const mark =
    status === 'present' || status === 'late'
      ? icon('check', 18, T.wash.mint[1], 3)
      : `<span style="width: 18px; height: 18px; display: inline-block;"></span>`
  return `<div style="display: flex; align-items: center; gap: 12px; padding: 7px 0; border-bottom: 2px dashed ${T.border};">
          ${mark}
          ${avatar(initials, wash, 30)}
          <span style="flex-grow: 1; font-size: 14px; font-weight: 700; color: ${T.ink};">${name}</span>
          <span style="font-size: 11px; font-weight: 800; color: ${fg}; background: ${bg}; padding: 3px 9px; border-radius: 999px;">${label}</span>
        </div>`
}

export function bodyB() {
  const sunflower = CLASSES[0].kids.slice(0, 6).map(registerRow).join('\n')

  return `  <div style="flex-grow: 1; padding: 36px 44px 40px; display: flex; flex-direction: column; gap: 28px; min-width: 0; background: ${T.page}; background-image: radial-gradient(${T.border} 1.2px, transparent 1.2px); background-size: 22px 22px;">

    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${sticker('Friday, 12 September', -3)}
        <h1 style="margin: 0; ${FUN} font-size: 36px; line-height: 1.1; color: ${T.ink};">Morning, Aina. Here is the wall.</h1>
        <span style="font-size: 15px; font-weight: 600; color: ${T.muted};">24 of 26 in. One birthday, two reminders, three letters.</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 6px;">
        <span style="background: ${T.card}; color: ${T.ink}; font-weight: 800; font-size: 14px; padding: 12px 20px; border-radius: 999px; border: 2px solid ${T.border};">Daily reports</span>
        <span style="background: ${T.orange}; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 12px 22px; border-radius: 999px; box-shadow: 0 6px 16px rgba(255,107,53,0.30);">Take the register</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; align-items: start; padding-top: 8px;">

      <div style="display: flex; flex-direction: column; gap: 28px;">
        ${note({
          bg: T.card,
          border: T.border,
          rotate: -1.2,
          pin: T.pink,
          inner: `<div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="${FUN} font-size: 20px; color: ${T.ink};">Sunflower register</span><span style="font-size: 12px; font-weight: 800; color: ${T.muted3};">9 of 10</span></div>
        <div style="display: flex; flex-direction: column;">
${sunflower}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-size: 12px; font-weight: 700; color: ${T.muted3};">4 more on the sheet</span>${link('Rainbow and Little Stars')}</div>`,
        })}

        ${note({
          bg: T.wash.blush[0],
          rotate: 1.6,
          pin: T.yellow,
          pad: '30px 24px 22px',
          inner: `<div style="display: flex; align-items: center; gap: 16px;">
          ${avatar('NZ', 'butter', 56)}
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="${FUN} font-size: 22px; color: ${T.ink};">Nur Zara is five today</span>
            <span style="font-size: 13px; font-weight: 600; color: ${T.muted};">Cake at snack time. Mum is bringing it at 10.</span>
          </div>
        </div>`,
        })}
      </div>

      <div style="display: flex; flex-direction: column; gap: 28px;">
        ${note({
          bg: T.wash.butter[0],
          rotate: 0.8,
          pin: T.blue,
          pad: '30px 24px 22px',
          inner: `<span style="${FUN} font-size: 20px; color: ${T.ink};">Notes for today</span>
        <div style="display: flex; flex-direction: column; font-size: 14px; line-height: 30px; font-weight: 600; color: ${T.muted}; white-space: nowrap; overflow: hidden; background-image: linear-gradient(transparent 28px, rgba(52,42,34,0.12) 28px, rgba(52,42,34,0.12) 30px); background-size: 100% 30px;">
          <span>Mei Wen at the dentist, back Monday.</span>
          <span>Sports day kit list goes home today.</span>
          <span>Puan Farah: visit on Tuesday at 10.</span>
          <span style="color: ${T.muted4};">Add a note...</span>
        </div>`,
        })}

        ${note({
          bg: T.card,
          border: T.border,
          rotate: -0.6,
          pin: T.green,
          inner: `<div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 14px; background: ${T.wash.mint[0]}; display: flex; align-items: center; justify-content: center;">${icon('wallet', 20, T.wash.mint[1])}</div>
          <div style="display: flex; flex-direction: column;"><span style="${FUN} font-size: 18px; color: ${T.ink};">Fees, September</span><span style="font-size: 12px; font-weight: 700; color: ${T.muted3};">RM 7,920 in, RM 1,440 to go</span></div>
        </div>
        <div style="height: 10px; border-radius: 999px; background: ${T.track};"><div style="width: 85%; height: 100%; border-radius: 999px; background: ${T.green};"></div></div>
        <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px;">
          <div style="display: flex; align-items: center; gap: 10px;">${avatar('DR', 'sky', 28)}<span style="flex-grow: 1; font-size: 13px; font-weight: 700; color: ${T.ink};">Daniel Raj <span style="color: ${T.muted3}; font-weight: 600;">RM 480, a week late</span></span>${link('Remind')}</div>
          <div style="display: flex; align-items: center; gap: 10px;">${avatar('HI', 'lavender', 28)}<span style="flex-grow: 1; font-size: 13px; font-weight: 700; color: ${T.ink};">Haziq Iman <span style="color: ${T.muted3}; font-weight: 600;">RM 240, a week late</span></span>${link('Remind')}</div>
        </div>`,
        })}
      </div>

      <div style="display: flex; flex-direction: column; gap: 28px;">
        ${note({
          bg: T.card,
          border: T.border,
          rotate: 1.1,
          pin: T.purple,
          pad: '26px 18px 18px',
          inner: `<div style="height: 180px; border-radius: 14px; background: ${T.wash.sky[0]}; position: relative; overflow: hidden;">
          <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M30 150c40-90 220-90 260 0" stroke="${T.pink}" stroke-width="12"></path>
            <path d="M52 150c36-70 180-70 216 0" stroke="${T.yellow}" stroke-width="12"></path>
            <path d="M74 150c30-52 142-52 172 0" stroke="${T.green}" stroke-width="12"></path>
            <path d="M96 150c24-34 104-34 128 0" stroke="${T.blue}" stroke-width="12"></path>
            <circle cx="60" cy="52" r="16" fill="${T.yellow}"></circle>
            <path d="M60 24v10M60 70v10M32 52h10M78 52h10" stroke="${T.yellow}" stroke-width="4"></path>
            <path d="M0 150h320" stroke="${T.green}" stroke-width="8"></path>
          </svg>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 0 6px;">
          ${avatar('HI', 'lavender', 32)}
          <div style="display: flex; flex-direction: column; flex-grow: 1;"><span style="font-size: 14px; font-weight: 800; color: ${T.ink};">Haziq painted a rainbow</span><span style="font-size: 12px; font-weight: 600; color: ${T.muted3};">Pinned to the art wall yesterday</span></div>
          ${icon('pin', 18, T.muted4)}
        </div>`,
        })}

        ${note({
          bg: T.wash.sky[0],
          rotate: -1.4,
          pin: T.orange,
          pad: '30px 24px 22px',
          inner: `<div style="display: flex; align-items: center; justify-content: space-between;"><span style="${FUN} font-size: 20px; color: ${T.ink};">Three letters in the tray</span>${icon('mail', 22, T.wash.sky[1])}</div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.75); border-radius: 14px; padding: 10px 12px;"><div style="display: flex; flex-direction: column; flex-grow: 1;"><span style="font-size: 14px; font-weight: 800; color: ${T.ink};">Puan Farah</span><span style="font-size: 12px; font-weight: 600; color: ${T.muted2};">Asking about a place for Adam, 4, in January</span></div><span style="font-size: 11px; font-weight: 800; color: ${T.muted3};">Yesterday</span></div>
          <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.75); border-radius: 14px; padding: 10px 12px;"><div style="display: flex; flex-direction: column; flex-grow: 1;"><span style="font-size: 14px; font-weight: 800; color: ${T.ink};">Mr Gopal</span><span style="font-size: 12px; font-weight: 600; color: ${T.muted2};">Twins, 5, moving from Penang</span></div><span style="font-size: 11px; font-weight: 800; color: ${T.muted3};">Tue</span></div>
          <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.75); border-radius: 14px; padding: 10px 12px;"><div style="display: flex; flex-direction: column; flex-grow: 1;"><span style="font-size: 14px; font-weight: 800; color: ${T.ink};">Cik Nadia</span><span style="font-size: 12px; font-weight: 600; color: ${T.muted2};">Would like a tour</span></div><span style="font-size: 11px; font-weight: 800; color: ${T.muted3};">Mon</span></div>
        </div>
        ${link('Reply to all three')}`,
        })}
      </div>
    </div>

    <div style="margin-top: auto; display: flex; align-items: center; gap: 18px; font-size: 13px; font-weight: 700; color: ${T.muted3}; padding-top: 8px;">
      <span>If you need the numbers:</span>
      <span style="color: ${T.muted};">26 children</span><span>&middot;</span>
      <span style="color: ${T.muted};">3 classes</span><span>&middot;</span>
      <span style="color: ${T.muted};">94% attendance this month</span><span>&middot;</span>
      <span style="color: ${T.muted};">85% of fees in</span>
      <span style="margin-left: auto;">${link('Reports and charts')}</span>
    </div>
  </div>`
}
