// ──────────── WIP ────────────
// ─── Astronaut Helmet — TLOU2-style hard-shell for BaseBearMascot ────────────
// Hard outer shell with a visor window (NOT a fishbowl).
// The shell is opaque; only the visor rectangle (x=14..54, y=8..42) shows the face.
//
// Shell outer silhouette follows the same 26-row circle (r=34, centre at (34,16))
// as the old dome. The visor cutout is left empty so the face renders through.
//
// Draw order (all rendered inside the bear's <svg>):
//   1. <AstronautHelmetDome />        — BEFORE ears/head (opaque shell)
//   2.  [ears, head, body, legs drawn by BaseBearMascot]
//   3. <AstronautHelmetGlassOverlay/> — AFTER face; visor tint + gold visor frame
//   4. <AstronautHelmetCollar />      — AFTER legs (collar ring)
//
// Toggle with:  <BaseBearMascot helmet />  /  <BaseBearMascot />

const SHELL = '#E0ECF4' // off-white / light blue-grey (TLOU2 suit colour)
const SHELL_LO = '#AABFCC' // slightly darker — lower half and sides
const GOLD = '#D4A030' // amber-gold visor ring
const GOLD_HI = '#F0C050' // brighter gold highlight stripe

// ─── 1. Shell body (drawn before face — face renders on top in visor area) ───
export function AstronautHelmetDome() {
  return (
    <>
      {/* ── Top section: full-width rows above visor opening (y=-18..y=7) ── */}
      <rect x="26" y="-18" width="16" height="2" fill={SHELL} />
      <rect x="20" y="-16" width="28" height="2" fill={SHELL} />
      <rect x="16" y="-14" width="36" height="2" fill={SHELL} />
      <rect x="13" y="-12" width="42" height="2" fill={SHELL} />
      <rect x="11" y="-10" width="46" height="2" fill={SHELL} />
      <rect x="9" y="-8" width="50" height="2" fill={SHELL} />
      <rect x="7" y="-6" width="54" height="2" fill={SHELL} />
      <rect x="6" y="-4" width="56" height="2" fill={SHELL} />
      <rect x="5" y="-2" width="58" height="2" fill={SHELL} />
      <rect x="3" y="0" width="62" height="4" fill={SHELL} />
      <rect x="2" y="4" width="64" height="2" fill={SHELL} />
      <rect x="1" y="6" width="66" height="2" fill={SHELL} />

      {/* ── Side sections: left + right strips flanking visor opening x=14..54 ── */}
      {/* y=8..9  (dome row y=6: x=1 right=67) */}
      <rect x="1" y="8" width="13" height="2" fill={SHELL} />
      <rect x="54" y="8" width="13" height="2" fill={SHELL} />
      {/* y=10..15 (dome x=0, right=68, h=6) */}
      <rect x="0" y="10" width="14" height="6" fill={SHELL} />
      <rect x="54" y="10" width="14" height="6" fill={SHELL} />
      {/* y=16..21 (dome x=0, right=68, h=6) — slightly darker as eye-level shadow */}
      <rect x="0" y="16" width="14" height="6" fill={SHELL_LO} />
      <rect x="54" y="16" width="14" height="6" fill={SHELL_LO} />
      {/* y=22..25 (dome x=1, right=67, h=4) */}
      <rect x="1" y="22" width="13" height="4" fill={SHELL_LO} />
      <rect x="54" y="22" width="13" height="4" fill={SHELL_LO} />
      {/* y=26 (dome x=2, right=66) */}
      <rect x="2" y="26" width="12" height="2" fill={SHELL_LO} />
      <rect x="54" y="26" width="12" height="2" fill={SHELL_LO} />
      {/* y=28..31 (dome x=3, right=65, h=4) */}
      <rect x="3" y="28" width="11" height="4" fill={SHELL_LO} />
      <rect x="54" y="28" width="11" height="4" fill={SHELL_LO} />
      {/* y=32 (dome x=5, right=63) */}
      <rect x="5" y="32" width="9" height="2" fill={SHELL_LO} />
      <rect x="54" y="32" width="9" height="2" fill={SHELL_LO} />
      {/* y=34 (dome x=6, right=62) */}
      <rect x="6" y="34" width="8" height="2" fill={SHELL_LO} />
      <rect x="54" y="34" width="8" height="2" fill={SHELL_LO} />
      {/* y=36 (dome x=7, right=61) */}
      <rect x="7" y="36" width="7" height="2" fill={SHELL_LO} />
      <rect x="54" y="36" width="7" height="2" fill={SHELL_LO} />
      {/* y=38 (dome x=9, right=59) */}
      <rect x="9" y="38" width="5" height="2" fill={SHELL_LO} />
      <rect x="54" y="38" width="5" height="2" fill={SHELL_LO} />
      {/* y=40 (dome x=11, right=57) */}
      <rect x="11" y="40" width="3" height="2" fill={SHELL_LO} />
      <rect x="54" y="40" width="3" height="2" fill={SHELL_LO} />
      {/* y=42 (dome x=13, right=55) — 1-px nubs close the sides */}
      <rect x="13" y="42" width="1" height="2" fill={SHELL_LO} />
      <rect x="54" y="42" width="1" height="2" fill={SHELL_LO} />

      {/* ── Gap fills: visor bottom corners at y=44 where dome narrows past visor ── */}
      <rect x="14" y="44" width="2" height="2" fill={SHELL_LO} />
      <rect x="52" y="44" width="2" height="2" fill={SHELL_LO} />

      {/* ── Bottom section: full-width rows below visor (y=44..48) ── */}
      <rect x="16" y="44" width="36" height="2" fill={SHELL_LO} />
      <rect x="20" y="46" width="28" height="2" fill={SHELL_LO} />
      <rect x="26" y="48" width="16" height="2" fill={SHELL_LO} />

      {/* ── Crown gloss highlight ── */}
      <rect x="20" y="-16" width="28" height="2" fill="white" opacity="0.24" />
      <rect x="16" y="-14" width="36" height="2" fill="white" opacity="0.18" />
      <rect x="13" y="-12" width="42" height="2" fill="white" opacity="0.14" />
      <rect x="11" y="-10" width="46" height="2" fill="white" opacity="0.10" />
      <rect x="9" y="-8" width="50" height="2" fill="white" opacity="0.06" />
    </>
  )
}

// ─── 2. Visor glass tint + gold frame (drawn after face) ─────────────────────
// Visor area: x=14..54, y=8..42
export function AstronautHelmetGlassOverlay() {
  return (
    <>
      {/* Glass tint — light blue wash over visor area */}
      <rect x="14" y="8" width="40" height="36" fill="#7EC4E0" opacity="0.22" />

      {/* Visor frame — amber-gold ring around visor opening */}
      <rect x="14" y="8" width="40" height="2" fill={GOLD} />
      <rect x="14" y="42" width="40" height="2" fill={GOLD} />
      <rect x="14" y="10" width="2" height="32" fill={GOLD} />
      <rect x="52" y="10" width="2" height="32" fill={GOLD} />

      {/* Frame top highlight — brighter gold stripe on leading edge */}
      <rect x="14" y="8" width="40" height="1" fill={GOLD_HI} opacity="0.70" />
      <rect x="14" y="10" width="1" height="10" fill={GOLD_HI} opacity="0.45" />

      {/* Visor reflection — white highlights top-left of glass */}
      <rect x="18" y="12" width="8" height="10" fill="white" opacity="0.18" />
      <rect x="18" y="12" width="16" height="3" fill="white" opacity="0.26" />
      <rect x="34" y="10" width="6" height="4" fill="white" opacity="0.14" />
    </>
  )
}

// ─── 3. Collar ring (drawn after body/legs) ───────────────────────────────────
export function AstronautHelmetCollar() {
  return (
    <>
      {/* Outer collar ring — wide dark locking band */}
      <rect x="10" y="50" width="48" height="10" fill="#1A2C3A" />
      {/* Inner ring face */}
      <rect x="14" y="51" width="40" height="7" fill="#3A5668" />
      {/* Highlight stripe */}
      <rect x="16" y="51" width="36" height="2" fill="#6A8A9C" />
      {/* Shine */}
      <rect x="18" y="52" width="32" height="2" fill="#9ABBC8" />
      {/* Bottom shadow */}
      <rect x="14" y="58" width="40" height="2" fill="#0E1E28" />
    </>
  )
}
