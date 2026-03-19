-- 007: Medical Profiles + Incident Reports

-- ─── Student Medical Profiles (1:1 per student) ────────────────────────────
CREATE TABLE IF NOT EXISTS student_medical (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  blood_type TEXT CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  allergies JSONB DEFAULT '[]'::jsonb,
  medical_conditions JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  vaccination_records JSONB DEFAULT '[]'::jsonb,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  doctor_name TEXT,
  doctor_phone TEXT,
  insurance_info TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  modified_at TIMESTAMPTZ,
  modified_by TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT,
  UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_medical_student_id ON student_medical(student_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE student_medical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access to student_medical"
  ON student_medical FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Incidents ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  incident_time TIME,
  type TEXT NOT NULL CHECK (type IN ('injury','illness','behavioral','allergic_reaction','other')),
  severity TEXT NOT NULL CHECK (severity IN ('minor','moderate','serious')),
  location TEXT,
  description TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  witnessed_by TEXT,
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMPTZ,
  photo_url TEXT,
  follow_up_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  modified_at TIMESTAMPTZ,
  modified_by TEXT,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_incidents_student_id ON incidents(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access to incidents"
  ON incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
