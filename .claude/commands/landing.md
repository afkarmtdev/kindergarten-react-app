TRIGGER when: user mentions the landing page, LandingPage, the public website, hero, Register Now, registration QR, RegisterSection, MobileCTABar, landing sections or bands, waves between sections, the mascot cursor (.cursor-mascot), Settings > Website, landing_content, useLandingContent, useLandingSection, or routes/schoolInfo.ts PUT /landing.

# landing — Landing Page Module

How the public marketing page is assembled, where its school-written content comes from, and what to touch when a section is added. Read before changing `LandingPage.tsx`, any `pages/landing/components/*`, a Settings > Website panel, or the `landing_content` schema. Visual rules (washes, depth stack, doodles, dark mode) are in `CLAUDE.md` under Design System; mascot rules are in `/build-a-bear`.

---

## Files

| Layer    | File                                                         | Role                                                                                     |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Shared   | `packages/types/index.ts`                                    | `LandingContent` and one interface per section (`LandingHero` ... `LandingRegistration`) |
| Backend  | `backend/src/lib/landingContent.ts`                          | Zod schema per section, `landingContentPatchSchema`, `sanitiseLandingPatch`, merge       |
| Backend  | `backend/src/routes/schoolInfo.ts`                           | `PUT /api/school-info/landing` patches one or more sections                              |
| Backend  | `backend/src/index.ts`                                       | `GET /api/public/school-info` (explicit columns, includes `landing_content`)             |
| Frontend | `frontend/src/lib/landingContent.ts`                         | `DEFAULT_LANDING_CONTENT`, `mergeLandingContent()` (fills partial or malformed values)   |
| Frontend | `frontend/src/hooks/useLandingContent.ts`                    | Resolves content for the current language; one `{ show, ... }` object per section        |
| Frontend | `frontend/src/hooks/useLandingSection.ts`                    | Settings: edit state + save for ONE section                                              |
| Frontend | `frontend/src/pages/landing/LandingPage.tsx`                 | Navbar, hero, inline bands, and the wave fill chain                                      |
| Frontend | `frontend/src/pages/landing/components/`                     | Component bands (`AboutSection`, `TeamSection`, `RegisterSection`, `InquiryForm`, ...)   |
| Frontend | `frontend/src/pages/landing/components/MobileCTABar.tsx`     | Phone bottom bar, below `lg`, shown after 600px of scroll                                |
| Frontend | `frontend/src/pages/settings/components/Website*Section.tsx` | One Settings > Website panel per section, inside `WebsiteSectionCard`                    |
| Frontend | `frontend/src/pages/settings/SettingsPage.tsx`               | `NAV_SECTIONS` + `renderContent()` register each panel                                   |
| Frontend | `frontend/src/lib/uploadSchoolMedia.ts`                      | `SchoolMediaFolder` union; uploads to `school-media/<folder>/` as JPEG                   |

Anchors: `#about` (Our Story, or the hero when Our Story is hidden), `#programs`, `#notices`, `#gallery`, `#register`, `#contact`, `#careers`, `#location`.

---

## Data flow

**Content.** Everything the school writes for the page lives in one jsonb column, `school_info.landing_content = { hero, about, stats, features, team, registration }`. The landing page reads it through `useSchoolInfo({ public: true })` (query key `['school-info', 'public']`, stale after 24 hours) and `useLandingContent()`, which picks the language, applies fallbacks and works out each section's `show`. Other bands fetch their own public lists (`gallery-public`, `announcements-public`, `testimonials-public`, `careers-public`, `art-wall-public`).

**Saving.** Each Settings > Website panel calls `useLandingSection('<key>')` and saves only its slice with `PUT /api/school-info/landing`. The backend validates with `landingContentPatchSchema`, strips HTML from free text in `sanitiseLandingPatch`, and shallow-merges section by section. No `school_info` row yet returns 409 ("save General first").

**Which bands show.** Our Story, programmes, team and numbers follow `content.<section>.show`. Testimonials, artists and careers hide when their list is empty. Register shows only when `registration.enabled` is on AND a QR image is uploaded.

**Wave fill chain.** Each band's closing wave is painted in the NEXT visible band's colour. `LandingPage.tsx` works the order out once, near the top, as `after*Fill` constants. Order: hero, story, programmes, testimonials, notices, team, numbers, gallery, artists, register, enquiry, careers, promise strip. The hero has no wave; `afterHeroFade` does that join.

**Programme cards.** The school picks and orders one to six built-in cards (Settings > Website > Programmes), so the band must look right for every count. `LandingPage.tsx` lays them out as centred flex rows, not a grid: three to a row from `lg`, two from `md`, one on phones, so a short last row sits in the middle. Four cards go two by two in a `max-w-4xl` block (`featuresTwoUp`). `FeatureCard` is a wash tile with a white icon tile, a corner doodle chosen by feature key (`DOODLE` map: apple, puzzle, music note, heart, sun, star), and a tap-to-open detail line. The first card carries the Popular sticker and the fourth the Loved one, both on the top-left corner.

**Registration QR.** The school uploads the QR code that opens its own enrolment form (Settings > Website > Registration QR: toggle + `PhotoUploadTile`, folder `registration`). It goes through the usual square crop and JPEG re-encode, which a QR survives. `RegisterSection` (`#register`, sky band, between the last white band and the enquiry form) shows it on a taped card. While it shows:

- hero buttons become **Register Now** (`#register`) + **Book a Tour** (`#contact`); otherwise Book a Tour + Our Programs
- the phone bar becomes **Register Now** + **Book a Tour**; otherwise Book a Tour + Schedule a Visit (mailto)
- the enquiry form right below (`InquiryForm`, prop `afterRegister`) swaps its heading from "Interested in enrolling?" to "Book a tour or ask a question" (`inquiryTourTitle` / `inquiryTourSubtitle`), so the two bands do not both pitch enrolment and the Book a Tour buttons land on a heading that says so

The app never reads the code: it is an image, and the link inside it is not stored anywhere. The QR opens the school's own form outside this app, so registrations made through it never reach the Inquiries page; only the enquiry form (`POST /api/inquiries`) does.

---

## Gotchas

- **A new `landing_content` section must be added in every one of these, or it silently does nothing:** `packages/types` (interface + `LandingContent`), backend zod schema + `landingContentPatchSchema` + `sanitiseLandingPatch`, frontend `DEFAULT_LANDING_CONTENT` + `mergeLandingContent`, `useLandingContent`, a `Website*Section` panel, `NAV_SECTIONS` + `renderContent` in `SettingsPage`, translations (EN + MS), and tests on both sides. Zod **strips unknown keys**, so a section missing from the patch schema saves as a 200 with a "saved" toast and stores nothing. The same happens if the frontend is deployed ahead of the backend.
- **Adding or hiding a band means fixing the fill of the band before it.** `afterArtFill` feeds two waves (the gallery's own wave when there is no artwork, and the artists wave); miss one and that join shows the wrong colour only for schools in that state.
- **A band that draws its own closing wave must have no bottom padding.** The gallery used `py-20` and left an 80px strip of white between its wave and the next band whenever there was no artwork. It is now `pt-20` plus `pb-20` only when the artists band follows.
- **The hero button row fits two pills.** The text column is about 464px at `lg` and 592px at `xl`; three pills wrap or overflow. Swap labels and targets instead of adding a third.
- **The navbar is already full at `md`** (four links, two toggles, Admin Login). Check 768px before adding a link.
- **`bg-white` is warm (`#FFFAF5`) in light mode and pure white in dark.** An uploaded image with its own white background shows as a paler square on a card. `mix-blend-multiply` on the `<img>` tints it to the card (see `RegisterSection`).
- **The QR tile stays light in dark mode on purpose:** a QR code needs a light quiet zone to scan. Tilting the card is safe; a QR scans at any angle.
- **Anchor targets rely on `pt-24`, not scroll-margin.** The sticky navbar is about 81px tall, so a band without that top padding lands with its heading under the navbar. Whatever sits in the first 81px (the top of a corner doodle) is covered right after a jump.
- **Fade-in wrappers (`useFadeIn`) stay at `opacity-0` until the band scrolls into view.** In a headless screenshot, scroll to the band first or its content looks missing.
- **Never put a hover transform on the element that carries `lp-fade-up`.** The animation runs with fill mode `both` and ends on `transform: translateY(0) scale(1)`, which keeps overriding any transform on that element after it finishes (checked: an inline `translateY(-8px)` on it computes to the identity matrix). The programme cards' `hover:-translate-y-2` was dead for this reason. Put the entrance class on a wrapper and the hover lift on a child, as `FeatureCard` does.
- **Programme cards stay the same height in a row by reserving two lines for the description** (`md:min-h-[3.25rem]`), not by stretching: the row is `items-start` so opening one card does not stretch its neighbours. A description that runs to three lines at `md` or wider would break the row again.
- **Card doodles are sized per doodle, not uniformly.** The doodles are drawn on 32, 48 and 60 unit grids with a 2 unit stroke, so one shared pixel size gives the sun and heart a much heavier line than the puzzle or the note. `DOODLE` in `FeatureCard.tsx` holds a size and offset for each; keep the drawing above 100px from the card top, where the chevron button starts.
- **The mascot cursor's size and hotspot change together.** `.cursor-mascot` in `index.css` is two data-URI SVGs (resting, and grinning over clickables), each with `width`/`height` inside the URI and a hotspot pair after it. The hotspot is in image pixels and must stay on the beak, viewBox point `16 18.75`: hotspot = `(x + 2) * size / 36`, `(y + 3.75) * size / 36`, so 48px gives `24 30`. Resize one without the other and clicks land beside the beak. Change both rules, and leave the archived `.cursor-bear` rules alone. Browsers drop a cursor image above 128px, and swap any cursor above 32px for the plain arrow while it overlaps the window edge.
- **A new `school-media` folder needs no migration:** the storage policies are bucket-wide for signed-in users, and the bucket only accepts `image/jpeg` and the two video types, so anything uploaded must go through the crop and compress step.

---

## Open issues

- **A phone visitor cannot scan a code that is on their own screen.** Register Now takes them to the QR, and from there they need a second device, a screenshot, or their browser's long-press on the image. The fix is an optional form link in `landing_content.registration` (entered by the school next to the QR) shown as a button under the code. Not built: on 2026-10-04 the user asked for the QR to be presented only.
- No Register link in the navbar or the footer quick links; the hero button and the phone bar are the only entry points.
- The notice cards in `LandingPage.tsx` still put `hover:-translate-y-0.5` on the same button as `lp-fade-up`, so by the gotcha above that small lift is presumably dead too (not checked in a browser; their hover shadow is unaffected).

---

## Change log

- 2026-10-04: Registration QR: `landing_content.registration`, Settings > Website > Registration QR, `RegisterSection` (`#register`), Register Now in the hero and the phone bar.
- 2026-10-04: Gallery no longer leaves a white strip under its closing wave when there is no artwork.
- 2026-10-04: While the register band shows, the enquiry form reads "Book a tour or ask a question" instead of "Interested in enrolling?" (user approved); unchanged when no QR is up.
- 2026-10-04: Programme cards redesigned: centred rows (no hole with five cards), equal heights, a corner doodle per card, round chevron button, stickers moved to the top-left, hover lift now works.
- 2026-10-04: Mascot cursor enlarged from 40px to 48px (hotspot `20 25` to `24 30`).
