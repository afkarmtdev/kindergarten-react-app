import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HeartPulse, Pencil, Plus, Stethoscope } from 'lucide-react'
import { medicalProfilesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { MedicalProfileModal } from '@/components/admin/MedicalProfileModal'
import type { StudentMedical } from '@/types'

interface Props {
  studentId: string
}

export function MedicalProfileCard({ studentId }: Props) {
  const t = useT()
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['medical-profile', studentId],
    queryFn: () => medicalProfilesApi.get(studentId),
    enabled: !!studentId,
  })

  const profile: StudentMedical | null = data?.data ?? null

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mt-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mt-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('medicalProfile')}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-kinder-orange hover:text-kinder-orange dark:hover:text-kinder-orange transition-all"
          >
            {profile ? (
              <>
                <Pencil size={12} />
                Edit
              </>
            ) : (
              <>
                <Plus size={12} />
                {t('addMedicalInfo')}
              </>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {!profile ? (
            <div className="py-6 text-center">
              <Stethoscope
                className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600"
                strokeWidth={1.5}
              />
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('noMedicalProfile')}</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 text-xs font-semibold text-kinder-orange hover:opacity-80 transition-opacity"
              >
                {t('addMedicalInfo')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Blood Type */}
              {profile.blood_type && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 shrink-0">
                    {t('bloodType')}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    {profile.blood_type === 'unknown' ? 'Unknown' : profile.blood_type}
                  </span>
                </div>
              )}

              {/* Allergies */}
              {profile.allergies.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 shrink-0 pt-0.5">
                    {t('allergies')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.allergies.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Conditions */}
              {profile.medical_conditions.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 shrink-0 pt-0.5">
                    {t('medicalConditions')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.medical_conditions.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {profile.medications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    {t('medications')}
                  </p>
                  <div className="space-y-1">
                    {profile.medications.map((med, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg"
                      >
                        <span className="font-semibold">{med.name}</span>
                        {med.dosage && (
                          <span className="text-gray-400 dark:text-gray-500">{med.dosage}</span>
                        )}
                        {med.frequency && (
                          <span className="text-gray-400 dark:text-gray-500 ml-auto">
                            {med.frequency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vaccination Records */}
              {profile.vaccination_records.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    {t('vaccinationRecords')}
                  </p>
                  <div className="space-y-1">
                    {profile.vaccination_records.map((vax, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg"
                      >
                        <span className="font-semibold">{vax.name}</span>
                        {vax.date && (
                          <span className="text-gray-400 dark:text-gray-500">
                            {new Date(vax.date + 'T00:00:00').toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contacts */}
              {profile.emergency_contacts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    {t('emergencyContacts')}
                  </p>
                  <div className="space-y-1.5">
                    {profile.emergency_contacts.map((contact, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold">{contact.name}</span>
                          {contact.relationship && (
                            <span className="text-gray-400 dark:text-gray-500 ml-1.5">
                              ({contact.relationship})
                            </span>
                          )}
                        </div>
                        {contact.phone && (
                          <span className="text-gray-500 dark:text-gray-400 shrink-0">
                            {contact.phone}
                          </span>
                        )}
                        {contact.is_primary && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-kinder-green/20 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {t('isPrimary')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Info */}
              {(profile.doctor_name || profile.doctor_phone) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 shrink-0">
                    {t('doctorName')}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {profile.doctor_name}
                    {profile.doctor_phone && (
                      <span className="ml-2 text-gray-400 dark:text-gray-500">
                        {profile.doctor_phone}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Medical Notes */}
              {profile.medical_notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {t('medicalNotes')}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                    {profile.medical_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MedicalProfileModal
        show={modalOpen}
        studentId={studentId}
        profile={profile}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
