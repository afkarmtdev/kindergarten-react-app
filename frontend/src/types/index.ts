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
  students?: Pick<Student, 'full_name' | 'class_name' | 'photo_url'>
}

export interface ClassRoom {
  id: string
  name: string
  teacher_name: string
  capacity: number
  created_at: string
  students?: Student[]
}

export interface AttendanceSummary {
  present: number
  absent: number
  late: number
  excused: number
}

export interface GalleryItem {
  id: string
  photo_url: string
  caption?: string
  display_order: number
  is_visible: boolean
  created_at: string
}
