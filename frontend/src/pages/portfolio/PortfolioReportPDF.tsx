import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { APP_NAME } from '@/lib/version'
import type { PortfolioEntry, PortfolioReport, PortfolioDomain } from '@/types'

export interface PDFLabels {
  reportTitle: string
  termPrefix: string
  teacherComment: string
  principalComment: string
  teacherSignature: string
  principalSignature: string
  noEntries: string
  observationsByDomain: string
  generatedOn: string
  domainLabels: Record<PortfolioDomain, string>
}

const DOMAIN_ORDER: PortfolioDomain[] = [
  'physical',
  'cognitive',
  'language',
  'social_emotional',
  'creative',
]

// Kinder palette colors per domain
const DOMAIN_COLORS: Record<PortfolioDomain, string> = {
  physical: '#4D96FF',
  cognitive: '#C77DFF',
  language: '#6BCB77',
  social_emotional: '#FF85A2',
  creative: '#FF6B35',
}

const DOMAIN_BG: Record<PortfolioDomain, string> = {
  physical: 'rgba(77,150,255,0.06)',
  cognitive: 'rgba(199,125,255,0.06)',
  language: 'rgba(107,203,119,0.06)',
  social_emotional: 'rgba(255,133,162,0.06)',
  creative: 'rgba(255,107,53,0.06)',
}

const ZERO_BADGE_COLOR = '#D1D5DB'

/** Bump this version whenever the report layout/design changes */
const REPORT_VERSION = '1.2.0'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827',
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // -- Header -----------------------------------------------------------------
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoWrap: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 14,
    overflow: 'hidden',
  },
  headerLogo: {
    width: 54,
    height: 54,
    borderRadius: 8,
  },
  headerLeft: {
    flex: 1,
  },
  schoolName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  schoolRegNo: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 3,
  },
  schoolContact: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 1.5,
  },
  headerDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginHorizontal: 20,
    flexShrink: 0,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'right',
  },
  termPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  termLabel: {
    fontSize: 8,
    color: '#ffffff',
    textAlign: 'right',
  },
  headerMeta: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
    marginTop: 3,
  },

  // -- Thin accent bar below header -------------------------------------------
  accentBar: {
    height: 6,
    backgroundColor: '#FFBE0B',
    marginBottom: 22,
  },

  // -- Body -------------------------------------------------------------------
  body: {
    paddingHorizontal: 36,
  },

  // -- Student block ----------------------------------------------------------
  studentBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    paddingLeft: 12,
    paddingVertical: 6,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 3,
  },
  studentClass: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'Helvetica',
  },

  // -- Section label ----------------------------------------------------------
  sectionHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },

  // -- Domain section ---------------------------------------------------------
  domainSection: {
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  domainLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  domainBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  domainBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  // -- Observation entries ----------------------------------------------------
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 8,
  },
  entryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
    flexShrink: 0,
  },
  entryText: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
    lineHeight: 1.5,
  },
  entryDate: {
    fontSize: 8,
    color: '#9CA3AF',
    flexShrink: 0,
    marginTop: 1,
  },
  noEntries: {
    fontSize: 9,
    color: '#D1D5DB',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  entryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 10,
  },

  // -- Comments — stacked -----------------------------------------------------
  commentsRow: {
    marginTop: 16,
    marginBottom: 6,
    gap: 10,
  },
  commentLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  commentBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 9,
    minHeight: 64,
    backgroundColor: '#FAFAFA',
  },
  commentText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.6,
  },

  // -- Signature section ------------------------------------------------------
  signaturesWrap: {
    marginTop: 28,
    paddingHorizontal: 36,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#9CA3AF',
    width: 200,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6B7280',
  },

  // -- Footer -----------------------------------------------------------------
  pageFooter: {
    position: 'absolute',
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageFooterText: {
    fontSize: 7,
    color: '#D1D5DB',
  },
})

interface Props {
  studentName: string
  className: string
  schoolName: string
  schoolAddress?: string
  schoolPhone?: string
  schoolEmail?: string
  schoolLogoUrl?: string | null
  schoolRegNo?: string
  term: string
  entries: PortfolioEntry[]
  report: PortfolioReport | null | undefined
  labels: PDFLabels
}

export function PortfolioReportPDF({
  studentName,
  className,
  schoolName,
  schoolAddress,
  schoolPhone,
  schoolEmail,
  schoolLogoUrl,
  schoolRegNo,
  term,
  entries,
  report,
  labels,
}: Props) {
  const byDomain = entries.reduce<Partial<Record<PortfolioDomain, PortfolioEntry[]>>>((acc, e) => {
    const d = e.domain as PortfolioDomain
    if (!acc[d]) acc[d] = []
    acc[d]!.push(e)
    return acc
  }, {})

  const contactLine = [schoolAddress, schoolPhone, schoolEmail].filter(Boolean).join('  |  ')

  const printDate = new Date().toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* -- Header (repeats on every page) -- */}
        <View fixed style={styles.header}>
          {schoolLogoUrl && (
            <View style={styles.headerLogoWrap}>
              <Image src={schoolLogoUrl} style={styles.headerLogo} />
            </View>
          )}

          <View style={styles.headerLeft}>
            <Text style={styles.schoolName}>{schoolName}</Text>
            {!!schoolRegNo && <Text style={styles.schoolRegNo}>{schoolRegNo}</Text>}
            {!!contactLine && <Text style={styles.schoolContact}>{contactLine}</Text>}
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{labels.reportTitle}</Text>
            <View style={styles.termPill}>
              <Text style={styles.termLabel}>
                {labels.termPrefix}: {term}
              </Text>
            </View>
            <Text style={styles.headerMeta}>
              {studentName} | v{REPORT_VERSION}
            </Text>
          </View>
        </View>

        {/* -- Yellow accent bar -- */}
        <View fixed style={styles.accentBar} />

        {/* -- Body -- */}
        <View style={styles.body}>
          {/* Student block */}
          <View style={styles.studentBlock}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{studentName}</Text>
              <Text style={styles.studentClass}>{className}</Text>
            </View>
          </View>

          {/* Domain sections label */}
          <Text style={styles.sectionHeading}>{labels.observationsByDomain}</Text>

          {/* Domain sections */}
          {DOMAIN_ORDER.map((domain) => {
            const domainEntries = byDomain[domain] ?? []
            const color = DOMAIN_COLORS[domain]
            const bg = DOMAIN_BG[domain]
            const isEmpty = domainEntries.length === 0
            const badgeColor = isEmpty ? ZERO_BADGE_COLOR : color

            const firstEntry = domainEntries[0]
            const restEntries = domainEntries.slice(1)

            return (
              <View
                key={domain}
                style={[styles.domainSection, { borderLeftColor: isEmpty ? '#E5E7EB' : color }]}
              >
                {/* Domain header + first entry grouped to prevent orphaned header */}
                <View wrap={false}>
                  <View
                    style={[styles.domainHeader, { backgroundColor: isEmpty ? '#FAFAFA' : bg }]}
                  >
                    <Text style={[styles.domainLabel, isEmpty ? { color: '#9CA3AF' } : {}]}>
                      {labels.domainLabels[domain]}
                    </Text>
                    <View style={[styles.domainBadge, { backgroundColor: badgeColor }]}>
                      <Text style={styles.domainBadgeText}>{domainEntries.length}</Text>
                    </View>
                  </View>

                  {firstEntry ? (
                    <View style={styles.entryRow}>
                      <View style={[styles.entryDot, { backgroundColor: color }]} />
                      <Text style={styles.entryText}>{firstEntry.observation}</Text>
                      <Text style={styles.entryDate}>
                        {new Date(firstEntry.entry_date + 'T00:00:00').toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noEntries}>{labels.noEntries}</Text>
                  )}
                </View>

                {/* Remaining entries */}
                {restEntries.map((e) => (
                  <View key={e.id} wrap={false}>
                    <View style={styles.entryDivider} />
                    <View style={styles.entryRow}>
                      <View style={[styles.entryDot, { backgroundColor: color }]} />
                      <Text style={styles.entryText}>{e.observation}</Text>
                      <Text style={styles.entryDate}>
                        {new Date(e.entry_date + 'T00:00:00').toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )
          })}

          {/* Comments — stacked */}
          <View style={styles.commentsRow}>
            <View wrap={false}>
              <Text style={styles.commentLabel}>{labels.teacherComment}</Text>
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>{report?.teacher_comment ?? ''}</Text>
              </View>
            </View>
            <View wrap={false}>
              <Text style={styles.commentLabel}>{labels.principalComment}</Text>
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>{report?.principal_comment ?? ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacer — pushes signatures to bottom of last page */}
        <View style={{ flexGrow: 1 }} />

        {/* -- Signatures -- */}
        <View wrap={false} style={styles.signaturesWrap}>
          <View style={styles.signatures}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{labels.teacherSignature}</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{labels.principalSignature}</Text>
            </View>
          </View>
        </View>

        {/* -- Footer (repeats on every page) -- */}
        <View fixed style={styles.pageFooter}>
          <Text style={styles.pageFooterText}>
            {labels.generatedOn} {printDate}
          </Text>
          <Text
            style={styles.pageFooterText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
          <Text style={styles.pageFooterText}>Generated by {APP_NAME}</Text>
        </View>
      </Page>
    </Document>
  )
}
