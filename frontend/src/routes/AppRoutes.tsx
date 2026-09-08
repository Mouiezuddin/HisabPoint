import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { LoadingState } from '../components/ui/LedgerComponents'

// Lazy-loaded Public Landing & Auth pages
const LandingPage = lazy(() => import('../pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))

// Lazy-loaded Protected App pages (downloaded on-demand when user logs in)
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CustomerListPage = lazy(() => import('../pages/customers/CustomerListPage').then(m => ({ default: m.CustomerListPage })))
const AddCustomerPage = lazy(() => import('../pages/customers/AddCustomerPage').then(m => ({ default: m.AddCustomerPage })))
const CustomerDetailPage = lazy(() => import('../pages/customers/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })))
const EditCustomerPage = lazy(() => import('../pages/customers/EditCustomerPage').then(m => ({ default: m.EditCustomerPage })))
const ActivityPage = lazy(() => import('../pages/ActivityPage').then(m => ({ default: m.ActivityPage })))
const AddTransactionPage = lazy(() => import('../pages/ledger/AddTransactionPage').then(m => ({ default: m.AddTransactionPage })))
const TransactionDetailPage = lazy(() => import('../pages/ledger/TransactionDetailPage').then(m => ({ default: m.TransactionDetailPage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const BusinessProfilePage = lazy(() => import('../pages/BusinessProfilePage').then(m => ({ default: m.BusinessProfilePage })))
const ReportsPage = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth()
  if (isLoading) return <LoadingState message="Loading HisabPoint…" />
  if (!isLoggedIn) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth()
  if (isLoading) return <LoadingState message="Loading HisabPoint…" />
  if (isLoggedIn) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RootRoute() {
  const { isLoggedIn, isLoading } = useAuth()
  if (isLoading) return <LoadingState message="Loading HisabPoint…" />
  if (isLoggedIn) {
    return (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    )
  }
  return <LandingPage />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState message="Loading HisabPoint…" />}>
      <Routes>
        {/* Root Route: Landing page if unauthenticated, Dashboard if logged in */}
        <Route path="/" element={<RootRoute />} />

        {/* Public Auth routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

        {/* Protected Application routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute>
            <AppLayout><CustomerListPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/customers/new" element={
          <ProtectedRoute>
            <AppLayout><AddCustomerPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/customers/:id" element={
          <ProtectedRoute>
            <AppLayout><CustomerDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/customers/:id/edit" element={
          <ProtectedRoute>
            <AppLayout><EditCustomerPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/customers/:id/transaction" element={
          <ProtectedRoute>
            <AppLayout><AddTransactionPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/activity" element={
          <ProtectedRoute>
            <AppLayout><ActivityPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/transactions/:id" element={
          <ProtectedRoute>
            <AppLayout><TransactionDetailPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <AppLayout><ReportsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout><SettingsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/business" element={
          <ProtectedRoute>
            <AppLayout><BusinessProfilePage /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
