import { useQuery } from '@tanstack/react-query'
import {
  HeartPulse,
  Droplets,
  Pill,
  Syringe,
  Phone,
  Stethoscope,
  ShieldAlert,
  Star,
  User,
} from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { StudentMedical } from '../../types'

export default function PortalMedicalPage() {
  usePageTitle('Medical Profile')
  const { selectedChild } = useParentAuth()
  const t = useT()

  const { data, isLoading } = useQuery({
    queryKey: ['portal-medical', selectedChild?.id],
    queryFn: () => portalDataApi.getMedical(selectedChild?.id),
    enabled: !!selectedChild,
  })

  const medical: StudentMedical | null = data?.data ?? null

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <HeartPulse className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('medicalProfile')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      ) : !medical ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {t('noMedicalProfile')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Blood type */}
          {medical.blood_type && medical.blood_type !== 'unknown' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                  {t('bloodType')}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {medical.blood_type}
                </p>
              </div>
            </div>
          )}

          {/* Allergies */}
          {medical.allergies.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-3">
                {t('allergies')}
              </p>
              <div className="flex flex-wrap gap-2">
                {medical.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medical conditions */}
          {medical.medical_conditions.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-3">
                {t('medicalConditions')}
              </p>
              <div className="flex flex-wrap gap-2">
                {medical.medical_conditions.map((condition, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {medical.medications.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">
                  {t('medications')}
                </p>
              </div>
              <div className="space-y-2">
                {medical.medications.map((med, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {med.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{med.frequency}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                      {med.dosage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vaccinations */}
          {medical.vaccination_records.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Syringe className="w-4 h-4 text-green-500 dark:text-green-400" />
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">
                  {t('vaccinationRecords')}
                </p>
              </div>
              <div className="space-y-2">
                {medical.vaccination_records.map((vac, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {vac.name}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{vac.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency contacts */}
          {medical.emergency_contacts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-kinder-blue" />
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">
                  {t('emergencyContacts')}
                </p>
              </div>
              <div className="space-y-3">
                {medical.emergency_contacts.map((contact, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {contact.name}
                          </p>
                          {contact.is_primary && (
                            <Star className="w-3 h-3 text-kinder-yellow fill-kinder-yellow shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contact.relationship}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-xs font-medium text-kinder-blue hover:underline shrink-0"
                    >
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor info */}
          {(medical.doctor_name || medical.doctor_phone) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-kinder-blue" />
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">
                  {t('doctorName')}
                </p>
              </div>
              {medical.doctor_name && (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {medical.doctor_name}
                </p>
              )}
              {medical.doctor_phone && (
                <a
                  href={`tel:${medical.doctor_phone}`}
                  className="text-sm text-kinder-blue hover:underline"
                >
                  {medical.doctor_phone}
                </a>
              )}
            </div>
          )}

          {/* Insurance info */}
          {medical.insurance_info && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">
                {t('insuranceInfo')}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{medical.insurance_info}</p>
            </div>
          )}

          {/* Medical notes */}
          {medical.medical_notes && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">
                {t('medicalNotes')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {medical.medical_notes}
              </p>
            </div>
          )}

          {/* Empty state when medical exists but has no relevant data */}
          {!medical.blood_type &&
            medical.allergies.length === 0 &&
            medical.medical_conditions.length === 0 &&
            medical.medications.length === 0 &&
            medical.vaccination_records.length === 0 &&
            medical.emergency_contacts.length === 0 &&
            !medical.doctor_name &&
            !medical.doctor_phone &&
            !medical.insurance_info &&
            !medical.medical_notes && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {t('noMedicalProfile')}
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
