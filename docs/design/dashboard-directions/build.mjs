// Assembles the three dashboard direction artboards from the shared sidebar
// (lifted from ../warm-storybook/AdminDashboard.dc.html) plus one body each.
// Run: node docs/design/dashboard-directions/build.mjs
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { wrap } from "./shared.mjs"
import { bodyA } from "./a.mjs"
import { bodyB } from "./b.mjs"
import { bodyC } from "./c.mjs"

const here = dirname(fileURLToPath(import.meta.url))
writeFileSync(join(here, "Main.dc.html"), wrap(bodyA(), 960))
writeFileSync(join(here, "ClassroomWall.dc.html"), wrap(bodyB(), 960))
writeFileSync(join(here, "DayPlan.dc.html"), wrap(bodyC(), 960))
console.log("built Main, ClassroomWall, DayPlan")
