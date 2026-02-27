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
}

export interface ClassRoom {
  id: string
  name: string
  teacher_name: string
  capacity: number
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'teacher' | 'staff'
}
