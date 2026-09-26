import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function AccessDenied() {
  return (
    <main className="auth-page">
      <section className="page-card access-card">
        <p className="eyebrow">Access restricted</p>
        <h2>Account inactive</h2>
        <p className="muted">Your account has been deactivated. Contact the business owner if you believe this is a mistake.</p>
        <button className="primary-button" type="button" onClick={() => auth && signOut(auth)}>Sign out</button>
      </section>
    </main>
  )
}
