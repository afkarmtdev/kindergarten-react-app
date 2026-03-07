# KinderCare — User Manual

**Version:** 1.3.1-alpha
**Audience:** Business consultants helping kindergarten school owners evaluate and use this software
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

[Appendix A — Shortcuts and Power-User Tips](#appendix-a--shortcuts-and-power-user-tips)
[Appendix B — Error Messages Reference](#appendix-b--error-messages-reference)
[Appendix C — Printing Guide](#appendix-c--printing-guide)

---

## 1. Getting Started

### A. What It Does

The login screen is the entry point for the KinderCare administration system. Only staff with a valid email and password can access the system. Nothing inside the management area is visible without logging in first.

### B. How to Use It

1. Open your web browser and go to the address your school was given for the admin system.
2. Enter your **Email** and **Password** in the login form.
3. Click **Sign In**.
4. If your details are correct, the system takes you to the Dashboard automatically.
5. To log out, click your name or user picture in the bottom of the left-hand menu, then click **Logout**.

**Security note:** If you enter the wrong password too many times in a row, the system will ask you to wait one minute before trying again.

### C. Tips for Client Demo

- Log in before the demo starts so you are already on the Dashboard when presenting.
- Your login stays active if you refresh the page — you do not need to log in again just because you reloaded.
- Dark mode and the language preference (English or Bahasa Malaysia) are remembered between visits. Set these before your demo if you want a specific look.

---

## 2. Dashboard

### A. What It Does

The Dashboard is the first page you see after logging in. It gives a snapshot of the whole school without having to click into any individual section. It shows:

- **4 summary boxes** at the top: total number of students, total classes, how many students were present today, and the overall attendance rate for the current month.
- **Fee Collection Summary:** shows total fees charged, collected, and still outstanding for the current month, plus how many accounts are overdue.
- **Today's Attendance panel:** lists the 10 most recently recorded attendance entries for today (student name, class, and status).
- **Today's Birthdays panel:** shows any students whose birthday falls on today's date, with their photo and class name.
- **Monthly Summary panel:** a bar chart showing how many students were present, absent, late, or excused on each day of the current month.

### B. How to Use It

1. After logging in, the Dashboard loads automatically.
2. The four summary boxes update whenever new information is saved elsewhere in the system.
3. The **Fee Collection Summary** defaults to the current month and refreshes when you come back to the Dashboard.
4. The **Today's Birthdays** panel checks all students and highlights anyone whose birthday matches today's date.
5. The **Monthly Summary** bar chart shows one bar per day. Hover over a bar to see the exact numbers.
6. To act on anything you see, click the relevant section in the left-hand menu.

### C. Tips for Client Demo

- Open the Dashboard at the start of every demo — it makes an immediate visual impression with real numbers.
- If you want the Fee Collection Summary to show non-zero numbers, add a few fee records with payments before the demo.
- Birthday highlights are automatic — if any student's birthday is today, it appears without any extra setup.
- All the summary boxes load at the same time, so the page feels fast even on the first visit.

---

## 3. Students

### A. What It Does

The Students section manages the school's complete list of enrolled students. Each student record holds personal details (name, date of birth, gender), which class they are in, parent contact information, and an optional profile photo. You can add students one at a time, edit existing records, or import a large list all at once from a spreadsheet file.

### B. How to Use It

#### Viewing and Searching Students

1. Click **Students** in the left-hand menu.
2. Students are displayed as photo cards, 12 per page.
3. Use the **Search** bar (top left of the filter row) to search by student name, parent name, or parent email. Type your search and wait a moment — the list updates automatically.
4. Use the **Class** dropdown to show only students from a specific class.
5. Use the **Gender** dropdown to filter by Male or Female.
6. When a filter is active, a **Clear Filters** button appears — click it to remove all filters at once.
7. Use the **Previous / Next** buttons at the bottom to move between pages.

#### Adding a Student

1. Click the **Add Student** button (top right).
2. Fill in the required fields (marked with \*):
   - **Full Name** \*
   - **Date of Birth** \* (date picker)
   - **Gender** \* (Male / Female dropdown)
   - **Class** \* (dropdown of existing classes)
   - **Parent Name** \*
   - **Parent Email** \* (must be a valid email address)
   - **Parent Phone** \*
3. Optionally, click the photo upload area to select a profile photo (JPG, PNG, or SVG, max 2 MB). The photo is compressed automatically before uploading.
4. Click **Save**. A green confirmation message appears and the student list updates automatically.

#### Editing a Student

1. Find the student card on the Students page.
2. Click the **pencil (edit) icon** on the card.
3. The same form opens, already filled with the student's current information.
4. Make your changes and click **Save**.

**Note:** If you make changes and then try to close the form without saving, a pop-up window appears asking whether to keep or discard your unsaved changes.

#### Deleting a Student

1. Click the **bin (delete) icon** on the student card.
2. A confirmation pop-up appears showing the student's name.
3. Click **Delete** to confirm, or **Cancel** to go back.
4. The card disappears immediately. If something goes wrong, the card reappears and a red error message is shown.

#### Bulk Importing Students from a Spreadsheet

1. Click the **Import CSV** button on the Students page.
2. **Step 1 — Upload:** Drag and drop a spreadsheet file (CSV format) into the upload area, or click to browse your computer. Click **Download Sample CSV** to get a template with the correct column headings.

   The spreadsheet must include these columns (column names must be exact):

   | Column        | Description                               |
   | ------------- | ----------------------------------------- |
   | full_name     | Student's full name                       |
   | date_of_birth | Format: YYYY-MM-DD (e.g. 2019-04-15)      |
   | gender        | male or female (lowercase)                |
   | class_name    | Must match an existing class name exactly |
   | parent_name   | Parent or guardian name                   |
   | parent_email  | Valid email address                       |
   | parent_phone  | Phone number                              |

3. **Step 2 — Preview:** The system shows a table of all rows from your file. Rows with problems are highlighted in red with the reason (for example, "Missing full_name" or "Invalid email"). Valid rows show in green. Rows with problems will be skipped — they are not imported.
4. Click **Import Valid Rows** to continue.
5. **Step 3 — Result:** A summary shows how many students were imported successfully and lists any rows that were skipped, with their row number and the reason.

#### Viewing a Student Profile

1. Click the student's name or photo on a student card.
2. The Student Profile page opens.
3. The profile shows the student's full details (photo, name, class, parent contacts) and a strip of quick stats.
4. Below that, an **Attendance Heatmap** shows attendance across the past year at a glance (green = present, red = absent, grey = no record).
5. The **Attendance History** table shows individual attendance entries, 15 per page, with the date, status, and any notes.
6. Click **Edit Student** to open the edit form from this page.

### C. Tips for Client Demo

- Import the sample spreadsheet first to fill the roster quickly before a demo — it takes under 10 seconds to get 20 or more students into the system.
- Show the Class and Gender filters together to demonstrate how the system narrows down to specific groups (for example, "all girls in Class A").
- Click into a student profile and scroll to the heatmap — it is visually striking and immediately shows the depth of attendance tracking.
- Birthday badges appear automatically on any student card whose birthday is today.

---

## 4. Classes

### A. What It Does

The Classes section manages the school's classrooms. Each class record stores the class name, the assigned teacher, and the maximum number of students allowed. The system automatically shows how many students are currently enrolled in each class and highlights classes that are getting close to full.

### B. How to Use It

#### Viewing Classes

1. Click **Classes** in the left-hand menu.
2. Classes are shown as cards, 9 per page.
3. Each card shows the class name, teacher name, an enrollment bar showing how full the class is, and the student count.
4. The enrollment bar turns **red** when a class is at 90% or more of its capacity.
5. Use the **Search** bar to filter by class name or teacher name.

#### Adding a Class

1. Click **Add Class** (top right).
2. Fill in:
   - **Class Name** \* (e.g. "Kelas Bintang")
   - **Teacher Name** \*
   - **Capacity** \* (a number between 1 and 100; defaults to 25)
3. Click **Save**.

#### Editing a Class

1. Click the **pencil icon** on a class card.
2. Update the fields as needed.
3. Click **Save**.

**Note:** If you rename a class, the students already assigned to that class are not automatically updated. You will need to update each student's class separately.

#### Deleting a Class

1. Click the **bin icon** on the class card.
2. Confirm in the pop-up window.

### C. Tips for Client Demo

- Create 3 to 5 classes before a demo so the Students, Attendance, and Fee sections have real class options to filter by.
- Fill one class close to capacity to show the red capacity bar — it is an easy-to-understand at-a-glance warning.

---

## 5. Attendance

### A. What It Does

The Attendance section lets staff record daily attendance for all students. It supports four statuses: **Present**, **Absent**, **Late**, and **Excused**. Attendance is recorded once per student per day. If you mark a student again on the same day, the record is updated — not duplicated. The section also supports:

- Marking all students as Present in one click
- Saving all your changes in one go
- Filtering the view by status
- Downloading the day's attendance as a spreadsheet file
- Printing a blank or filled attendance sheet
- Live updates — if another staff member marks attendance on a different device, changes appear on your screen automatically

### B. How to Use It

#### Selecting a Date

1. Click **Attendance** in the left-hand menu.
2. The page defaults to today's date. Use the **date picker** at the top to switch to a different date.

#### Marking Attendance

1. The table shows all students, 20 per page.
2. Each row has four status buttons: **P** (Present), **A** (Absent), **L** (Late), **E** (Excused).
3. Click a button to mark that student with that status. The button highlights to show the selected status.
4. Your changes are held on screen but not yet saved. The row is lightly highlighted to show there are unsaved changes.
5. When you have marked all students, click **Save Changes** (this appears at the bottom of the page when there are unsaved changes, and shows how many changes are waiting to be saved).

#### Mark All Present

1. Click the **Mark All Present** button at the top of the table.
2. All students on the current page are marked Present instantly (not saved yet).
3. Click **Save Changes** to confirm.

#### Filtering by Status

- Click a status tab (**All**, **Present**, **Absent**, **Late**, **Excused**) above the table to filter what you see. This does not affect what is saved — it only changes the view.

#### Exporting to Spreadsheet

1. Click **Export CSV** (top right of the page).
2. A spreadsheet file downloads with all attendance records for the date currently selected.

#### Printing an Attendance Sheet

1. Click **Print Attendance** (top right).
2. A print preview pop-up window opens.
3. Choose **Filled** mode (shows the recorded statuses as tick marks) or **Blank** mode (empty checkbox cells for manual collection on paper).
4. Click **Print** to send to the printer.

### C. Tips for Client Demo

- Start the demo with today's date selected and all students unmarked. Click **Mark All Present** and then **Save Changes** to show how fast bulk marking works.
- Switch to the **Absent** tab after saving to show the filter — it will be empty, which demonstrates that everyone was marked present.
- Open the print preview in Blank mode to show the paper-based workflow — useful for schools that collect attendance on paper and enter it into the system later.
- If you have two browser windows open, mark a student in one window and show the other window updating automatically in real time.

---

## 6. Announcements

### A. What It Does

The Announcements section manages notices that appear on the school's public website. Each announcement has a title, body text, a category, an optional banner image, an optional "pinned" flag (pinned announcements always appear first), and an optional expiry date. Once an expiry date has passed, the announcement is automatically hidden from the public — no manual action needed.

Four categories are available: **General**, **Holiday**, **Event**, and **Reminder**. Each has a distinct colour badge for quick scanning.

### B. How to Use It

#### Viewing Announcements

1. Click **Announcements** in the left-hand menu.
2. Announcements are shown as cards, 9 per page.
3. Use the **Search** bar to filter by title or body text.
4. Use the **Category** dropdown to filter by category.
5. Pinned announcements show a pin badge. Expired announcements show a red "Expired" badge.

#### Adding an Announcement

1. Click **Add Announcement** (top right).
2. Fill in:
   - **Title** \*
   - **Body** \* (free-form text)
   - **Category** (General / Holiday / Event / Reminder)
   - **Pinned** toggle (turns yellow when active — pinned announcements appear at the top of the public page)
   - **Expiry Date** (optional — once this date passes, the announcement is automatically hidden from the public website; it stays visible in the admin list with an "Expired" badge)
   - **Banner Image** (optional — upload a JPG, PNG, or SVG; shown at the top of the card on the public website)
3. Click **Post Announcement**.

#### Editing an Announcement

1. Click the **pencil icon** on an announcement card.
2. Update as needed and click **Save**.

#### Deleting an Announcement

1. Click the **bin icon** on the card.
2. Confirm in the pop-up window.

### C. Tips for Client Demo

- Create one pinned General announcement and one Holiday announcement with an expiry date one week from now. This shows the two most common use cases at a glance.
- Open the public website in a second browser tab and refresh it after posting an announcement — the Notices section appears immediately with the new content.
- Show the expiry date feature by setting it to yesterday — the card still appears in the admin list (with the "Expired" badge) but does not appear on the public website, demonstrating automatic clean-up.

---

## 7. Gallery

### A. What It Does

The Gallery section manages photos displayed in the gallery area of the school's public website. Each photo has a caption, a display order number (lower numbers appear first), and a visibility toggle. Hidden photos are stored in the system but not shown to visitors.

### B. How to Use It

#### Viewing Gallery Photos

1. Click **Gallery** in the left-hand menu.
2. Photos are shown as cards, 9 per page, ordered by display order (lowest number first).
3. Each card shows the photo, a Visible/Hidden badge, the caption, and the display order number.
4. Use the **Search** bar to filter by caption.

#### Adding a Photo

1. Click **Add Photo** (top right).
2. Fill in:
   - **Photo** \* (required — click the upload area to select a JPG, PNG, or SVG; compressed automatically before upload)
   - **Caption** (optional text description)
   - **Display Order** (number, default 0 — lower numbers appear first on the public website)
   - **Visible** toggle (green when on — controls whether the photo appears on the public website)
3. Click **Save**.

#### Editing a Photo

1. Click the **pencil icon** on a gallery card.
2. Update the caption, order, or visibility as needed.
3. Click **Save**.

**Note:** Editing a photo record does not replace the image file. To swap the photo itself, delete the record and add a new one.

#### Deleting a Photo

1. Click the **bin icon** on the card.
2. Confirm in the pop-up window.

#### Reordering Photos

To change the order photos appear on the public website, edit each photo and update its **Display Order** number. Photos are sorted lowest to highest. For example, set your main photo to order 0 and other photos to 1, 2, 3, and so on.

### C. Tips for Client Demo

- Upload 4 to 6 real school photos before the demo. Show the gallery grid in the admin panel, then switch to the public website to show the same photos in the gallery section.
- Click one of the photos on the public website to show the lightbox: it opens full screen with a dark background, supports left/right navigation, and shows the caption.
- Toggle one photo to Hidden and refresh the public website to show it disappears instantly from public view without being deleted.

---

## 8. Fees

### A. What It Does

KinderCare includes a complete fee collection section covering:

- **Fee Plans** — reusable templates (type, amount, description) that can be applied in bulk to a whole class or all students at once
- **Fee Records** — individual charges per student, with support for partial payments, discounts, waivers, and automatic receipt number generation
- **Multiple printable documents** — receipts, invoices, overdue notices, enrollment letters, class collection sheets, monthly reports, annual reports, and per-student fee statements
- **Dashboard summary** — monthly totals appear on the Dashboard at a glance

#### How Fee Status Works

The system works out the status of each fee record automatically based on the payment amounts:

| Status      | When it applies                                                      |
| ----------- | -------------------------------------------------------------------- |
| **Waived**  | The discount covers the full amount owed                             |
| **Paid**    | The amount paid covers the full amount after any discount            |
| **Partial** | Some payment has been made but the full amount has not yet been paid |
| **Unpaid**  | No payment has been made yet                                         |

#### Key Rules

- **Only Unpaid records can be deleted.** Records with any payment made are kept permanently for audit purposes.
- **Receipt numbers must be configured before recording any payment.** The format is set in Settings > Document Numbering.
- Payments cannot exceed the remaining balance on a record.

### B. How to Use It

#### Setting Up — Receipt Numbering (Do This First)

Before recording any payments, set up the receipt number format:

1. Go to **Settings** > **Document Numbering**.
2. Build the format using segments (see the [Settings section](#9-settings) for full details).
3. A common format is: `RCP-` (fixed text) + Year (automatic) + `-` (fixed text) + Serial number (4 digits, resets each year).
4. Click **Save Format**. The next receipt issued will use this format.

#### Managing Fee Plans

1. Click **Fee Plans** in the left-hand menu.
2. Fee plan cards show the name, type, and amount.
3. Click **Add Fee Plan** to create a template:
   - **Name** \*
   - **Type** \* (Tuition / Activity / Uniform / Registration / Other)
   - **Amount** \* (positive number)
   - **Description** (optional)
4. To apply a plan and create fee records from it, click the **lightning bolt (Use Plan)** icon on any plan card.

#### Generating Fee Records in Bulk

1. From the Fee Plans page or the Fees page, click **Generate Fees** (blue button).
2. **Step 1 — Fee Details:** Choose to use an existing Fee Plan or enter a Custom Fee (type, amount, and description) manually.
3. **Step 2 — Target:** Select which class will receive the fee (or choose "All Students") and set an optional due date.
4. **Step 3 — Confirm:** Review the summary, which shows how many students will receive a new fee record. Click **Generate** to create all records at once.
5. A green confirmation message appears showing how many records were created.

#### Adding a Single Fee Record

1. On the **Fees** page, click **Add Fee Record** (orange button, top right).
2. Select the **Student** from the dropdown.
3. Fill in:
   - **Type** \* (Tuition / Activity / Uniform / Registration / Other)
   - **Description** \*
   - **Amount Owed** \*
   - **Discount Amount** (default 0)
   - **Discount Reason** (appears when a discount is entered)
   - **Due Date** (optional)
4. Click **Save**.

#### Recording a Payment

1. On the Fees table, find the fee record and click **Pay** (the green button in that row).
2. A pop-up window shows:
   - The student name and fee description
   - A balance breakdown (amount owed, any discount, any amount already paid, and the remaining balance)
   - A payment amount field filled with the full remaining balance
3. Adjust the amount if the parent is making a partial payment.
4. Click **Record Payment**.
5. A receipt is generated automatically and the receipt view opens so you can print it.

**Note:** If receipt numbering has not been set up, the **Record Payment** button is disabled and a warning message is shown. Go to Settings > Document Numbering to set it up first.

#### Filtering Fee Records

The Fees table has four filters that can be used at the same time:

- **Search** — searches by student name
- **Status** — All / Unpaid / Partial / Paid / Waived
- **Month** — filters by the fee's due date month
- **Class** — filters by the student's class

#### Printing Documents from a Fee Record

Each row in the Fees table has action buttons. Available documents to print:

| Action                  | Document                                           | Best used for                 |
| ----------------------- | -------------------------------------------------- | ----------------------------- |
| Print Receipt           | Payment receipt                                    | After recording a payment     |
| Print Invoice           | Formal fee invoice                                 | Billing parents in advance    |
| Print Overdue Notice    | Invoice showing days overdue and a signature block | Chasing unpaid accounts       |
| Print Enrollment Letter | Formal enrollment confirmation letter              | Registration fee, paid status |

#### Class Collection Sheet

1. Click **Print Collection Sheet** at the top of the Fees page.
2. Select a **Class** and a **Month**.
3. A printable table appears listing every student in the class and their fee records for that month, with blank "Collected" tick boxes and a Remarks column.
4. Click **Print**.
5. The sheet includes signature blocks for "Prepared By" and "Verified By".

#### Monthly Collection Report

1. Click **Monthly Report** at the top of the Fees page.
2. Select a **Month**.
3. The report shows four summary boxes, a breakdown by class, a breakdown by fee type, and a list of outstanding accounts.
4. Click **Print**. This report should be printed in landscape orientation (sideways).

#### Annual Report

1. Click **Annual Report** at the top of the Fees page.
2. Select a **Year** from the dropdown.
3. The report shows a four-stat summary, a table broken down by fee type with totals, the collection rate percentage (shown in green if 90% or above, amber if 70–89%, or red if below 70%), and a record count summary.
4. Click **Print Annual Report**.

#### Fee Statement (Per Student)

1. From a student's fee record row, click the Statement link. Or navigate to the fee statement page for that student through the main menu.
2. Select a **Year**.
3. Optionally toggle **Ledger View** to switch between a standard fee list and a running-balance format.
4. Click **Print Statement**.
5. The statement footer includes a note about child education tax relief eligibility (for Malaysian income tax purposes, LHDN).

### C. Tips for Client Demo

- Generate fees for a whole class in one action to show the bulk power — 20 students get records in under 3 seconds.
- Record a partial payment on one record, then show the status changing from **Unpaid** to **Partial**. Then record the remaining balance and show it flip to **Paid**.
- Print a receipt immediately after recording a payment — the school logo, receipt number, and full breakdown appear.
- Open the Monthly Report and Annual Report to show the financial overview depth.
- The Collection Rate percentage on the Annual Report is colour-coded — this is a strong visual for parent meetings or board presentations.

---

## 9. Settings

### A. What It Does

Settings is split into three sections:

- **School Info** — the school's name, address, contact details, social media links, operating hours, and logo. This information appears on all printed documents.
- **Document Numbering** — sets the format of receipt numbers using a visual builder.
- **Appearance** — switches dark mode on or off, and changes the interface language between English and Bahasa Malaysia.

### B. How to Use It

#### School Info

1. Go to **Settings** > **School Info**.
2. Fill in any of the following fields:
   - **Logo** — click the upload square to select a photo (max 2 MB; resized automatically)
   - **School Name** — appears on all printed documents (receipts, reports, statements)
   - **Address** — appears on printed documents below the school name
   - **Phone** — contact number
   - **Email** — contact email
   - **Principal Name** — used on overdue notices and enrollment letters
   - **Registration Number** — appears on invoices, overdue notices, enrollment letters, the annual report, and class collection sheets
   - **WhatsApp Number** — digits only, 7–15 characters
   - **Operating Hours** — a grid showing each day of the week with opening and closing time pickers. Days with no times entered show "Closed"
   - **Google Maps Embed** — paste the link from Google Maps > Share > Embed a map
   - **Facebook URL** — full address to the school's Facebook page
   - **Instagram URL** — full address to the school's Instagram profile
3. Click **Save** when done. A green confirmation message appears.

**Important:** The **Save** button is not active until you make at least one change.

#### Document Numbering

1. Go to **Settings** > **Document Numbering**.
2. The receipt number format is built from a list of **segments**. Each segment is one part of the number.
3. Add segments using the **Add Segment** button. Available segment types:

   | Type     | Description                                               | Example |
   | -------- | --------------------------------------------------------- | ------- |
   | Constant | Fixed text you type yourself                              | RCP-    |
   | Year     | Current year, filled in automatically                     | 2026    |
   | Month    | Current month, filled in automatically (2 digits)         | 03      |
   | Serial   | A number that counts up automatically, with leading zeros | 0001    |

4. For a **Serial** segment, configure:
   - **Total characters** (1–20) — how many digits, padded with zeros (for example, 4 gives you 0001)
   - **Reset by** — Never (counts up forever), Monthly (resets to 1 at the start of each month), or Yearly (resets to 1 on 1 January)
   - **Start from** — the starting number (default 1)

5. The **live preview** (orange box) shows what the next receipt number will look like based on your segments.
6. Only one Serial segment is allowed per format.
7. Click **Save Format**.

   **Warning:** If you change the format after receipts have already been issued, a confirmation message will warn you that the appearance of future numbers will change. The counter itself is kept from where it left off.

**Recommended receipt format for a typical school:**

`RCP-` (constant) + `2026` (year) + `-` (constant) + `0001` (serial, 4 digits, reset yearly)

This produces: RCP-2026-0001, RCP-2026-0002, and so on.

#### Appearance

1. Go to **Settings** > **Appearance**.
2. **Dark Mode** — click the toggle switch. When active (orange), the entire admin area switches to a dark colour scheme. This setting is saved to your browser and restores automatically on your next visit.
3. **Language** — click **EN** or **BM** to switch all labels and text in the interface between English and Bahasa Malaysia. This setting is also saved to your browser.

### C. Tips for Client Demo

- Fill in the School Info completely before any demo — the school name and logo appear on every printed document. A demo that says "KinderCare" on receipts instead of the actual school name is less convincing.
- Build the receipt format live during the demo: add a Constant segment, type `RCP-`, add a Year segment, add another Constant `-`, then add a Serial segment. The preview updates in real time as each segment is added.
- Toggle dark mode live to show the interface adapts instantly with no page reload.
- Switch the language to BM and show that all menu labels and form labels change — strong proof of localisation for Malaysian schools.

---

## 10. Landing Page (Public Site)

### A. What It Does

The public website is a marketing page for the school. It is separate from the admin area and requires no login to view. It pulls real information from the system:

- **Gallery section** — shows published (visible) gallery photos with a lightbox viewer
- **Notices section** — shows active (not yet expired) announcements
- **Testimonials section** — shows a rotating carousel of visible parent testimonials
- **Stats section** — shows animated counters (students enrolled, classes, years established, attendance rate)

The public website also includes dark mode and language toggles in the top navigation bar — the same settings used in the admin area.

### B. How to Use It

The public website is viewed by anyone who visits the school's web address. There is no admin action required beyond keeping the content sections (Gallery, Announcements, Testimonials) up to date in the admin area.

**Navigation links on the public website:**

- **About** — scrolls to the Features section
- **Programs** — scrolls to the Programs section
- **Gallery** — scrolls to the gallery section
- **Notices** — scrolls to the announcements section
- **Contact** — scrolls to the contact section

A **scroll-to-top button** appears in the bottom-right corner after scrolling down the page.

The **Admin Login** link in the top navigation bar (a lock icon on mobile, "Admin Login" on desktop) takes staff to the login page.

### C. Tips for Client Demo

- Keep the admin area open in one browser tab and the public website open in another. Add an announcement in the admin area, then refresh the public website to show it appearing immediately.
- Click a gallery photo to demonstrate the lightbox — it opens full screen with a dark background and supports left/right navigation.
- Scroll through all sections smoothly to show the layout: hero section with animated bear mascot, stats with counting animation, features, gallery, notices, testimonials carousel, call-to-action, and footer.
- The testimonials carousel advances automatically every 4 seconds and pauses when you hover over it — point this out during the demo.

---

## 11. Testimonials

### A. What It Does

The Testimonials section manages parent quotes displayed on the public website in a rotating carousel. Each testimonial has the parent's name, an optional role (for example, "Parent of Year 1"), the quote text, an optional profile photo, a display order number, and a visibility toggle.

### B. How to Use It

#### Viewing Testimonials

1. Click **Testimonials** in the left-hand menu.
2. Testimonials are shown as cards, 9 per page.
3. Each card shows the profile photo (or initials if no photo was uploaded), the parent name, role, quote, and a Visible/Hidden badge.
4. Use the **Search** bar to filter by name or quote text.

#### Adding a Testimonial

1. Click **Add Testimonial** (top right).
2. Fill in:
   - **Parent Name** \*
   - **Role** (optional — for example, "Parent of Aishah, Year 1")
   - **Quote** \* (the testimonial text)
   - **Display Order** (number — lower numbers appear earlier in the carousel)
   - **Visible** toggle (green when on — controls whether this testimonial appears on the public website)
   - **Profile Photo** (optional — JPG or PNG, max 2 MB; if not uploaded, the carousel shows the parent's initials in a coloured circle)
3. Click **Save**.

#### Editing or Deleting a Testimonial

1. Click the **pencil icon** to edit or the **bin icon** to delete.
2. Deletion requires confirmation in a pop-up window.

### C. Tips for Client Demo

- Add 3 to 4 testimonials with different display orders and make them all visible.
- Scroll to the testimonials section on the public website and let it advance automatically to show the carousel animation.
- Show the initials fallback by adding a testimonial without a photo — the system generates an initials badge automatically.
- Toggle a testimonial's visibility off in the admin, then refresh the public website to show it disappears from the carousel immediately.

---

## Appendix A — Shortcuts and Power-User Tips

### Navigation

| Action                          | Method                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| Jump to any section             | Click the section name in the left-hand menu                                |
| Open the menu on mobile         | Tap the hamburger (three-line) icon in the top bar                          |
| Scroll to top of public website | Click the scroll-to-top button (bottom-right, appears after scrolling down) |

### Attendance

- **Mark all present quickly:** Click **Mark All Present** then immediately click **Save Changes** — the entire class is recorded in two clicks.
- **Fix a wrong status:** Click a different status button on the same row. Your change is updated on screen. Nothing is saved until you click Save Changes.
- **Use the status filter tabs** to quickly count how many students are absent on a given day without leaving the page.

### Students

- **Bulk import saves the most time** when starting a new school year. Prepare the spreadsheet in Excel or Google Sheets, download the sample file from the import pop-up to get the correct column names, then import.
- **Search works across student name, parent name, and parent email** — you can find a student by searching the parent's name even if you cannot remember the child's full name.
- **Class filter and Gender filter** can be used together: for example, "Girls in Kelas Bintang" uses both dropdowns at the same time.

### Fees

- **Set up Document Numbering before anything else** — the Record Payment button is disabled until a receipt format is saved.
- **Generate fees in bulk** at the start of each month: select the tuition plan, choose "All Students", set the due date, and confirm. All records are created in one action.
- **Download all fee records** on the Fees page using the export button. Apply the Month filter first to download only a specific month.
- **The Collection Rate** on the Annual Report is colour-coded: green (90% and above), amber (70–89%), red (below 70%) — useful for board reporting.

### Printing

- All print options open the browser's built-in print dialog.
- Set paper size to **A4 Portrait** for most documents. The **Monthly Collection Report** is the exception — set it to **A4 Landscape** (sideways).
- When you print, only the document itself is printed, not the rest of the screen.

### Settings

- The **dark mode toggle** and **language toggle** are also available from the left-hand menu footer (click the small arrow above your user name to expand the panel) — you do not need to go to the Settings page to switch them.
- Changes to School Info are reflected on all newly printed documents immediately after saving. Documents already printed are not affected.

---

## Appendix B — Error Messages Reference

| Message                                                          | What it means                                                                  | What to do                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| "Too many attempts. Please try again later."                     | You have entered the wrong password too many times                             | Wait 60 seconds, then try again                                                                     |
| "Invalid email or password."                                     | The login details are incorrect                                                | Check your email and password; contact your system administrator if you cannot log in               |
| "Failed to save school info. Please try again."                  | Something went wrong when saving Settings > School Info                        | Check your internet connection and try again                                                        |
| "Logo upload failed. Please try again."                          | The photo could not be saved                                                   | Check that the file is under 2 MB and try again; contact your administrator if it keeps failing     |
| "Fee record created" / "Fee record updated" (green message)      | Success                                                                        | No action needed                                                                                    |
| "Failed to save. Please try again." (fees)                       | Something went wrong saving a fee record                                       | Try again; contact your administrator if the problem continues                                      |
| "Failed to remove. Please try again."                            | The deletion did not go through                                                | The item reappears; try again or contact your administrator                                         |
| "Receipt numbering not configured" (amber box in payment window) | No receipt format has been saved                                               | Go to Settings > Document Numbering and save a receipt format                                       |
| "Payment cannot exceed remaining balance."                       | The amount entered is more than what is owed                                   | Enter an amount equal to or less than the remaining balance shown                                   |
| "Only unpaid fee records can be deleted."                        | You are trying to delete a record that has already been paid or partially paid | You cannot delete paid records. Apply a full discount (waiver) if the record needs to be zeroed out |
| "Failed to generate fees."                                       | Bulk fee creation did not work                                                 | Check that the selected plan exists and the target class has students; try again                    |
| "Failed to export."                                              | The spreadsheet download did not work                                          | Try again; apply filters to narrow the data set and try again if it continues                       |
| "Student not found."                                             | The system cannot find the student record being looked for                     | Go back to the Students list and click the correct student card                                     |
| "Logo upload failed" (student / gallery / announcement)          | A photo upload failed in one of the content sections                           | Check the file is under 2 MB and try again; contact your administrator if it persists               |

---

## Appendix C — Printing Guide

All print documents use the browser's built-in print function. No extra software or third-party printer drivers are needed.

### Print Documents Overview

| Document                  | Accessed from                                                         | Paper size | Orientation |
| ------------------------- | --------------------------------------------------------------------- | ---------- | ----------- |
| Payment Receipt           | Fees table row > Print Receipt (or opens automatically after payment) | A4         | Portrait    |
| Fee Invoice               | Fees table row > Print Invoice                                        | A4         | Portrait    |
| Overdue Notice            | Fees table row > Print Overdue Notice                                 | A4         | Portrait    |
| Enrollment Letter         | Fees table row > Print Enrollment Letter                              | A4         | Portrait    |
| Class Collection Sheet    | Fees page > Print Collection Sheet                                    | A4         | Portrait    |
| Monthly Collection Report | Fees page > Monthly Report > Print                                    | A4         | Landscape   |
| Annual Report             | Fees page > Annual Report > Print Annual Report                       | A4         | Portrait    |
| Fee Statement             | Student fee statement page > Print Statement                          | A4         | Portrait    |
| Attendance Sheet (Filled) | Attendance page > Print Attendance > Filled                           | A4         | Portrait    |
| Attendance Sheet (Blank)  | Attendance page > Print Attendance > Blank                            | A4         | Portrait    |

### Before Printing

1. Make sure **School Info** is fully filled in under Settings (school name, address, logo, registration number, principal name). These fields populate the header of every document.
2. In your browser's print dialog, turn off "Headers and footers" if your browser adds the web address and date to the printout. In Chrome: Print > More Settings > uncheck "Headers and footers".
3. Set **Margins** to "Default" or "Minimum" in the print dialog for the best layout.

### How to Print Each Document

**Payment Receipt:**

1. Record a payment on a fee record. The receipt view opens automatically.
2. Alternatively, click **Print Receipt** from the row actions on any fully or partially paid record.
3. Click the **Print** button in the receipt view.
4. The print dialog opens. Confirm A4 Portrait and click Print.

**Fee Invoice:**

1. Click **Print Invoice** from the row actions on any fee record.
2. The invoice opens in a pop-up window.
3. Click **Print** in the pop-up.

**Overdue Notice:**

1. Click **Print Overdue Notice** from the row actions.
2. The notice shows how many days overdue the payment is (highlighted in red) and includes a space for the principal's signature.
3. Click **Print**.

**Enrollment Letter:**

1. Click **Print Enrollment Letter** from the row actions.
2. Most useful for Registration-type fee records that have been fully paid.
3. Click **Print**.

**Class Collection Sheet:**

1. Click **Print Collection Sheet** at the top of the Fees page.
2. Select the class and month.
3. Review the sheet (students are listed with their fee rows, each with a blank tick box).
4. Click **Print**.

**Monthly Collection Report:**

1. Click **Monthly Report** at the top of the Fees page.
2. Select the month.
3. Click **Print** in the pop-up.
4. Set the orientation to **Landscape** (sideways) in the print dialog.

**Annual Report:**

1. Click **Annual Report** at the top of the Fees page.
2. Select the year.
3. Click **Print Annual Report**.

**Fee Statement (for parents or tax purposes):**

1. Open the student's fee statement page through the Fees section.
2. Select the year.
3. Optionally turn on **Ledger View** for a running-balance format.
4. Click **Print Statement**.
5. The footer includes a note about child education tax relief under the Malaysian Income Tax Act (LHDN).

**Attendance Sheet:**

1. On the Attendance page, select the date.
2. Click **Print Attendance**.
3. Choose **Filled** (shows the recorded statuses as tick marks) or **Blank** (empty tick boxes for collecting attendance on paper).
4. Click **Print**.

### Print Troubleshooting

| Problem                                                             | Solution                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| School logo does not appear on the printout                         | Make sure the logo is saved in Settings > School Info                          |
| School name shows as "KinderCare" instead of the actual school name | Enter the school name in Settings > School Info and save                       |
| Printout includes the browser address bar or page title             | In your browser's print dialog, turn off "Headers and footers"                 |
| Monthly Report is cut off on the right edge                         | Set the orientation to Landscape (sideways) in the print dialog                |
| A blank page appears after the document                             | Set margins to "Minimum" or "None" in the print dialog                         |
| Receipt number looks like a test value                              | Go to Settings > Document Numbering, set your real prefix, and save the format |
