// Shared types between frontend and backend.
// Both packages import from '@kindergarten/types' — do not duplicate these elsewhere.

export interface Student {
  id: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  class_name: string
  parent_name: string
  parent_email: string
  parent_phone: string
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
  students?: Pick<Student, 'full_name' | 'class_name' | 'photo_url'>
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
  due_date?: string
  paid_at?: string
  created_at: string
  // Joined from students table (Supabase FK join)
  students?: {
    full_name: string
    class_name: string
    photo_url?: string
  } | null
}

export interface FeesSummary {
  total_owed: number
  total_paid: number
  total_outstanding: number
  overdue_count: number
}
