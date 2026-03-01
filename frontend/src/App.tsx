import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { CuteLoader } from '@/components/ui/Skeletons'
// Public pages stay eager — they are the first routes users hit
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'

// Admin pages are lazy-loaded so they don't bloat the initial bundle
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const StudentsPage = lazy(() =>
  import('@/pages/StudentsPage').then((m) => ({ default: m.StudentsPage }))
)
const StudentProfilePage = lazy(() =>
  import('@/pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage }))
)
const AttendancePage = lazy(() =>
  import('@/pages/AttendancePage').then((m) => ({ default: m.AttendancePage }))
)
const ClassesPage = lazy(() =>
  import('@/pages/ClassesPage').then((m) => ({ default: m.ClassesPage }))
)
const GalleryPage = lazy(() =>
  import('@/pages/GalleryPage').then((m) => ({ default: m.GalleryPage }))
)
const AnnouncementsPage = lazy(() =>
  import('@/pages/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const FeesPage = lazy(() => import('@/pages/FeesPage').then((m) => ({ default: m.FeesPage })))
const FeePlansPage = lazy(() =>
  import('@/pages/FeePlansPage').then((m) => ({ default: m.FeePlansPage }))
)
const FeeStatementPage = lazy(() =>
  import('@/pages/FeeStatementPage').then((m) => ({ default: m.FeeStatementPage }))
)

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
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin/login" element={<LoginPage />} />

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>

      <Toaster
        position="top-right"
        richColors
        duration={3000}
        toastOptions={{ className: 'font-sans text-sm' }}
      />
      {/* Devtools only in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
