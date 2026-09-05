import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getErrorMessage } from '../../utils/format'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await authService.requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to login
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-paid-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-paid-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm">
                If <strong>{email}</strong> is registered, we've sent a password reset link.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Forgot password?</h2>
              <p className="text-slate-500 text-sm mb-6">We'll send you a reset link on your email.</p>

              {error && (
                <div className="bg-due-50 border border-due-200 text-due-700 text-sm rounded-xl px-4 py-3 mb-5" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" autoComplete="email" required id="reset-email" />
                <Button type="submit" fullWidth loading={loading} size="lg" id="reset-submit">
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
