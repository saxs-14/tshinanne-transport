import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../lib/firebase'
import AccessDenied from '../pages/AccessDenied'

export default function ProtectedRoute({ user }: { user: User | null }) {
  const location = useLocation()
  const [active, setActive] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user || !db) { setActive(true); return }
    let alive = true
    getDoc(doc(db, 'users', user.uid))
      .then(snapshot => { if (alive) setActive(snapshot.exists() ? snapshot.data().active !== false : true) })
      .catch(() => { if (alive) setActive(true) })
    return () => { alive = false }
  }, [user])

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (active === null) return <main className="auth-page"><p className="muted">Checking your account…</p></main>
  if (!active) return <AccessDenied />
  return <Outlet />
}
