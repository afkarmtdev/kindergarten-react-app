import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { ParentAuthProvider } from '@/hooks/useParentAuth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import PortalProtectedRoute from '@/components/portal/PortalProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { CuteLoader } from '@/components/ui/Skeletons'
import { UpdateBanner } from '@/components/ui/UpdateBanner'
import { ReloadCurtainHandoff } from '@/components/ui/ReloadCurtainHandoff'
// Public pages stay eager — they are the first routes users hit
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
// Portal pages — lazy loaded, completely separate from admin routes
const PortalLoginPage = lazy(() => import('@/pages/portal/PortalLoginPage'))
const PortalLayout = lazy(() => import('@/pages/portal/PortalLayout'))
const PortalDashboardPage = lazy(() => import('@/pages/portal/PortalDashboardPage'))
const PortalAttendancePage = lazy(() => import('@/pages/portal/PortalAttendancePage'))
const PortalFeesPage = lazy(() => import('@/pages/portal/PortalFeesPage'))
const PortalAnnouncementsPage = lazy(() => import('@/pages/portal/PortalAnnouncementsPage'))
const PortalDailyReportPage = lazy(() => import('@/pages/portal/PortalDailyReportPage'))
const PortalPortfolioPage = lazy(() => import('@/pages/portal/PortalPortfolioPage'))
const PortalDevicesPage = lazy(() => import('@/pages/portal/PortalDevicesPage'))

// Admin pages are lazy-loaded so they don't bloat the initial bundle
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const StudentsPage = lazy(() =>
  import('@/pages/students/StudentsPage').then((m) => ({ default: m.StudentsPage }))
)
const StudentProfilePage = lazy(() =>
  import('@/pages/student-profile/StudentProfilePage').then((m) => ({
    default: m.StudentProfilePage,
  }))
)
const AttendancePage = lazy(() =>
  import('@/pages/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage }))
)
const ClassesPage = lazy(() =>
  import('@/pages/ClassesPage').then((m) => ({ default: m.ClassesPage }))
)
const GalleryPage = lazy(() =>
  import('@/pages/GalleryPage').then((m) => ({ default: m.GalleryPage }))
)
const AnnouncementsPage = lazy(() =>
  import('@/pages/announcements/AnnouncementsPage').then((m) => ({
    default: m.AnnouncementsPage,
  }))
)
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const FeesPage = lazy(() => import('@/pages/fees/FeesPage').then((m) => ({ default: m.FeesPage })))
const FeePlansPage = lazy(() =>
  import('@/pages/FeePlansPage').then((m) => ({ default: m.FeePlansPage }))
)
const FeeStatementPage = lazy(() =>
  import('@/pages/FeeStatementPage').then((m) => ({ default: m.FeeStatementPage }))
)
const AnnualReportPage = lazy(() =>
  import('@/pages/AnnualReportPage').then((m) => ({ default: m.AnnualReportPage }))
)
const TestimonialsPage = lazy(() =>
  import('@/pages/testimonials/TestimonialsPage').then((m) => ({ default: m.TestimonialsPage }))
)
const ArtWallPage = lazy(() =>
  import('@/pages/art-wall/ArtWallPage').then((m) => ({ default: m.ArtWallPage }))
)
const InquiriesPage = lazy(() =>
  import('@/pages/InquiriesPage').then((m) => ({ default: m.InquiriesPage }))
)
const ParentsPage = lazy(() =>
  import('@/pages/parents/ParentsPage').then((m) => ({ default: m.ParentsPage }))
)
const DailyReportsPage = lazy(() =>
  import('@/pages/daily-reports/DailyReportsPage').then((m) => ({ default: m.DailyReportsPage }))
)
const PortfolioReportPage = lazy(() =>
  import('@/pages/portfolio/PortfolioReportPage').then((m) => ({ default: m.PortfolioReportPage }))
)
const IncidentsPage = lazy(() =>
  import('@/pages/incidents/IncidentsPage').then((m) => ({ default: m.IncidentsPage }))
)
const CareersPage = lazy(() =>
  import('@/pages/careers/CareersPage').then((m) => ({ default: m.CareersPage }))
)
const JobApplicationsPage = lazy(() =>
  import('@/pages/careers/JobApplicationsPage').then((m) => ({
    default: m.JobApplicationsPage,
  }))
)
const PortalMedicalPage = lazy(() => import('@/pages/portal/PortalMedicalPage'))
const PortalIncidentsPage = lazy(() => import('@/pages/portal/PortalIncidentsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30s fresh — avoid refetching on tab switch
      gcTime: 5 * 60 * 1000, // 5min cache garbage collection
      refetchOnWindowFocus: false, // don't refetch just because user switched tabs
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ParentAuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin/login" element={<LoginPage />} />

              {/* Parent portal — completely separate auth branch */}
              <Route
                path="/portal/login"
                element={
                  <Suspense fallback={<CuteLoader />}>
                    <PortalLoginPage />
                  </Suspense>
                }
              />
              <Route element={<PortalProtectedRoute />}>
                <Route
                  path="/portal"
                  element={
                    <Suspense fallback={<CuteLoader />}>
                      <PortalLayout />
                    </Suspense>
                  }
                >
                  <Route
                    index
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalDashboardPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="attendance"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalAttendancePage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="fees"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalFeesPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="announcements"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalAnnouncementsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="daily-reports"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalDailyReportPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="portfolio"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalPortfolioPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="medical"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalMedicalPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="incidents"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalIncidentsPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="devices"
                    element={
                      <Suspense fallback={<CuteLoader />}>
                        <PortalDevicesPage />
                      </Suspense>
                    }
                  />
                </Route>
              </Route>

              {/* Protected admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <DashboardPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="students"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <StudentsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="students/:id"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <StudentProfilePage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="students/:id/portfolio/:term"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <PortfolioReportPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="attendance"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <AttendancePage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="classes"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <ClassesPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="gallery"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <GalleryPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="art-wall"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <ArtWallPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="announcements"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <AnnouncementsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="fees"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <FeesPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="fees/statement/:studentId"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <FeeStatementPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="fees/annual-report"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <AnnualReportPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="fee-plans"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <FeePlansPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="testimonials"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <TestimonialsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="inquiries"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <InquiriesPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="parents"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <ParentsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="daily-reports"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <DailyReportsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="incidents"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <IncidentsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="careers"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <CareersPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="careers/applications"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <JobApplicationsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={<CuteLoader />}>
                        <SettingsPage />
                      </Suspense>
                    </ErrorBoundary>
                  }
                />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ParentAuthProvider>
      </AuthProvider>

      <Toaster
        position="bottom-right"
        richColors
        duration={3000}
        toastOptions={{ className: 'font-sans text-sm' }}
      />
      {/* New-build banner — one instance for every page, public and private */}
      <UpdateBanner />
      {/* Lifts the reload curtain the previous build left down (landing page only) */}
      <ReloadCurtainHandoff />
      {/* Devtools only in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
