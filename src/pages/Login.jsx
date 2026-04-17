import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Button from '../components/ui/Button.jsx'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  if (session) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError(null); setInfo(null); setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        nav('/', { replace: true })
      } else {
        const { error, data } = await signUp(email, password)
        if (error) throw error
        if (data.session) nav('/', { replace: true })
        else setInfo('Check your email for the verification link, then sign in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-800 flex flex-col items-center justify-center px-6 py-12 text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-bold mb-3">S</div>
          <h1 className="text-2xl font-bold">SocietyConnect</h1>
          <p className="text-sm opacity-80 mt-1">Smartword · M3M Soulitude · Sector 89, Gurgaon</p>
        </div>

        <form onSubmit={submit} className="bg-white text-slate-900 rounded-2xl p-6 shadow-float space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-0"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Password</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-0"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}
          {info  && <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md">{info}</div>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <div className="text-xs text-center text-slate-600">
            {mode === 'signin' ? (
              <>No account yet? <button type="button" onClick={() => setMode('signup')} className="text-brand-600 font-medium">Sign up</button></>
            ) : (
              <>Already registered? <button type="button" onClick={() => setMode('signin')} className="text-brand-600 font-medium">Sign in</button></>
            )}
          </div>
        </form>

        <p className="text-[11px] text-center opacity-70 mt-6">By continuing you agree to the society's usage terms.</p>
      </div>
    </div>
  )
}
