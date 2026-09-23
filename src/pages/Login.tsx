import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth, firebaseConfigured } from '../lib/firebase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!auth) {
      setError('Firebase is not configured yet. Add the values from .env.example to your local .env file.')
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate('/')
    } catch {
      setError('Login failed. Check your email and password.')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo"><Truck size={30} /></div>
        <p className="eyebrow">Tshinanne Transport</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage trucks, deliveries and business records.</p>
        {!firebaseConfigured && <div className="notice">Firebase setup is required before a real account can sign in.</div>}
        <form onSubmit={handleSubmit}>
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  )
}