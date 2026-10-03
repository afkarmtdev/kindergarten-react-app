# Mascot archive

Since October 2026 the app mascot is **Little seed**, the sticker parrot Tadika Arif Ilmu chose (round 3, design T4): `frontend/src/components/ui/StickerParrot.tsx`, used everywhere through `frontend/src/components/ui/Mascot.tsx`. The sticker teddy that came before it is archived, not deleted, and can come back with the steps below.

## What is archived where

| What                    | Where                                                     | State                                                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bear drawing (React)    | `frontend/src/components/ui/StickerBear.tsx`              | Unchanged apart from an "archived" header comment. Same props as the parrot.                                                                                                                                                               |
| Landing-page cursor     | `.cursor-bear` rules in `frontend/src/index.css`          | Unchanged, marked archived. The landing page uses `.cursor-mascot` (the parrot) instead.                                                                                                                                                   |
| Favicon and PWA icons   | `docs/design/mascot-archive/bear/`                        | The bear's `favicon.svg`, `favicon.ico`, `apple-touch-icon-180x180.png`, `maskable-icon-512x512.png`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, copied byte for byte from `frontend/public/` before the parrot replaced them. |
| Full-body pixel bear    | `frontend/src/components/landing/bear/BaseBearMascot.tsx` | Untouched. Unused, kept for a future full-body mascot.                                                                                                                                                                                     |
| Shared mascot animation | `.bear-cap-settle` and `.bear-flag-wave` in `index.css`   | Still used by both drawings; the class names were kept so either mascot works with them.                                                                                                                                                   |

## Bring the bear back

1. **Drawing.** In `frontend/src/components/ui/Mascot.tsx`, replace the `export { ... } from './StickerParrot'` statement with the bear one quoted in that file's comment:

   ```ts
   export {
     StickerBear as Mascot,
     BEAR_BOW_ORANGE as MASCOT_BOW_DEFAULT,
     BEAR_BOW_BLUE as MASCOT_BOW_BLUE,
     BEAR_BOW_PINK as MASCOT_BOW_PINK,
     type BearEyeState as MascotEyeState,
     type BearMood as MascotMood,
     type BearGaze as MascotGaze,
     type BearCap as MascotCap,
     type BearFlag as MascotFlag,
   } from './StickerBear'
   ```

   Every consumer imports from `Mascot.tsx` and both drawings take the same props, so no other code changes. The parrot's export names mirror the bear's, so a case-preserving replace of `Parrot` with `Bear` in that one statement gives the same result.

2. **Favicon and PWA icons.** If you may want the parrot back later, first copy the seven parrot files out of `frontend/public/` into `docs/design/mascot-archive/parrot/`. Then, from the repo root, copy the bear's files back over them:

   ```bash
   cp docs/design/mascot-archive/bear/* frontend/public/
   ```

   These are the exact files the bear shipped with, so there is nothing to regenerate. If you edit the bear's `favicon.svg`, regenerate the PNGs and the `.ico` from it with `bunx pwa-assets-generator --preset minimal-2023 public/favicon.svg`, run inside `frontend/`. `index.html` and `vite.config.ts` use the same file names for both mascots, so they need no change.

3. **Cursor.** In `frontend/src/pages/landing/LandingPage.tsx`, change the root `className` from `cursor-mascot` to `cursor-bear`, and move the one-line "archived" comment in `index.css` from the bear rules to the `.cursor-mascot` rules.

4. **Docs.** Update the "Mascot" section and the project-structure lines in `CLAUDE.md`, and `.claude/commands/build-a-bear.md`, so they name the bear as the active drawing again.

5. **Check and ship.** Run `bun run lint`, `bun run typecheck` and `bun run test:frontend` from the repo root, then release with `/deploy` (it bumps `version.ts` and `public/version.json`) so open tabs and installed PWAs pick up the new icons through the update banner.

## Differences to know about

Both drawings share the 32x32 grid, head circle, eye positions, tilt, gaze range, nightcap shapes and the flag's pole, flag and arm path, so every state (doze, login gaze, grin, nightcap, Malaysia Day flag) behaves the same. What differs:

| Detail         | Bear                                 | Parrot                                                                           |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Bow constants  | `#FF6B35`, `#4D96FF`, `#FF85A2`      | `#F86705`, `#1A50A8` (the school's blue), `#FF85A2`                              |
| Bow knot       | Same colour as the bow               | Orange on blue leaves, blue on any other colour                                  |
| Nightcap       | Follows the bow, yellow sparkles     | Head blue whatever the bow, orange sparkles (blue on any other `capColor`)       |
| On the head    | Ears                                 | A sprout, hidden while the nightcap is on                                        |
| Flag arm       | Fur arm ending in a paw              | Darker blue wing (`#123C80`) ending in a round head-blue tip that grips the pole |
| Landing cursor | viewBox `0 0 32 32`, hotspot `20 24` | viewBox `-2 -3.75 36 36` so the sprout fits, hotspot `20 25` on the beak         |
