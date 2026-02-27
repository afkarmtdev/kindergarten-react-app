import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { StudentsPage } from '@/pages/StudentsPage'
import { AttendancePage } from '@/pages/AttendancePage'
import { ClassesPage } from '@/pages/ClassesPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { StudentProfilePage } from '@/pages/StudentProfilePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,          // 30s fresh — avoid refetching on tab switch
      gcTime: 5 * 60 * 1000,     // 5min cache garbage collection
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
              <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              <Route path="students" element={<ErrorBoundary><StudentsPage /></ErrorBoundary>} />
              <Route path="students/:id" element={<ErrorBoundary><StudentProfilePage /></ErrorBoundary>} />
              <Route path="attendance" element={<ErrorBoundary><AttendancePage /></ErrorBoundary>} />
              <Route path="classes" element={<ErrorBoundary><ClassesPage /></ErrorBoundary>} />
              <Route path="gallery" element={<ErrorBoundary><GalleryPage /></ErrorBoundary>} />
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
