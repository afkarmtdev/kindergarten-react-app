// Direction A: "Morning briefing". The day is told in sentences, the numbers
// live inside them, and the only boxes on the page are things you can act on.
import { T, FUN, CLASSES, STATUS_RING, avatar, btn, link, icon, tile } from './shared.mjs'

const allKids = CLASSES.flatMap((c) => c.kids)
const counts = allKids.reduce((m, k) => ((m[k[3]] = (m[k[3]] ?? 0) + 1), m), {})

function todoRow({ done, iconName, wash, title, detail, action }) {
  const titleStyle = done
    ? `font-size: 15px; font-weight: 800; color: ${T.muted4}; text-decoration: line-through;`
    : `font-size: 15px; font-weight: 800; color: ${T.ink};`
  const box = done
    ? `<div style="width: 26px; height: 26px; border-radius: 999px; background: ${T.green}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon('check', 15, '#FFFFFF', 3)}</div>`
    : `<div style="width: 26px; height: 26px; border-radius: 999px; border: 2px solid ${T.border}; background: ${T.card}; flex-shrink: 0;"></div>`
  return `<div style="display: flex; align-items: center; gap: 16px; padding: 16px 0; border-top: 2px solid ${T.track};">
        ${box}
        ${tile(iconName, wash, 40)}
        <div style="display: flex; flex-direction: column; gap: 3px; flex-grow: 1; min-width: 0;">
          <span style="${titleStyle}">${title}</span>
          <span style="font-size: 13px; font-weight: 600; color: ${T.muted2};">${detail}</span>
        </div>
        ${action ? btn(action, 'small') : ''}
      </div>`
}

function dayTile(label, date, count, note, today) {
  const bg = today ? T.wash.sky[0] : T.card
  const border = today ? T.wash.sky[0] : T.border
  const noteHtml = note
    ? `<span style="font-size: 11px; font-weight: 800; color: ${T.wash.peach[1]}; background: ${T.wash.peach[0]}; padding: 3px 8px; border-radius: 999px; align-self: flex-start; white-space: nowrap;">${note}</span>`
    : `<span style="font-size: 11px; font-weight: 700; color: ${T.muted4};">${count}</span>`
  return `<div style="flex: 1 1 0; background: ${bg}; border: 2px solid ${border}; border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; min-width: 0;">
        <div style="display: flex; align-items: baseline; gap: 6px;"><span style="${FUN} font-size: 20px; color: ${today ? T.wash.sky[1] : T.ink};">${date}</span><span style="font-size: 12px; font-weight: 800; color: ${T.muted3};">${label}</span></div>
        ${noteHtml}
      </div>`
}

export function bodyA() {
  const faces = allKids
    .map((k) => avatar(k[1], k[2], 40, STATUS_RING[k[3]]))
    .join('\n          ')

  return `  <div style="flex-grow: 1; padding: 40px 44px; display: flex; gap: 32px; min-width: 0;">
    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 32px; min-width: 0;">

      <div style="display: flex; flex-direction: column; gap: 12px; padding-right: 24px;">
        <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${T.muted3};">Friday, 12 September</span>
        <h1 style="margin: 0; ${FUN} font-size: 40px; line-height: 1.05; color: ${T.ink};">Good morning, Aina</h1>
        <p style="margin: 6px 0 0; font-size: 18px; line-height: 1.55; font-weight: 600; color: ${T.muted}; max-width: 620px; text-wrap: pretty;">Twenty-four of your 26 children are in today. <strong style="color: ${T.ink};">Mei Wen</strong> is away at the dentist and <strong style="color: ${T.ink};">Daniel Raj</strong> came in a little late. <strong style="color: ${T.ink};">Nur Zara</strong> turns five today, so there is cake at snack time.</p>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 10px;">${btn('Take the register')}${btn('Write daily reports', 'secondary')}</div>
      </div>

      <div style="background: ${T.card}; border: 2px solid ${T.border}; border-radius: 24px; padding: 22px 26px 6px; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px;">
          <span style="${FUN} font-size: 20px; color: ${T.ink};">Before the day ends</span>
          <span style="font-size: 12px; font-weight: 800; color: ${T.muted3};">3 things left</span>
        </div>
        ${todoRow({ done: false, iconName: 'clipboard', wash: 'lavender', title: 'Write today’s daily reports', detail: 'Sunflower and Rainbow are done. Little Stars still needs one.', action: 'Open Little Stars' })}
        ${todoRow({ done: false, iconName: 'wallet', wash: 'peach', title: 'Two families are overdue on fees', detail: 'Daniel Raj (RM 480) and Haziq Iman (RM 240), both due last Friday.', action: 'Send reminders' })}
        ${todoRow({ done: false, iconName: 'mail', wash: 'sky', title: 'Three enquiries are waiting for a reply', detail: 'The newest is from Puan Farah, yesterday at 4:12 pm.', action: 'Reply' })}
        ${todoRow({ done: true, iconName: 'cake', wash: 'butter', title: 'Sign Nur Zara’s birthday card', detail: 'Done this morning.', action: '' })}
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="${FUN} font-size: 20px; color: ${T.ink};">This week</span>
          ${link('Open calendar')}
        </div>
        <div style="display: flex; gap: 12px;">
          ${dayTile('Mon', '8', '25 in', '', false)}
          ${dayTile('Tue', '9', '26 in', '', false)}
          ${dayTile('Wed', '10', '24 in', 'Sports day', false)}
          ${dayTile('Thu', '11', '25 in', '', false)}
          ${dayTile('Fri', '12', '24 in', 'Nur’s birthday', true)}
        </div>
      </div>
    </div>

    <div style="width: 392px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px;">

      <div style="background: ${T.card}; border: 2px solid ${T.border}; border-radius: 24px; padding: 22px 24px; display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="${FUN} font-size: 20px; color: ${T.ink};">Who is in today</span>
          <span style="font-size: 12px; font-weight: 800; color: ${T.muted3};">Updated 9:04 am</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px 10px; justify-items: center; padding: 6px 0;">
          ${faces}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; font-weight: 700; color: ${T.muted2};">
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 999px; background: ${T.green};"></span>${counts.present} present</span>
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 999px; background: ${T.yellow};"></span>${counts.late} late</span>
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 999px; background: ${T.blue};"></span>${counts.excused} excused</span>
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 999px; background: ${T.pink};"></span>${counts.absent} away</span>
        </div>
      </div>

      <div style="background: ${T.wash.mint[0]}; border-radius: 24px; padding: 22px 24px; display: flex; flex-direction: column; gap: 12px;">
        <span style="${FUN} font-size: 20px; color: ${T.ink};">Fees this month</span>
        <p style="margin: 0; font-size: 15px; line-height: 1.5; font-weight: 600; color: ${T.muted};">RM 7,920 of RM 9,360 has come in. Two families are overdue, and the rest is not due until the 20th.</p>
        <div style="height: 10px; border-radius: 999px; background: rgba(255,255,255,0.7);"><div style="width: 85%; height: 100%; border-radius: 999px; background: ${T.green};"></div></div>
        ${link('See who has paid')}
      </div>

      <div style="background: ${T.card}; border: 2px solid ${T.border}; border-radius: 24px; padding: 18px 24px; display: flex; align-items: center; gap: 14px;">
        ${tile('chart', 'sky', 40)}
        <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1;">
          <span style="font-size: 14px; font-weight: 800; color: ${T.ink};">Attendance is at 94%</span>
          <span style="font-size: 12px; font-weight: 600; color: ${T.muted2};">A touch better than August. Trends and fee charts live in Reports.</span>
        </div>
        ${link('Reports')}
      </div>
    </div>
  </div>`
}
