// The app's mascot under neutral names. Every consumer imports from here, never
// from StickerParrot or StickerBear directly, so changing the mascot is one edit
// in this file: both drawings take the same props, and the parrot's export names
// mirror the bear's (Parrot/PARROT in place of Bear/BEAR).
//
// Active: the sticker parrot "Little seed" (October 2026). To bring back the
// archived sticker teddy, replace the export below with this one, then follow
// docs/design/mascot-archive/README.md for the favicon, PWA icons and cursor:
//
//   export {
//     StickerBear as Mascot,
//     BEAR_BOW_ORANGE as MASCOT_BOW_DEFAULT,
//     BEAR_BOW_BLUE as MASCOT_BOW_BLUE,
//     BEAR_BOW_PINK as MASCOT_BOW_PINK,
//     type BearEyeState as MascotEyeState,
//     type BearMood as MascotMood,
//     type BearGaze as MascotGaze,
//     type BearCap as MascotCap,
//     type BearFlag as MascotFlag,
//   } from './StickerBear'
export {
  StickerParrot as Mascot,
  PARROT_BOW_ORANGE as MASCOT_BOW_DEFAULT,
  PARROT_BOW_BLUE as MASCOT_BOW_BLUE,
  PARROT_BOW_PINK as MASCOT_BOW_PINK,
  type ParrotEyeState as MascotEyeState,
  type ParrotMood as MascotMood,
  type ParrotGaze as MascotGaze,
  type ParrotCap as MascotCap,
  type ParrotFlag as MascotFlag,
} from './StickerParrot'
