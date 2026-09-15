# Warm Storybook — design reference

Chosen visual direction for KinderCare (September 2026). Live canvas:
https://claude.ai/code/artifact/6319a5a4-6d72-44e0-97a9-d7633ff4c1a4

The `.dc.html` files in this folder are the artboard sources for that canvas (landing, admin dashboard, parent portal, each in light and dark). `PosterPop` and `BoobaSoft` are the two unchosen directions kept for comparison.

## The idea in one line

Booba's airy structure and scalloped section edges, with the warmth of the WhatsApp poster dialled to about 70%. Light mode is cream and pastel; dark mode keeps the starry galaxy. Same shapes in both modes, only the grounds change.

## Tokens

Existing brand brights stay untouched: `kinder-orange #FF6B35`, `kinder-blue #4D96FF`, `kinder-green #6BCB77`, `kinder-yellow #FFD93D`, `kinder-purple #C77DFF`, `kinder-pink #FF85A2`.

New section-wash tokens (light -> dark). Light keeps each hue as a pastel. Dark is a nebula tint at the lightness and chroma of the night-sky navy: sky and lavender keep their hue, while the warm hues are pulled toward the cosmic side (mint -> teal, blush -> magenta-violet) or dropped to a warm charcoal (peach, butter), because a dark orange, yellow, pink or green at full chroma reads as brown, olive, maroon or chalkboard against the galaxy (retuned 2026-09-16):

| Wash     | Light     | Dark      | Dark reads as       | Wash text (light -> dark) |
| -------- | --------- | --------- | ------------------- | ------------------------- |
| sky      | `#E3EEFF` | `#16233F` | night navy          | `#2F6FD6` -> `#7EB3FF`    |
| mint     | `#E4F5E7` | `#072A2E` | deep teal           | `#3E9D4C` -> `#7ED88A`    |
| butter   | `#FFF6D6` | `#272219` | warm charcoal       | `#D9A400` -> `#FFD93D`    |
| blush    | `#FFE6EC` | `#31173E` | magenta-violet plum | `#E0567A` -> `#FF9CB5`    |
| lavender | `#F1E4FF` | `#2A1F45` | violet              | `#9B4FE0` -> `#D3A4FF`    |
| peach    | `#FFE9DF` | `#2C1F1C` | warm charcoal       | `#E85D22` -> `#FF8A5B`    |
| ocean    | `#DEF4F6` | `#0C2A3E` | steel blue          | `#1E8A96` -> `#5ED6E0`    |

Exceptions on the landing page, where a wash fills a whole band: Our Story is butter in light but `dark:bg-wash-ocean` in dark, and the Numbers band is peach in light but `dark:bg-wash-ocean` in dark, because the warm charcoals read as mud under a section's glow and pattern. Their lead-in waves carry the same `dark:fill-wash-ocean`, and `SectionBackdrop` takes `darkTint="ocean"` so the pattern ink follows. The promise strip is `kinder-pink` in light and `dark:bg-wash-blush` in dark (a bright pink band glows on top of the galaxy instead of sitting inside it); the careers wave feeding it carries the same `dark:fill-wash-blush`. `SpotlightGlow` takes `darkColor` for the same reason: a yellow glow over a night tint turns it green or brown, so the numbers band glows purple and careers glows cyan in dark.

Grounds: page `#FFFAF5` -> `gray-950`, cards `#FFFFFF` -> `gray-900`, borders `#ECDED0` -> `gray-800`, ink `#342A22` -> `gray-50`. These already exist as the warm-gray CSS variables in `frontend/src/index.css`.

## Rules

- Headings and big numbers: Fredoka 700 (`font-fun`). Body and labels: Nunito.
- Two-tone headline: ink plus one bright word, optional hand-drawn underline.
- Sticker badges: bright fill, Fredoka uppercase, 3px white border (gray-900 in dark), slight rotation. One per section at most.
- Section grounds are washes, never saturated full-colour blocks. Brights are for buttons, stickers, icon strokes, and chart series only.
- Section joins use the scallop wave; the wave fill is the next section's wash.
- Photos sit in blob masks (`border-radius: 48% 52% 42% 58% / 55% 40% 60% 45%`).
- Cards: `rounded-2xl`/`rounded-3xl`, 2px border, no drop shadow except floating chips.
- Icon tiles: 40 to 56px, rounded-2xl, wash background, matching wash-text stroke colour.
- Dark mode galaxy: mesh gradient plus purple/teal/pink radial glows, tiny stars, one shooting star. Landing: behind nav and hero, faint stars inside sky bands. Portal: faint stars across the page, night-sky greeting card with a moon. Admin: inside the welcome banner only.
- Primary button: `kinder-orange` pill with a soft orange shadow. Secondary: white pill with 2px border.
