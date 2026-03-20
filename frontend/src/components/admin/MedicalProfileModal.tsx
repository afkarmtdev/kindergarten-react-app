import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { medicalProfilesApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { useDiscardGuard } from '../../hooks/useDiscardGuard'
import { DiscardDialog } from '../ui/DiscardDialog'
import type {
  StudentMedical,
  BloodType,
  Medication,
  VaccinationRecord,
  EmergencyContact,
} from '../../types'

interface Props {
  show: boolean
  studentId: string
  profile: StudentMedical | null
  onClose: () => void
}

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']

const EMPTY_MEDICATION: Medication = { name: '', dosage: '', frequency: '' }
const EMPTY_VACCINATION: VaccinationRecord = { name: '', date: '' }
const EMPTY_CONTACT: EmergencyContact = { name: '', relationship: '', phone: '', is_primary: false }

export function MedicalProfileModal({ show, studentId, profile, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  const [bloodType, setBloodType] = useState<BloodType | ''>('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [conditionInput, setConditionInput] = useState('')
  const [medications, setMedications] = useState<Medication[]>([])
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [doctorName, setDoctorName] = useState('')
  const [doctorPhone, setDoctorPhone] = useState('')
  const [insuranceInfo, setInsuranceInfo] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')

  useEffect(() => {
    if (show) {
      setBloodType(profile?.blood_type ?? '')
      setAllergies(profile?.allergies ?? [])
      setAllergyInput('')
      setConditions(profile?.medical_conditions ?? [])
      setConditionInput('')
      setMedications(profile?.medications ?? [])
      setVaccinationRecords(profile?.vaccination_records ?? [])
      setEmergencyContacts(profile?.emergency_contacts ?? [])
      setDoctorName(profile?.doctor_name ?? '')
      setDoctorPhone(profile?.doctor_phone ?? '')
      setInsuranceInfo(profile?.insurance_info ?? '')
      setMedicalNotes(profile?.medical_notes ?? '')
      resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, profile])

  const saveMutation = useMutation({
    mutationFn: () =>
      medicalProfilesApi.upsert(studentId, {
        blood_type: bloodType || null,
        allergies,
        medical_conditions: conditions,
        medications,
        vaccination_records: vaccinationRecords,
        emergency_contacts: emergencyContacts,
        doctor_name: doctorName.trim() || null,
        doctor_phone: doctorPhone.trim() || null,
        insurance_info: insuranceInfo.trim() || null,
        medical_notes: medicalNotes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-profile', studentId] })
      toast.success(t('medicalProfileSaved'))
      onClose()
    },
    onError: () => toast.error('Failed to save medical profile. Please try again.'),
  })

  const addAllergy = () => {
    const val = allergyInput.trim()
    if (val && !allergies.includes(val)) {
      setAllergies((prev) => [...prev, val])
      setAllergyInput('')
      markDirty()
    }
  }

  const removeAllergy = (idx: number) => {
    setAllergies((prev) => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const addCondition = () => {
    const val = conditionInput.trim()
    if (val && !conditions.includes(val)) {
      setConditions((prev) => [...prev, val])
      setConditionInput('')
      markDirty()
    }
  }

  const removeCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const addMedication = () => {
    setMedications((prev) => [...prev, { ...EMPTY_MEDICATION }])
    markDirty()
  }

  const updateMedication = (idx: number, field: keyof Medication, value: string) => {
    setMedications((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))
    markDirty()
  }

  const removeMedication = (idx: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const addVaccination = () => {
    setVaccinationRecords((prev) => [...prev, { ...EMPTY_VACCINATION }])
    markDirty()
  }

  const updateVaccination = (idx: number, field: keyof VaccinationRecord, value: string) => {
    setVaccinationRecords((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
    markDirty()
  }

  const removeVaccination = (idx: number) => {
    setVaccinationRecords((prev) => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const addContact = () => {
    setEmergencyContacts((prev) => [...prev, { ...EMPTY_CONTACT }])
    markDirty()
  }

  const updateContact = (idx: number, field: keyof EmergencyContact, value: string | boolean) => {
    setEmergencyContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
    markDirty()
  }

  const removeContact = (idx: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  if (!show) return null

  const inputClass =
    'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange outline-none transition-colors'
  const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'
  const sectionHeaderClass = 'text-sm font-bold text-gray-800 dark:text-gray-200 mb-2'

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={requestClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {profile ? t('editMedicalProfile') : t('addMedicalInfo')}
          </h2>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Blood Type */}
          <div>
            <label className={labelClass}>{t('bloodType')}</label>
            <select
              value={bloodType}
              onChange={(e) => {
                setBloodType(e.target.value as BloodType | '')
                markDirty()
              }}
              className={inputClass}
            >
              <option value="">— Select —</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt === 'unknown' ? 'Unknown' : bt}
                </option>
              ))}
            </select>
          </div>

          {/* Allergies */}
          <div>
            <p className={sectionHeaderClass}>{t('allergies')}</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                placeholder={t('addAllergy')}
                className={inputClass + ' flex-1'}
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-3 py-2 bg-kinder-orange text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <Plus size={14} />
              </button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAllergy(i)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medical Conditions */}
          <div>
            <p className={sectionHeaderClass}>{t('medicalConditions')}</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                placeholder={t('addCondition')}
                className={inputClass + ' flex-1'}
              />
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-2 bg-kinder-orange text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <Plus size={14} />
              </button>
            </div>
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCondition(i)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={sectionHeaderClass}>{t('medications')}</p>
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center gap-1 text-xs text-kinder-orange font-semibold hover:opacity-80 transition-opacity"
              >
                <Plus size={13} />
                {t('addMedication')}
              </button>
            </div>
            {medications.length > 0 ? (
              <div className="space-y-2">
                {medications.map((med, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMedication(i, 'name', e.target.value)}
                      placeholder={t('medicationName')}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedication(i, 'dosage', e.target.value)}
                      placeholder={t('dosage')}
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(i, 'frequency', e.target.value)}
                        placeholder={t('frequency')}
                        className={inputClass + ' flex-1'}
                      />
                      <button
                        type="button"
                        onClick={() => removeMedication(i)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No medications added
              </p>
            )}
          </div>

          {/* Vaccination Records */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={sectionHeaderClass}>{t('vaccinationRecords')}</p>
              <button
                type="button"
                onClick={addVaccination}
                className="flex items-center gap-1 text-xs text-kinder-orange font-semibold hover:opacity-80 transition-opacity"
              >
                <Plus size={13} />
                {t('addVaccination')}
              </button>
            </div>
            {vaccinationRecords.length > 0 ? (
              <div className="space-y-2">
                {vaccinationRecords.map((vax, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="text"
                      value={vax.name}
                      onChange={(e) => updateVaccination(i, 'name', e.target.value)}
                      placeholder={t('vaccinationName')}
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={vax.date}
                        onChange={(e) => updateVaccination(i, 'date', e.target.value)}
                        className={inputClass + ' flex-1'}
                      />
                      <button
                        type="button"
                        onClick={() => removeVaccination(i)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No vaccination records added
              </p>
            )}
          </div>

          {/* Emergency Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={sectionHeaderClass}>{t('emergencyContacts')}</p>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1 text-xs text-kinder-orange font-semibold hover:opacity-80 transition-opacity"
              >
                <Plus size={13} />
                {t('addEmergencyContact')}
              </button>
            </div>
            {emergencyContacts.length > 0 ? (
              <div className="space-y-2">
                {emergencyContacts.map((contact, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => updateContact(i, 'name', e.target.value)}
                        placeholder={t('contactName')}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={contact.relationship}
                        onChange={(e) => updateContact(i, 'relationship', e.target.value)}
                        placeholder={t('relationship')}
                        className={inputClass}
                      />
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateContact(i, 'phone', e.target.value)}
                          placeholder="Phone"
                          className={inputClass + ' flex-1'}
                        />
                        <button
                          type="button"
                          onClick={() => removeContact(i)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={contact.is_primary}
                        onChange={(e) => updateContact(i, 'is_primary', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-kinder-orange focus:ring-kinder-orange"
                      />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {t('isPrimary')}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No emergency contacts added
              </p>
            )}
          </div>

          {/* Doctor Info */}
          <div>
            <p className={sectionHeaderClass}>Doctor Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('doctorName')}</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => {
                    setDoctorName(e.target.value)
                    markDirty()
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('doctorPhone')}</label>
                <input
                  type="tel"
                  value={doctorPhone}
                  onChange={(e) => {
                    setDoctorPhone(e.target.value)
                    markDirty()
                  }}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div>
            <label className={labelClass}>{t('insuranceInfo')}</label>
            <input
              type="text"
              value={insuranceInfo}
              onChange={(e) => {
                setInsuranceInfo(e.target.value)
                markDirty()
              }}
              className={inputClass}
            />
          </div>

          {/* Medical Notes */}
          <div>
            <label className={labelClass}>{t('medicalNotes')}</label>
            <textarea
              value={medicalNotes}
              onChange={(e) => {
                setMedicalNotes(e.target.value)
                markDirty()
              }}
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5 pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={requestClose}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex-1 bg-kinder-orange text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>

        <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
