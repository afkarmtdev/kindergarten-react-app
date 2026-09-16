/**
 * Reload curtain hand-off.
 *
 * When the landing page reloads from the update banner, `ReloadCurtain` drops a
 * sky-wash curtain over the page while the new service worker installs (0.5 to
 * 12 s), and the hard reload that follows wipes the DOM. To hide the white flash
 * the old build leaves a flag in sessionStorage; the new build finds it on its
 * first render, paints the same curtain already down, and lifts it.
 *
 * sessionStorage is per tab and dies with it, so a flag can never leak into a
 * later visit. Every access is wrapped because private windows and blocked
 * site data make the accessor throw.
 *
 * Reading and clearing are separate on purpose: `hasCurtainHandoff` is pure so
 * it can live in a useState initializer, which React StrictMode calls twice in
 * development. A read-and-clear there would hand the second call `false`.
 */

export const CURTAIN_HANDOFF_KEY = 'kc-curtain'

/**
 * How long the old build keeps the curtain down before it asks for the reload,
 * so the drop (620 ms) and the bear pop (300 ms delay + 520 ms) finish even when
 * there is no waiting worker and the reload would otherwise be instant.
 */
export const CURTAIN_ENTER_MIN_MS = 1100

/** How long the exit curtain shows the grinning bear before it lifts. */
export const CURTAIN_EXIT_HOLD_MS = 900

/** How often the waiting bear blinks, and for how long the eyes stay shut. */
export const CURTAIN_BLINK_EVERY_MS = 3200
export const CURTAIN_BLINK_FOR_MS = 160

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** The curtain plays on the public landing page only. */
export function isLandingPath(pathname: string): boolean {
  return pathname === '/' || pathname === ''
}

/** Old build, just before it reloads: leave the flag for the new build. */
export function markCurtainHandoff(storage: StorageLike | undefined): void {
  try {
    storage?.setItem(CURTAIN_HANDOFF_KEY, '1')
  } catch {
    // storage unavailable: the new build simply boots without the exit curtain
  }
}

/** New build, first render: true when the previous page left the flag. Pure. */
export function hasCurtainHandoff(storage: StorageLike | undefined): boolean {
  try {
    return storage?.getItem(CURTAIN_HANDOFF_KEY) === '1'
  } catch {
    return false
  }
}

/** Clears the flag so a later plain reload of the same tab starts clean. */
export function clearCurtainHandoff(storage: StorageLike | undefined): void {
  try {
    storage?.removeItem(CURTAIN_HANDOFF_KEY)
  } catch {
    // nothing to clean up if storage is unavailable
  }
}
