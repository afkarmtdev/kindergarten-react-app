# KinderCare — User Manual

**Version:** 1.3.1-alpha
**Audience:** School administrators, front-office staff, and demo viewers
**Last updated:** March 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Students](#3-students)
4. [Classes](#4-classes)
5. [Attendance](#5-attendance)
6. [Announcements](#6-announcements)
7. [Gallery](#7-gallery)
8. [Fees](#8-fees)
9. [Settings](#9-settings)
10. [Landing Page (Public Site)](#10-landing-page-public-site)
11. [Testimonials](#11-testimonials)

[Appendix A — Keyboard Shortcuts and Power-User Tips](#appendix-a--keyboard-shortcuts-and-power-user-tips)
[Appendix B — Error Messages Reference](#appendix-b--error-messages-reference)
[Appendix C — Printing Guide](#appendix-c--printing-guide)

---

## 1. Getting Started

### A. What It Does

The login screen is the entry point for the KinderCare admin system. Access is protected by a username and password. All management features are behind authentication — nothing is accessible without a valid session.

### B. How to Use It

1. Open your browser and navigate to the admin URL (e.g. `http://localhost:5173/admin/login` in development, or your production domain).
2. Enter your **Email** and **Password** in the login form.
3. Click **Sign In**.
4. If your credentials are correct, you are redirected to the Dashboard automatically.
5. To log out, click your user avatar or name in the sidebar footer, then click **Logout**.

**Security note:** The login endpoint is rate-limited to 10 attempts per IP address per minute. If you see a "Too many attempts" error, wait one minute before trying again.

### C. Tips for Client Demo

- Log in before the demo starts so you are already on the Dashboard when presenting.
- The session persists across page refreshes — you do not need to log in again if you reload the page.
- Dark mode and language preference (EN/BM) are remembered across sessions via the Settings panel. Set these before your demo if you want a specific look.

---

## 2. Dashboard

### A. What It Does

The Dashboard is the first page you see after logging in. It gives a school-wide snapshot without navigating to any individual module. It shows:

- **4 summary stat cards** at the top: total number of students, total classes, number of students present today, and the overall attendance rate for the current month.
- **Fee Collection Summary card**: shows total fees charged, collected, and outstanding for the current month, plus a count of overdue records.
- **Today's Attendance panel**: lists the 10 most recently recorded attendance entries for today (student name, class, and status).
- **Today's Birthdays panel**: shows any students whose birthday falls on today's date, with their photo and class name.
- **Monthly Summary panel**: a bar chart showing attendance counts by status (Present, Absent, Late, Excused) across every day of the current month.

### B. How to Use It

1. After logging in, the Dashboard loads automatically.
2. The four top stat cards update whenever new data is available. The attendance rate reflects the entire current month, not just today.
3. The **Fee Collection Summary** defaults to the current month. It refreshes when you navigate back to the Dashboard.
4. The **Today's Birthdays** panel scans all students and highlights anyone whose birth month and day match today. It shows up to the first matching students found from a sample of 100.
5. The **Monthly Summary** bar chart shows one bar per day. Hover over a bar to see exact counts.
6. To act on anything you see, click the sidebar links to navigate to the relevant module.

### C. Tips for Client Demo

- Navigate to the Dashboard at the start of every demo — it makes an immediate visual impression with real numbers.
- If you want the Fee Collection Summary to show non-zero numbers, add at least a few fee records with payments before the demo.
- Birthday highlights are automatic — if any student's birthday is today, it will appear without any configuration.
- The stat cards all load in parallel, so the page feels fast even on the first visit.

---

## 3. Students

### A. What It Does

The Students module manages the school's complete student roster. Each student record holds personal details (name, date of birth, gender), class assignment, parent contact information, and an optional profile photo. The module supports individual add/edit, photo upload, and bulk import from a CSV file.

### B. How to Use It

#### Viewing and Searching Students

1. Click **Students** in the left sidebar.
2. Students are displayed in a card grid, 12 per page.
3. Use the **Search** bar (top left of the filter row) to search by student name, parent name, or parent email. The search is debounced — wait about 350 ms after typing for results to update.
4. Use the **Class** dropdown to filter by class name.
5. Use the **Gender** dropdown to filter by Male or Female.
6. When any filter is active, a **Clear Filters** button appears — click it to reset all filters at once.
7. Use the **Previous / Next** pagination buttons to move between pages.

#### Adding a Student

1. Click the **Add Student** button (top right).
2. Fill in the required fields (marked with \*):
   - **Full Name** \*
   - **Date of Birth** \* (date picker)
   - **Gender** \* (Male / Female dropdown)
   - **Class** \* (dropdown of existing classes)
   - **Parent Name** \*
   - **Parent Email** \* (must be a valid email format)
   - **Parent Phone** \*
3. Optionally, click the photo upload area to select a profile photo (JPG, PNG, or SVG, max 2 MB). The photo is automatically compressed before uploading.
4. Click **Save**. A success toast appears and the student grid refreshes.

#### Editing a Student

1. Find the student card on the Students page.
2. Click the **edit (pencil) icon** on the card.
3. The same form opens, pre-filled with the student's current information.
4. Make your changes and click **Save**.

**Note:** If you make changes and then try to close the form without saving, a discard confirmation dialog appears asking whether to keep or discard your unsaved changes.

#### Deleting a Student

1. Click the **trash icon** on the student card.
2. A confirmation dialog appears showing the student's name.
3. Click **Delete** to confirm, or **Cancel** to go back.
4. The card disappears immediately (optimistic deletion). If the server returns an error, the card reappears and an error toast is shown.

#### Bulk Importing Students from CSV

1. Click the **Import CSV** button on the Students page.
2. **Step 1 — Upload:** Drag and drop a CSV file into the upload zone, or click to browse. Click **Download Sample CSV** to get a template with the correct column headers.

   Required CSV columns (in any order):
   | Column | Description |
   |--------|-------------|
   | full_name | Student's full name |
   | date_of_birth | Format: YYYY-MM-DD |
   | gender | `male` or `female` (lowercase) |
   | class_name | Must match an existing class name exactly |
   | parent_name | Parent or guardian name |
   | parent_email | Valid email address |
   | parent_phone | Phone number |

3. **Step 2 — Preview:** The import modal shows a table of all rows parsed from the file. Invalid rows are highlighted in red with the reason (e.g. "Missing full_name", "Invalid email"). Valid rows show in green. Invalid rows will be skipped — they are not imported.
4. Click **Import Valid Rows** to proceed.
5. **Step 3 — Result:** A summary shows how many students were imported successfully and lists any rows that failed with their row number and reason.

#### Viewing a Student Profile

1. Click the student's name or photo on a student card.
2. The Student Profile page opens at `/admin/students/:id`.
3. The profile shows the student's full info card (photo, name, class, parent contacts) and a strip of quick stats.
4. Below that, an **Attendance Heatmap** shows attendance presence across the past year (green = present, red = absent, gray = no record).
5. The **Attendance History** table shows individual attendance entries, 15 per page, with date, status, and notes.
6. Click **Edit Student** to open the edit modal from this page.

### C. Tips for Client Demo

- Import the sample CSV first to populate the roster quickly before a demo — it takes under 10 seconds to get 20+ students into the system.
- Show the Class and Gender filters together to demonstrate how the system narrows down to specific groups (e.g. "all girls in Class A").
- Click into a student profile and scroll to the heatmap — it is visually striking and immediately communicates the attendance tracking depth.
- Birthday badges appear automatically on any student card whose birthday is today.

---

## 4. Classes

### A. What It Does

The Classes module manages the school's classrooms. Each class record stores the class name, assigned teacher, and maximum capacity. The system automatically shows how many students are currently enrolled in each class, and highlights classes that are at or near full capacity.

### B. How to Use It

#### Viewing Classes

1. Click **Classes** in the sidebar.
2. Classes are shown in a card grid, 9 per page.
3. Each card shows the class name, teacher name, an enrollment bar (students enrolled vs. capacity), and the student count.
4. The enrollment bar turns **red** when a class is at 90% or more of its capacity.
5. Use the **Search** bar to filter by class name or teacher name.

#### Adding a Class

1. Click **Add Class** (top right).
2. Fill in:
   - **Class Name** \* (e.g. "Kelas Bintang")
   - **Teacher Name** \*
   - **Capacity** \* (number between 1 and 100; defaults to 25)
3. Click **Save**.

#### Editing a Class

1. Click the **pencil icon** on a class card.
2. Update the fields as needed.
3. Click **Save**.

**Note:** Changing the class name does not automatically reassign students — their `class_name` field on each student record still references the old name. Update student records separately if you rename a class.

#### Deleting a Class

1. Click the **trash icon** on the class card.
2. Confirm in the dialog.

### C. Tips for Client Demo

- Create 3–5 classes before a demo so the Students, Attendance, and Fee modules have real class options to filter by.
- Fill one class close to capacity to show the red capacity bar — it is an intuitive at-a-glance warning.
- Click into a class from the student profile page (via the class name link) to show it navigates to the class detail if you have that route set up.

---

## 5. Attendance

### A. What It Does

The Attendance module lets staff record daily attendance for all students. It supports four statuses: **Present**, **Absent**, **Late**, and **Excused**. Attendance is recorded per student per day. The same student can be re-marked on the same day (the record is updated, not duplicated). The module also supports:

- Bulk marking all students as Present in one click
- Saving all pending changes in a single server call
- Filtering the view by status tab
- Exporting the day's attendance to CSV
- Printing a blank or filled attendance sheet
- Real-time updates (if another staff member marks attendance on a different device, changes appear automatically)

### B. How to Use It

#### Selecting a Date

1. Click **Attendance** in the sidebar.
2. The page defaults to today's date. Use the **date picker** at the top to switch to a different date.

#### Marking Attendance

1. The table shows all students (20 per page).
2. Each row has four status buttons: **P** (Present), **A** (Absent), **L** (Late), **E** (Excused).
3. Click a button to mark that student with that status. The button highlights to show the selected status.
4. Changes are held locally (not yet saved). The row turns slightly highlighted to indicate unsaved changes.
5. When you have marked all students, click **Save Changes** (appears at the bottom when there are unsaved changes, showing the count of changes pending).

#### Mark All Present

1. Click the **Mark All Present** button at the top of the table.
2. All students on the current page are marked Present instantly (not saved yet).
3. Click **Save Changes** to commit.

#### Filtering by Status

- Click a status tab (**All**, **Present**, **Absent**, **Late**, **Excused**) above the table to filter the view. This does not affect what is saved — it only filters what you see.

#### Exporting to CSV

1. Click **Export CSV** (top right of the page).
2. A CSV file downloads with all attendance records for the currently selected date (up to 1000 rows in one request).

#### Printing an Attendance Sheet

1. Click **Print Attendance** (top right).
2. A print preview modal opens.
3. Choose **Filled** mode (shows current recorded statuses as checkmarks) or **Blank** mode (empty checkbox cells for manual collection).
4. Click **Print** to send to the printer.

### C. Tips for Client Demo

- Start the demo with today's date pre-selected and all students unmarked. Click **Mark All Present** and then **Save Changes** to show how fast bulk marking works.
- Switch to **Absent** tab after saving to show the filter — it will be empty, which nicely demonstrates that everyone was marked present.
- Open the print preview in Blank mode to show the physical paper workflow — useful for schools that collect attendance on paper and enter it later.
- If you have two browser windows open on different accounts, mark a student in one window and show the other window updating in real time.

---

## 6. Announcements

### A. What It Does

The Announcements module manages notices that appear on the public-facing landing page. Each announcement has a title, body text, category, optional banner image, an optional pinned flag (pinned announcements always appear first), and an optional expiry date (expired announcements are automatically hidden from the public).

Four categories are available: **General**, **Holiday**, **Event**, and **Reminder**. Each has a distinct color badge for quick scanning.

### B. How to Use It

#### Viewing Announcements

1. Click **Announcements** in the sidebar.
2. Announcements are shown in a card grid, 9 per page.
3. Use the **Search** bar to filter by title or body text.
4. Use the **Category** dropdown to filter by category.
5. Pinned announcements show a pin badge. Expired announcements show a red "Expired" badge.

#### Adding an Announcement

1. Click **Add Announcement** (top right).
2. Fill in:
   - **Title** \*
   - **Body** \* (free-form text, textarea)
   - **Category** (General / Holiday / Event / Reminder)
   - **Pinned** toggle (yellow when active — pinned announcements appear at the top of the public page)
   - **Expiry Date** (optional — once this date passes, the announcement is automatically hidden from the public landing page; it remains visible in the admin list with an "Expired" badge)
   - **Banner Image** (optional — upload a JPG, PNG, or SVG; displayed at the top of the card on the landing page)
3. Click **Post Announcement**.

#### Editing an Announcement

1. Click the **pencil icon** on an announcement card.
2. Update as needed and click **Save**.

#### Deleting an Announcement

1. Click the **trash icon** on the card.
2. Confirm in the dialog.

### C. Tips for Client Demo

- Create one pinned General announcement and one Holiday announcement with an expiry date one week from now. This shows the two most common use cases at a glance.
- Open the landing page in a second browser tab and refresh it after posting an announcement — the Notices section appears immediately with the new content.
- Show the expiry date feature by setting it to yesterday — the card still appears in the admin list (with the "Expired" badge) but does not appear on the public landing page, demonstrating automated cleanup.

---

## 7. Gallery

### A. What It Does

The Gallery module manages photos displayed in the gallery section of the public landing page. Each photo has a caption, a display order number (lower numbers appear first), and a visibility toggle. Hidden photos are stored in the system but not shown to visitors.

### B. How to Use It

#### Viewing Gallery Photos

1. Click **Gallery** in the sidebar.
2. Photos are shown in a card grid, 9 per page, ordered by display order (ascending).
3. Each card shows the photo thumbnail, a Visible/Hidden badge overlay, the caption, and the display order number.
4. Use the **Search** bar to filter by caption.

#### Adding a Photo

1. Click **Add Photo** (top right).
2. Fill in:
   - **Photo** \* (required — click the upload zone to select a JPG, PNG, or SVG; compressed automatically before upload)
   - **Caption** (optional text description)
   - **Display Order** (number, default 0 — lower numbers appear first on the landing page)
   - **Visible** toggle (green when on — controls whether the photo appears on the public landing page)
3. Click **Save**.

#### Editing a Photo

1. Click the **pencil icon** on a gallery card.
2. Update the caption, order, or visibility as needed.
3. Click **Save**.

**Note:** Editing a photo record does not re-upload the image file. To replace the photo itself, delete the record and add a new one.

#### Deleting a Photo

1. Click the **trash icon** on the card.
2. Confirm in the dialog.

#### Reordering Photos

- To change the order photos appear on the landing page, edit each photo and update its **Display Order** number. Photos are sorted lowest-to-highest. For example, set your hero photo to order 0 and secondary photos to 1, 2, 3, etc.

### C. Tips for Client Demo

- Upload 4–6 real school photos before the demo. Show the gallery grid in the admin panel, then switch to the landing page to show the same photos in the public gallery section.
- Click one of the photos on the landing page to demonstrate the lightbox: it opens fullscreen with a dark background, supports left/right navigation, and shows the caption.
- Toggle one photo to Hidden and refresh the landing page to show it disappears instantly from public view without deleting it.

---

## 8. Fees

### A. What It Does

KinderCare includes a complete fee collection module covering:

- **Fee Plans** — reusable templates (type, amount, description) that can be bulk-applied to a class or all students
- **Fee Records** — individual charges per student, with support for partial payments, discounts/waivers, and receipt number generation
- **Multiple printable documents** — receipts, invoices, overdue notices, enrollment letters, class collection sheets, monthly reports, annual reports, and per-student fee statements
- **Dashboard integration** — monthly totals appear on the Dashboard at a glance

For detailed testing steps, field-by-field validation rules, and edge-case scenarios, see `docs/fees-module-guide.md`.

#### Fee Status Logic

Status is derived automatically in the backend based on payment amounts:

| Status  | Condition                                 |
| ------- | ----------------------------------------- |
| Waived  | Discount amount >= amount owed            |
| Paid    | Amount paid >= (amount owed - discount)   |
| Partial | Amount paid > 0 but less than net payable |
| Unpaid  | Amount paid = 0                           |

#### Key Constraints

- **Only Unpaid records can be deleted.** Partial or paid records are permanent (for audit trail purposes).
- **Receipt numbers require configuration** before any payment can be recorded. The format is set in Settings > Document Numbering.
- Payments cannot exceed the remaining balance on a record.

### B. How to Use It

#### Setting Up — Document Numbering (Do This First)

Before recording any payments, configure the receipt number format:

1. Go to **Settings** > **Document Numbering**.
2. Build the format using segments (see the [Settings section](#9-settings) for full details).
3. A common format is: `RCP-` (constant) + Year (auto) + `-` (constant) + Serial (4 digits, reset yearly).
4. Click **Save Format**. The next receipt issued will use this format.

#### Managing Fee Plans

1. Click **Fee Plans** in the sidebar (or click the **Fee Plans** link from the Fees page).
2. Fee plan cards show the name, type, and amount.
3. Click **Add Fee Plan** to create a template:
   - **Name** \*
   - **Type** \* (Tuition / Activity / Uniform / Registration / Other)
   - **Amount** \* (positive number)
   - **Description** (optional)
4. To generate fee records from a plan, click the **lightning bolt (Use Plan)** icon on any plan card.

#### Generating Fee Records in Bulk

1. From the Fee Plans page or the Fees page, click **Generate Fees** (blue button).
2. **Step 1 — Fee Details:** Toggle between "Use Fee Plan" (select an existing plan) or "Custom Fee" (enter type, amount, and description manually).
3. **Step 2 — Target:** Select the target class (or "All Students") and set an optional due date.
4. **Step 3 — Confirm:** Review the summary. It shows how many students will receive a new fee record. Click **Generate** to create all records at once.
5. A toast confirms how many records were created.

#### Adding a Single Fee Record

1. On the **Fees** page, click **Add Fee Record** (orange button, top right).
2. Select the **Student** from the dropdown (searches up to 500 students).
3. Fill in:
   - **Type** \* (Tuition / Activity / Uniform / Registration / Other)
   - **Description** \*
   - **Amount Owed** \*
   - **Discount Amount** (default 0)
   - **Discount Reason** (appears when discount > 0)
   - **Due Date** (optional)
4. Click **Save**.

#### Recording a Payment

1. On the Fees table, find the fee record and click **Pay** (the green button in the row actions).
2. The payment modal shows:
   - Student name and fee description
   - Balance breakdown (owed, discount if any, previously paid if any, remaining balance)
   - A payment amount field pre-filled with the full remaining balance
3. Adjust the amount if the parent is making a partial payment.
4. Click **Record Payment**.
5. A receipt is automatically generated and the Receipt View opens for printing.

**Note:** If document numbering is not configured, the **Record Payment** button is disabled and an amber warning is shown. Configure the receipt format in Settings first.

#### Filtering Fee Records

The Fees table supports four simultaneous filters:

- **Search** — searches by student name
- **Status** — All / Unpaid / Partial / Paid / Waived
- **Month** — filters by the fee's associated month (from the due date)
- **Class** — filters by the student's class

#### Printing Documents from a Fee Record

Each row in the Fees table has an actions menu (three-dot or icon buttons). Available print documents:

| Action                  | Document                                                | Best used for                  |
| ----------------------- | ------------------------------------------------------- | ------------------------------ |
| Print Receipt           | Printable payment receipt                               | After recording a payment      |
| Print Invoice           | Formal fee invoice                                      | Billing parents proactively    |
| Print Overdue Notice    | Invoice variant with days overdue + principal signature | Chasing unpaid accounts        |
| Print Enrollment Letter | Formal enrollment confirmation letter                   | Registration fee + paid status |

#### Class Collection Sheet

1. Click **Print Collection Sheet** (top of Fees page).
2. Select a **Class** and a **Month**.
3. A printable table appears listing every student in the class and their fee records for that month, with blank "Collected" checkboxes and a Remarks column.
4. Click **Print**.
5. Includes "Prepared By" and "Verified By" signature blocks.

#### Monthly Collection Report

1. Click **Monthly Report** (top of Fees page).
2. Select a **Month**.
3. The report shows four summary stat boxes, a breakdown by class, a breakdown by fee type, and a list of outstanding accounts.
4. Click **Print**. This report prints in A4 landscape format.

#### Annual Report

1. Click **Annual Report** link (top of Fees page) or navigate to `/admin/fees/annual-report`.
2. Select a **Year** from the dropdown.
3. The report shows a four-stat summary strip, a by-fee-type table with totals, the collection rate percentage (color-coded: green >= 90%, amber >= 70%, red below 70%), and a record count summary.
4. Click **Print Annual Report**.

#### Fee Statement (Per Student)

1. From a student's fee record row, there is a Statement link. Or navigate directly to `/admin/fees/statement/:studentId`.
2. Select a **Year**.
3. Toggle **Ledger View** to switch between a standard fee list and a running-balance ledger format.
4. Click **Print Statement**.
5. The statement footer includes an LHDN (Malaysian income tax) note about child education tax relief eligibility.

### C. Tips for Client Demo

- Generate fees for a whole class in one action to show the bulk power — 20 students get records in under 3 seconds.
- Record a partial payment on one record, then show the status changing from Unpaid to Partial. Then record the remaining balance and show it flip to Paid.
- Print a receipt immediately after recording payment — school logo, receipt number, and full breakdown appear.
- Open the Monthly Report and Annual Report to show the financial overview depth.
- The Collection Rate percentage on the Annual Report is color-coded — this is a strong visual for parents' meeting presentations.

---

## 9. Settings

### A. What It Does

Settings is split into three sections accessible from a sidebar nav on desktop (or a drill-down list on mobile):

- **School Info** — configures the school's name, address, contact details, social media links, operating hours, and logo. This information is shown on all printed documents.
- **Document Numbering** — configures the format of receipt numbers using a visual segment builder.
- **Appearance** — toggles dark mode and switches the interface language between English (EN) and Bahasa Malaysia (BM).

### B. How to Use It

#### School Info

1. Go to **Settings** > **School Info**.
2. Fill in any of the following fields:
   - **Logo** — click the upload square to select a photo (max 2 MB; resized automatically to max 400 px)
   - **School Name** — appears on all printed documents (receipts, reports, statements)
   - **Address** — multi-line; appears on printed documents below the school name
   - **Phone** — contact number
   - **Email** — contact email
   - **Principal Name** — used on overdue notices and enrollment letters
   - **Registration Number** — appears on invoices, overdue notices, enrollment letters, annual report, and class collection sheet
   - **WhatsApp Number** — digits only, 7–15 characters
   - **Operating Hours** — a grid showing each day of the week with Open and Close time pickers. Days with no times entered show "Closed".
   - **Google Maps Embed URL** — paste the URL from Google Maps > Share > Embed a map (must start with `https://www.google.com/maps/embed?`)
   - **Facebook URL** — full URL to the school's Facebook page
   - **Instagram URL** — full URL to the school's Instagram profile
3. Click **Save** when done. A success toast confirms the save.

**Important:** The **Save** button is disabled until you make at least one change. It will not activate until the form is "dirty" (has unsaved changes).

#### Document Numbering

1. Go to **Settings** > **Document Numbering**.
2. The format is built from a list of **segments**. Each segment is one part of the number.
3. Add segments using the **Add Segment** button. Available segment types:

   | Type     | Description                           | Example output |
   | -------- | ------------------------------------- | -------------- |
   | Constant | Fixed text you type                   | `RCP-`         |
   | Year     | Current year (auto)                   | `2026`         |
   | Month    | Current month (auto, 2 digits)        | `03`           |
   | Serial   | Auto-incrementing number, zero-padded | `0001`         |

4. For a **Serial** segment, configure:
   - **Total characters** (1–20) — how many digits, zero-padded (e.g. 4 = `0001`)
   - **Reset by** — No Reset (runs continuously), Monthly (resets to 1 on the first of each month), or Yearly (resets to 1 on 1 January)
   - **Start from** — the starting serial number (default 1)

5. The **live preview** (orange box) shows what the next number will look like based on your segments.
6. Only one Serial segment is allowed per format (the Add Segment button is disabled when the last segment is already a serial).
7. Click **Save Format**.

   **Warning:** If you change the format after receipts have already been issued, a confirmation dialog appears warning that the format change will affect the visual appearance of future numbers (the existing serial counter is preserved).

**Recommended receipt format for a typical school:**

`RCP-` (constant) + `2026` (year) + `-` (constant) + `0001` (serial, 4 chars, reset yearly)

Produces: `RCP-2026-0001`, `RCP-2026-0002`, etc.

#### Appearance

1. Go to **Settings** > **Appearance**.
2. **Dark Mode** — toggle the pill switch. When active (orange), the entire admin interface switches to dark theme. This setting is saved to your browser and restores automatically on next visit.
3. **Language** — click **EN** or **BM** to switch all interface labels between English and Bahasa Malaysia. This setting is also saved to your browser.

### C. Tips for Client Demo

- Fill in the School Info completely before any demo — the school name and logo appear on every printed document. A demo that says "KinderCare" on receipts instead of the actual school name is less convincing.
- Build the receipt format live during the demo: add a Constant segment, type `RCP-`, add a Year segment, add another Constant `-`, then add a Serial segment. The preview updates in real time as each segment is added.
- Toggle dark mode live to show the UI adapts instantly with no page reload.
- Switch language to BM and show that all menu labels and form labels change — strong localisation proof for Malaysian schools.

---

## 10. Landing Page (Public Site)

### A. What It Does

The landing page is a public-facing marketing page for the school. It is separate from the admin panel and requires no login to view. It pulls real data from the system:

- **Gallery section** — shows published (visible) gallery photos with a lightbox viewer
- **Notices section** — shows active (non-expired) announcements
- **Testimonials section** — shows a carousel of visible parent testimonials
- **Stats section** — shows animated counters (students enrolled, classes, years established, attendance rate)

The landing page also includes dark mode and language toggles in the navbar — the same settings used in the admin panel.

### B. How to Use It

The landing page is accessed by anyone who visits the school's public URL. There is no admin action required beyond keeping the content modules (Gallery, Announcements, Testimonials) up to date in the admin panel.

**Navigation anchors on the landing page:**

- **About** — scrolls to the Features section
- **Programs** — scrolls to the Programs section
- **Gallery** — scrolls to the gallery section
- **Notices** — scrolls to the announcements section
- **Contact** — scrolls to the contact/CTA section

A **scroll-to-top button** appears in the bottom-right corner after scrolling down 320 px.

The **Admin Login** link in the navbar (lock icon on mobile, "Admin Login" pill on desktop) takes staff to the login page.

### C. Tips for Client Demo

- Keep the admin panel open in one browser tab and the landing page open in another. Add an announcement in the admin panel, then refresh the landing page to show it appearing instantly.
- Click a gallery photo to demonstrate the lightbox — it is a polished, app-quality interaction.
- Scroll through all sections smoothly to show the layout: hero with animated bear mascot, stats with counting animation, features, gallery, notices, testimonials carousel, CTA, and footer.
- The testimonials carousel auto-advances every 4 seconds and pauses when hovered — point this out during the demo.

---

## 11. Testimonials

### A. What It Does

The Testimonials module manages parent quotes displayed on the landing page in a rotating carousel. Each testimonial has the parent's name, an optional role (e.g. "Parent of Year 1"), the quote text, an optional avatar photo, a display order number, and a visibility toggle.

### B. How to Use It

#### Viewing Testimonials

1. Click **Testimonials** in the sidebar.
2. Testimonials are shown in a card grid, 9 per page.
3. Each card shows the avatar (photo or initials circle), parent name, role, quote, and a Visible/Hidden badge.
4. Use the **Search** bar to filter by name or quote text.

#### Adding a Testimonial

1. Click **Add Testimonial** (top right).
2. Fill in:
   - **Parent Name** \*
   - **Role** (optional — e.g. "Parent of Aishah, Year 1")
   - **Quote** \* (the testimonial text)
   - **Display Order** (number — lower numbers appear earlier in the carousel)
   - **Visible** toggle (green when on — controls whether this testimonial appears on the landing page)
   - **Avatar Photo** (optional — JPG/PNG, max 2 MB; if not uploaded, the carousel shows the parent's initials in a colored circle)
3. Click **Save**.

#### Editing or Deleting a Testimonial

1. Click the **pencil icon** to edit or the **trash icon** to delete.
2. Deletion requires confirmation in a dialog.

### C. Tips for Client Demo

- Add 3–4 testimonials with different display orders and make them all visible.
- Scroll to the testimonials section on the landing page and let it auto-advance to show the stacked carousel animation.
- Show the initials fallback by adding a testimonial without a photo — the system generates an initial badge automatically.
- Toggle a testimonial's visibility off in the admin, then refresh the landing page to show it disappears from the carousel immediately.

---

## Appendix A — Keyboard Shortcuts and Power-User Tips

### Navigation

| Action                        | Method                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Jump to any admin page        | Click the page name in the left sidebar                                       |
| Toggle sidebar on mobile      | Tap the hamburger (menu) icon in the top bar                                  |
| Scroll to top of landing page | Click the scroll-to-top button (bottom-right, appears after scrolling 320 px) |

### Attendance

- **Mark all present quickly:** Click **Mark All Present** then immediately click **Save Changes** — the entire class is recorded in two clicks.
- **Fix a wrong status:** Click a different status button on the same row. The pending change is updated in place. The previous status is not saved until you click Save Changes.
- **Use the status filter tabs** to quickly count how many students are absent on a given day without leaving the page.

### Students

- **Bulk import saves the most time** when onboarding a new school year. Prepare the CSV in Excel or Google Sheets, download the sample CSV from the import modal to get the correct column names, then import.
- **Search works across student name, parent name, and parent email** — you can find a student by searching the parent's name even if you cannot remember the child's full name.
- **Class filter + Gender filter** can be combined: for example, "Girls in Kelas Bintang" uses both dropdowns simultaneously.

### Fees

- **Configure Document Numbering before anything else** — the Record Payment button is disabled until a receipt format is saved.
- **Generate Fees in bulk** at the start of each month: select the tuition plan, target "All Students", set the due date, and confirm. All records are created in one action.
- **Export CSV** on the Fees page exports all records matching the current filters. Apply the Month filter first to export only a specific month.
- **The Collection Rate** on the Annual Report is color-coded: green (90%+), amber (70–89%), red (below 70%) — useful for board reporting.

### Printing

- All print dialogs open the browser's native print dialog (`Ctrl+P` / `Cmd+P` also works once the print view is open).
- Set paper size to **A4 Portrait** for most documents. The **Monthly Collection Report** is the exception — set it to **A4 Landscape**.
- Print CSS hides all browser UI, sidebar, and toolbar — only the document content is printed.

### Settings

- **Dark mode toggle** and **language toggle** are also accessible from the sidebar footer panel (click the chevron above your user name to expand the panel) — you do not need to navigate to the Settings page to switch them.
- Changes to School Info are reflected on all newly printed documents immediately after saving. Already-printed documents are not affected.

---

## Appendix B — Error Messages Reference

| Message                                                         | What it means                                          | What to do                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| "Too many attempts. Please try again later."                    | Login rate limit reached (10 attempts/IP/minute)       | Wait 60 seconds, then try again                                                                                          |
| "Invalid email or password."                                    | Login credentials are incorrect                        | Check email and password; reset password via Supabase dashboard if needed                                                |
| "Failed to save school info. Please try again."                 | Server error when saving Settings > School Info        | Check your internet connection and try again                                                                             |
| "Logo upload failed. Please try again."                         | Image upload to Supabase Storage failed                | Check that the `school-logo` storage bucket exists and is public; check file is under 2 MB                               |
| "Fee record created" / "Fee record updated" (toast)             | Success confirmation                                   | No action needed                                                                                                         |
| "Failed to save. Please try again." (fees)                      | Server error on fee record create/update               | Retry; check backend logs if the problem persists                                                                        |
| "Failed to remove. Please try again."                           | Optimistic delete was rolled back after a server error | The item reappears; check backend and retry                                                                              |
| "Receipt numbering not configured" (amber box in payment modal) | No document numbering format has been saved            | Go to Settings > Document Numbering and save a receipt format                                                            |
| "Payment cannot exceed remaining balance."                      | Amount entered in the payment modal is too high        | Enter an amount less than or equal to the remaining balance shown                                                        |
| "Only unpaid fee records can be deleted."                       | Attempting to delete a Partial or Paid fee record      | You cannot delete paid records. Apply a waiver (full discount) if the record needs to be zeroed out                      |
| "Failed to generate fees."                                      | Bulk fee generation failed                             | Check that the selected plan exists and the target class has students; retry                                             |
| "Failed to export CSV."                                         | CSV export request failed                              | Retry; if the problem persists, apply filters to narrow the dataset and try again                                        |
| "Student not found."                                            | The requested student profile URL does not exist       | Check the student ID in the URL; navigate back to Students and click the correct card                                    |
| "Logo upload failed" (student/gallery/announcement)             | Image upload failed                                    | Check that the relevant storage bucket exists and is public (`student-photos`, `gallery-photos`, `announcement-banners`) |

---

## Appendix C — Printing Guide

All print documents use browser-native printing (`window.print()`). No PDF software or third-party printer drivers are required.

### Print Documents Overview

| Document                  | Accessed from                                                | Paper size | Orientation |
| ------------------------- | ------------------------------------------------------------ | ---------- | ----------- |
| Payment Receipt           | Fees table row > Print Receipt (or auto-opens after payment) | A4         | Portrait    |
| Fee Invoice               | Fees table row > Print Invoice                               | A4         | Portrait    |
| Overdue Notice            | Fees table row > Print Overdue Notice                        | A4         | Portrait    |
| Enrollment Letter         | Fees table row > Print Enrollment Letter                     | A4         | Portrait    |
| Class Collection Sheet    | Fees page > Print Collection Sheet                           | A4         | Portrait    |
| Monthly Collection Report | Fees page > Monthly Report > Print                           | A4         | Landscape   |
| Annual Report             | Fees page > Annual Report > Print Annual Report              | A4         | Portrait    |
| Fee Statement             | /admin/fees/statement/:studentId > Print Statement           | A4         | Portrait    |
| Attendance Sheet (Filled) | Attendance page > Print Attendance > Filled                  | A4         | Portrait    |
| Attendance Sheet (Blank)  | Attendance page > Print Attendance > Blank                   | A4         | Portrait    |

### Before Printing

1. Ensure **School Info** is fully configured in Settings (school name, address, logo, registration number, principal name). These fields populate the header of every document.
2. Ensure the browser is not set to print headers/footers (browser URL and date are sometimes added by default). In Chrome: Print > More Settings > uncheck "Headers and footers".
3. Set **Margins** to "Default" or "Minimum" in the browser print dialog for best layout.

### How to Print Each Document

**Payment Receipt:**

1. Record a payment on a fee record. The receipt view opens automatically.
2. Alternatively, click **Print Receipt** from the row actions menu on any fully or partially paid record.
3. Click the **Print** button in the receipt view toolbar.
4. The print dialog opens. Confirm A4 Portrait and click Print.

**Fee Invoice:**

1. Click **Print Invoice** from the row actions menu on any fee record.
2. The invoice opens in a modal overlay.
3. Click **Print** in the modal toolbar.

**Overdue Notice:**

1. Click **Print Overdue Notice** from the row actions menu.
2. The notice shows days overdue (highlighted in red) and includes a principal signature block.
3. Click **Print**.

**Enrollment Letter:**

1. Click **Print Enrollment Letter** from the row actions menu.
2. Only meaningful for Registration-type fee records with Paid status.
3. Click **Print**.

**Class Collection Sheet:**

1. Click **Print Collection Sheet** at the top of the Fees page.
2. Select the class and month in the toolbar.
3. Review the sheet (students are grouped with fee rows, each with a blank Collected checkbox).
4. Click **Print**.

**Monthly Collection Report:**

1. Click **Monthly Report** at the top of the Fees page.
2. Select the month in the toolbar.
3. Click **Print** in the modal toolbar.
4. Set orientation to **Landscape** in the print dialog.

**Annual Report:**

1. Navigate to **Annual Report** (link at the top of the Fees page, or `/admin/fees/annual-report`).
2. Select the year.
3. Click **Print Annual Report**.

**Fee Statement (for parent/LHDN):**

1. Navigate to the student's fee statement page (`/admin/fees/statement/:studentId`).
2. Select the year.
3. Optionally toggle **Ledger View** for a running-balance format.
4. Click **Print Statement**.
5. The footer includes an LHDN note about child education tax relief under the Malaysian Income Tax Act.

**Attendance Sheet:**

1. On the Attendance page, select the date (and optionally filter by class using the class filter on the page).
2. Click **Print Attendance**.
3. Choose **Filled** (current statuses) or **Blank** (empty checkboxes for manual collection).
4. Click **Print**.

### Print Troubleshooting

| Problem                                                             | Solution                                                                                                                                        |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| School logo does not appear on printout                             | Ensure the logo is saved in Settings > School Info and the `school-logo` Supabase bucket is public                                              |
| School name shows as "KinderCare" instead of the actual school name | Enter the school name in Settings > School Info and save                                                                                        |
| Print includes browser UI (address bar, tabs)                       | The print CSS hides non-document content — if UI still shows, use the browser's "Print to PDF" function and check your browser's print settings |
| Monthly Report is cut off on right edge                             | Set orientation to Landscape in the print dialog                                                                                                |
| Blank page appears after the document                               | Set margins to "Minimum" or "None" in the print dialog                                                                                          |
| Receipt number shows as "RCP-0000" or similar test value            | This is from a test receipt format. Reconfigure Document Numbering in Settings with your real prefix and reset the serial                       |
