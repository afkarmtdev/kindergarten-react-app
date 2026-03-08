// Shared types between frontend and backend.
// Both packages import from '@kindergarten/types' — do not duplicate these elsewhere.

export interface StudentParent {
  full_name: string
  email: string | null
  phone: string
}

export interface Student {
  id: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  class_id?: string | null
  class_name?: string | null // derived via join with classrooms; not stored on the row
  parent?: StudentParent | null // derived via join through parent_students → parents
  photo_url?: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  recorded_by: string
  created_at: string
  // Populated by Supabase join on the frontend — not present in backend responses
  students?: Pick<Student, 'full_name' | 'photo_url'> & { class_name?: string | null }
}

export interface ClassRoom {
  id: string
  name: string
  teacher_name: string
  capacity: number
  created_at: string
  // Populated on the backend /classes/:id route and included in list responses
  student_count?: number
  students?: Student[]
}

export interface GalleryItem {
  id: string
  photo_url: string
  caption?: string
  display_order: number
  is_visible: boolean
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  category: 'general' | 'holiday' | 'event' | 'reminder'
  image_url?: string
  is_pinned: boolean
  expires_at?: string
  created_at: string
}

// Frontend-only
export interface AttendanceSummary {
  present: number
  absent: number
  late: number
  excused: number
}

// Backend-only
export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'teacher' | 'staff'
}

// ─── Document Numbering ───────────────────────────────────────────────────────
export type SegmentResetBy = 'no_reset' | 'monthly' | 'yearly'

export interface DocumentSegment {
  order: number
  type: 'constant' | 'year' | 'month' | 'serial'
  value?: string
  total_chars?: number
  reset_by?: SegmentResetBy
  start_from?: number
}

export interface DocumentNumberingConfig {
  id: string
  document_type: string
  segments: DocumentSegment[]
  current_serial: number
  last_reset_at: string | null
  updated_at: string
}

// ─── Fees ─────────────────────────────────────────────────────────────────────
export type FeeType = 'tuition' | 'activity' | 'uniform' | 'registration' | 'other'
export type FeeStatus = 'unpaid' | 'partial' | 'paid' | 'waived'

export interface FeePlan {
  id: string
  name: string
  type: FeeType
  amount: number
  description?: string
  created_at: string
}

export interface FeeRecord {
  id: string
  student_id: string
  type: FeeType
  description: string
  amount_owed: number
  amount_paid: number
  discount_amount: number
  discount_reason?: string
  receipt_number?: string
  status: FeeStatus
  due_date?: string | null
  paid_at?: string | null
  created_at: string
  // Joined from students table via FK; backend flattens classrooms(name) → class_name before returning
  students?: {
    full_name: string
    class_name?: string | null // derived via classrooms join; not a DB column on students
    photo_url?: string
    parent_name?: string
  } | null
}

// Returned by PUT /api/fees/:id/payment — includes the payment amount recorded this call
export type FeePaymentResponse = FeeRecord & { this_payment: number }

export interface FeesSummary {
  total_owed: number
  total_paid: number
  total_outstanding: number
  overdue_count: number
}

// ─── Dashboard Chart Types ────────────────────────────────────────────────────

export interface AttendanceTrendPoint {
  month: string // "YYYY-MM"
  total: number
  present: number
  rate: number // 0–100
}

export interface FeeCollectionTrendPoint {
  month: string // "YYYY-MM"
  owed: number
  collected: number
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
export interface Testimonial {
  id: string
  parent_name: string
  parent_role?: string
  quote: string
  avatar_url?: string
  display_order: number
  is_visible: boolean
  created_at: string
}

// ─── School Info ──────────────────────────────────────────────────────────────
export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface DayHours {
  open: string // "07:30" or "" (blank = closed)
  close: string // "18:00" or "" (blank = closed)
}

export type OperatingHours = Record<DayKey, DayHours>

export interface SchoolInfo {
  id: string
  school_name: string
  address: string
  phone: string
  email: string
  logo_url: string | null
  updated_at: string
  whatsapp_number: string
  operating_hours: OperatingHours | null
  google_maps_embed_url: string
  facebook_url: string
  instagram_url: string
  principal_name: string
  registration_number: string
}

// ─── Finance Document Report Types ────────────────────────────────────────────
export interface ClassSheetStudentRow {
  student_id: string
  student_name: string
  records: {
    id: string
    description: string
    type: FeeType
    due_date: string | null
    amount_owed: number
    discount_amount: number
    amount_paid: number
    status: FeeStatus
  }[]
}

export interface ClassSheetResponse {
  class_name: string
  month: string
  students: ClassSheetStudentRow[]
  totals: {
    amount_owed: number
    amount_paid: number
    balance: number
  }
}

export interface MonthlyReportByClass {
  class_name: string
  student_count: number
  charged: number
  collected: number
  discount: number
  outstanding: number
  unpaid_count: number
  partial_count: number
}

export interface MonthlyReportByType {
  type: FeeType
  charged: number
  collected: number
  outstanding: number
}

export interface MonthlyReportOutstandingItem {
  student_name: string
  class_name: string
  description: string
  due_date: string | null
  amount_owed: number
  amount_paid: number
  balance: number
}

export interface MonthlyReportResponse {
  month: string
  totals: {
    charged: number
    collected: number
    outstanding: number
    record_count: number
  }
  by_class: MonthlyReportByClass[]
  by_type: MonthlyReportByType[]
  outstanding_accounts: MonthlyReportOutstandingItem[]
}

// ─── Annual Report ────────────────────────────────────────────────────────────
export interface AnnualReportByType {
  type: FeeType
  total_owed: number
  total_paid: number
  total_discounts: number
  outstanding: number
}

export interface AnnualReportResponse {
  year: number
  by_type: AnnualReportByType[]
  totals: {
    total_owed: number
    total_paid: number
    total_discounts: number
    outstanding: number
    record_count: number
    paid_count: number
    overdue_count: number
  }
}

// ─── Art Wall ─────────────────────────────────────────────────────────────────
export interface ArtWallItem {
  id: string
  photo_url: string
  caption?: string
  student_id?: string | null
  student_name?: string | null
  artwork_date?: string | null
  display_order: number
  is_visible: boolean
  tilt_angle: number | null // null = auto (getRotation hash); range: -15 to 15
  created_at: string
}

// ─── Parents ──────────────────────────────────────────────────────────────────

export type ParentRelationship = 'parent' | 'guardian' | 'step_parent' | 'other'

export interface Parent {
  id: string
  full_name: string
  email: string | null
  phone: string
  access_code: string | null
  portal_pin_hash?: string | null
  created_at: string
  // Populated via join in list/detail responses
  children?: ParentChild[]
  children_count?: number
}

export interface ParentChild {
  id: string
  full_name: string
  class_name: string | null
  photo_url: string | null
  relationship: ParentRelationship
}

export interface ParentStudent {
  id: string
  parent_id: string
  student_id: string
  relationship: ParentRelationship
  created_at: string
}

// ─── Parent Portal ────────────────────────────────────────────────────────────

export interface PortalStudent {
  id: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  class_name?: string | null
  photo_url?: string
}

export interface PortalParent {
  id: string
  full_name: string
  email: string | null
  phone: string
  children: PortalChild[]
}

export interface PortalChild {
  id: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  class_name: string | null
  photo_url: string | null
  relationship: ParentRelationship
}

export interface DailyReport {
  id: string
  student_id: string
  report_date: string
  meals_eaten: 'all' | 'most' | 'some' | 'none' | null
  nap_minutes: number | null
  toilet_count: number | null
  mood: 'happy' | 'okay' | 'tired' | 'upset' | null
  activity_note: string | null
  photo_url: string | null
  recorded_by: string | null
  created_at: string
}

export type PortfolioDomain =
  | 'physical'
  | 'cognitive'
  | 'language'
  | 'social_emotional'
  | 'creative'

export interface PortfolioEntry {
  id: string
  student_id: string
  domain: PortfolioDomain
  observation: string
  photo_url: string | null
  term: string
  recorded_by: string | null
  entry_date: string
  created_at: string
}

export interface PortfolioReport {
  id?: string
  student_id: string
  term: string
  teacher_comment: string | null
  principal_comment: string | null
  generated_at: string
}

// ─── Inquiries ─────────────────────────────────────────────────────────────────
export interface Inquiry {
  id: string
  parent_name: string
  child_name: string
  child_age: number
  phone: string
  message?: string
  created_at: string
}
