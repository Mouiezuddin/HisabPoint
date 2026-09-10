import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './features/auth/AuthContext'
import { ThemeProvider } from './features/theme/ThemeContext'
import { AppRoutes } from './routes/AppRoutes'
import { Toast } from './components/ui/Toast'
import './index.css'

// Lazy initialize Sentry during idle time so First Contentful Paint is instantaneous
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

if (SENTRY_DSN) {
  const initSentry = () => {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      })
    })
  }

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(initSentry)
    } else {
      setTimeout(initSentry, 1000)
    }
  }
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo)
    if (SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, { extra: errorInfo as unknown as Record<string, unknown> })
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sand-50 dark:bg-stone-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 border border-sand-200 dark:border-stone-700 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 dark:text-stone-300 mb-4">
              An unexpected error occurred. An automated crash report has been dispatched to Sentry.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="px-5 py-2.5 bg-bahi-600 hover:bg-bahi-700 text-white font-medium rounded-xl text-sm transition-colors shadow-md"
            >
              Reload HisabPoint
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '936456474682-ilijsok5msld8s17jdiccrddshfuimu0.apps.googleusercontent.com'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <AuthProvider>
                <AppRoutes />
                <Toast />
              </AuthProvider>
            </GoogleOAuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
