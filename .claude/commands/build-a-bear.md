TRIGGER when: user mentions AdminBear, bear mascot, AdminBearIcon, AdminBearLogo, AdminBearSpeechBubble, idle animation, sidebar bear, bear eyes, zzz bubble, or asks to add, modify, or fix the bear in any way.

# build-a-bear — Admin Bear Mascot

The AdminBear is a 3-file system. Each file has a single responsibility — never collapse them.

## File Map

| File                        | Path                | Role                                                                                    |
| --------------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `AdminBearIcon.tsx`         | `components/admin/` | Thin wrapper around `components/ui/StickerBear.tsx` (blue bow). No state, no animation. |
| `AdminBearLogo.tsx`         | `components/admin/` | Idle doze easter egg. Wraps Icon + Bubble with 4-state machine.                         |
| `AdminBearSpeechBubble.tsx` | `components/admin/` | Admin-only speech bubble. Renders zzz or wake message.                                  |

## AdminBearIcon

- Renders `<StickerBear size eyeState bowColor={BEAR_BOW_BLUE} />` — the drawing lives in `components/ui/StickerBear.tsx` (viewBox `32×32`, round sticker teddy, same shapes as the `.cursor-bear` cursor in `index.css`). Change the face there, never here.
- Blue bow (`#4D96FF`) because the admin bear always sits on a kinder-orange tile; every other bear uses the default orange bow.
- Prop `eyeState?: 'open' | 'half' | 'closed'` (type `BearEyeState` from StickerBear):
  - `open` → round eyes, `r=1.4`
  - `half` → flattened ellipses `ry=0.8` (droopy)
  - `closed` → gentle downward arcs (relaxed lids)
- StickerBear also has `mood="grin"` (happy arc eyes + tongue, the hover cursor) — not used by the admin bear.
- Used in: AdminBearLogo (desktop sidebar), AdminLayout mobile top bar, LoginPage

## AdminBearLogo — 4-State Idle Machine

```
active → (90s idle) → sleepy → (180s total idle) → asleep → (any activity) → waking → (400ms) → active
```

| State    | Eyes     | Animation              | Notes                                 |
| -------- | -------- | ---------------------- | ------------------------------------- |
| `active` | `open`   | none                   | resets on any document activity       |
| `sleepy` | `half`   | gentle 3s sway ±2.5deg | triggered at 90s idle                 |
| `asleep` | `closed` | deep 4s nod ±5–7deg    | zzz bubble visible                    |
| `waking` | `open`   | 0.4s shake             | 400ms, then wake message shows for 2s |

Activity events on `document`: `mousemove`, `mousedown`, `keydown`, `click`, `scroll`, `touchstart` — debounced 200ms.

All keyframes live in `dangerouslySetInnerHTML` — no external CSS file needed.

### CRITICAL — Timer Pattern

`wakeMsgTimerRef` controls how long the wake message shows after the bear wakes up.

**NEVER clear `wakeMsgTimerRef` inside Effect 2's cleanup.** Effect 2 re-runs whenever `phase` changes. If you clear it there, the timer is cancelled the moment `phase` flips to `active` — the wake message never shows.

Only clear `wakeMsgTimerRef` in **Effect 1's unmount cleanup** (component teardown), not in any phase-change effect.

## AdminBearSpeechBubble

Props: `variant: 'sleeping' | 'waking' | 'hidden'`, `message?: string`

**Positioning:**

- `absolute top-full left-0 mt-1` — below the orange square, anchored to its left edge
- Bear sits at the top of the sidebar, so `bottom-full` goes off-screen — always use `top-full`

**Tail points UP** (not down): SVG `top: -6`, `points="0,7 6,0 12,7"` at `left-5`

**Sleeping animation:** three staggered z/z/Z spans using `admin-bear-zzz` keyframe (floats up 5px, delays 0s / 0.3s / 0.6s)

Always: `pointer-events-none z-10` — floats above nav items, never blocks clicks.

## Mobile vs Desktop Rule

| Context         | Component            | Idle Logic            | Bubble |
| --------------- | -------------------- | --------------------- | ------ |
| Desktop sidebar | `AdminBearLogo`      | Yes (4-state machine) | Yes    |
| Mobile top bar  | `AdminBearIcon` only | No                    | No     |

Never add idle logic or bubble to the mobile icon.

## Orange Square

The orange rounded-square wrapper is a `div` in `AdminLayout.tsx` — it is NOT part of `AdminBearIcon` or `AdminBearLogo`. Do not move it into the bear components.
