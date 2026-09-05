import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { LoadingState } from '../components/ui/LedgerComponents'

// Public Landing & Auth pages
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'

// Protected App pages
import { DashboardPage } from '../pages/DashboardPage'
import { CustomerListPage } from '../pages/customers/CustomerListPage'
import { AddCustomerPage } from '../pages/customers/AddCustomerPage'
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage'
import { EditCustomerPage } from '../pages/customers/EditCustomerPage'
import { ActivityPage } from '../pages/ActivityPage'
import { AddTransactionPage } from '../pages/ledger/AddTransactionPage'
import { TransactionDetailPage } from '../pages/ledger/TransactionDetailPage'
import { SettingsPage } from '../pages/SettingsPage'
import { BusinessProfilePage } from '../pages/BusinessProfilePage'
import { ReportsPage } from '../pages/ReportsPage'

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
  )
}
