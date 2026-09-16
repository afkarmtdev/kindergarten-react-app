// Direction C: "Day plan". Calm and editorial: the day as a timeline on the
// left, one card per class on the right, and a short list of things waiting.
// The least playful of the three, the fastest to scan.
import { T, FUN, CLASSES, STATUS_RING, avatar, btn, link, icon, pill } from './shared.mjs'

function step({ time, title, detail, state, iconName }) {
  // state: done | now | next
  const dot =
    state === 'done'
      ? `<div style="width: 30px; height: 30px; border-radius: 999px; background: ${T.green}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon('check', 16, '#FFFFFF', 3)}</div>`
      : state === 'now'
        ? `<div style="width: 30px; height: 30px; border-radius: 999px; background: ${T.orange}; box-shadow: 0 0 0 6px ${T.wash.peach[0]}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon(iconName, 16, '#FFFFFF')}</div>`
        : `<div style="width: 30px; height: 30px; border-radius: 999px; background: ${T.card}; border: 2px solid ${T.border}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon(iconName, 15, T.muted4)}</div>`
  const titleColor = state === 'next' ? T.muted : T.ink
  return `<div style="display: flex; gap: 16px; padding: 4px 0 26px; position: relative;">
        <div style="width: 52px; flex-shrink: 0; font-size: 12px; font-weight: 800; color: ${T.muted3}; padding-top: 7px; text-align: right;">${time}</div>
        ${dot}
        <div style="display: flex; flex-direction: column; gap: 3px; padding-top: 4px;">
          <span style="font-size: 15px; font-weight: 800; color: ${titleColor};">${title}</span>
          ${detail ? `<span style="font-size: 13px; font-weight: 600; color: ${T.muted2}; line-height: 1.45;">${detail}</span>` : ''}
        </div>
      </div>`
}

function classCard(cls, reportDone) {
  const inCount = cls.kids.filter((k) => k[3] === 'present' || k[3] === 'late').length
  const away = cls.kids.filter((k) => k[3] === 'absent' || k[3] === 'excused')
  const faces = cls.kids.map((k) => avatar(k[1], k[2], 34, STATUS_RING[k[3]])).join('')
  const awayText = away.length
    ? away.map((k) => `${k[0].split(' ')[0]} is ${k[3] === 'absent' ? 'away' : 'excused'}`).join(', ')
    : 'Everyone is in'
  const [bg, fg] = T.wash[cls.wash]
  const report = reportDone
    ? pill('Daily report written', T.wash.mint[0], T.wash.mint[1])
    : pill('Daily report to do', T.wash.peach[0], T.wash.peach[1])
  return `<div style="background: ${T.card}; border: 2px solid ${T.border}; border-radius: 24px; padding: 22px 26px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: ${bg}; display: flex; align-items: center; justify-content: center;">${icon('sun', 22, fg)}</div>
          <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1;">
            <span style="${FUN} font-size: 20px; color: ${T.ink};">${cls.name}</span>
            <span style="font-size: 13px; font-weight: 600; color: ${T.muted2};">${cls.teacher} &middot; ${inCount} of ${cls.kids.length} in &middot; ${awayText}</span>
          </div>
          ${report}
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; padding: 2px 0 2px 2px;">${faces}</div>
        <div style="display: flex; gap: 10px;">${btn('Register', 'small')}${btn('Daily report', 'small')}${btn('Portfolio', 'small')}</div>
      </div>`
}

export function bodyC() {
  return `  <div style="flex-grow: 1; padding: 40px 44px; display: flex; gap: 36px; min-width: 0;">

    <div style="width: 400px; flex-shrink: 0; display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${T.muted3};">Friday, 12 September</span>
        <h1 style="margin: 0; ${FUN} font-size: 34px; line-height: 1.1; color: ${T.ink};">Today at Sunflower</h1>
        <span style="font-size: 15px; font-weight: 600; color: ${T.muted};">It is 10:20. Snack is next, and it is a birthday one.</span>
      </div>

      <div style="background: ${T.card}; border: 2px solid ${T.border}; border-radius: 24px; padding: 24px 22px 4px; position: relative;">
        <div style="position: absolute; left: 105px; top: 40px; bottom: 40px; width: 2px; background: ${T.track};"></div>
        <div style="position: relative;">
          ${step({ time: '7:30', title: 'Gates open', detail: '', state: 'done', iconName: 'door' })}
          ${step({ time: '9:00', title: 'Register taken', detail: '24 in. Mei Wen away, Rayyan excused, Daniel late.', state: 'done', iconName: 'calendar' })}
          ${step({ time: '10:30', title: 'Snack and Nur Zara’s cake', detail: 'Her mum is bringing it at 10. Photos for the gallery.', state: 'now', iconName: 'cake' })}
          ${step({ time: '12:00', title: 'Lunch, then nap', detail: '', state: 'next', iconName: 'moon' })}
          ${step({ time: '15:30', title: 'Daily reports due', detail: 'Little Stars still to write.', state: 'next', iconName: 'clipboard' })}
          ${step({ time: '17:00', title: 'Pick-up', detail: 'Sports day kit list goes home in bags.', state: 'next', iconName: 'users' })}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <span style="${FUN} font-size: 18px; color: ${T.ink};">Waiting on you</span>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; font-weight: 700; color: ${T.muted};">
          <div style="display: flex; align-items: center; gap: 10px;">${icon('wallet', 18, T.wash.peach[1])}<span style="flex-grow: 1;">Two fee reminders, RM 720 in total</span>${link('Send')}</div>
          <div style="display: flex; align-items: center; gap: 10px;">${icon('mail', 18, T.wash.sky[1])}<span style="flex-grow: 1;">Three enquiries, newest from Puan Farah</span>${link('Reply')}</div>
          <div style="display: flex; align-items: center; gap: 10px;">${icon('brush', 18, T.wash.lavender[1])}<span style="flex-grow: 1;">Two portfolio entries need a photo</span>${link('Open')}</div>
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px;">
        <span style="${FUN} font-size: 22px; color: ${T.ink};">Classes</span>
        ${btn('Take the register')}
      </div>
      ${classCard(CLASSES[0], true)}
      ${classCard(CLASSES[1], true)}
      ${classCard(CLASSES[2], false)}

      <div style="display: flex; align-items: center; gap: 14px; padding: 18px 26px; background: ${T.wash.sky[0]}; border-radius: 20px;">
        ${icon('chart', 22, T.wash.sky[1])}
        <span style="flex-grow: 1; font-size: 14px; font-weight: 700; color: ${T.muted};">This month so far: attendance 94%, fees 85% collected. Both a little up on August.</span>
        ${link('Reports')}
      </div>
    </div>
  </div>`
}
