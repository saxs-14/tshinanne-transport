import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { signOut, type User } from 'firebase/auth'
import { BarChart3, ClipboardList, Fuel, LayoutDashboard, LogOut, Settings, Truck, Users, Wrench } from 'lucide-react'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { auth } from './lib/firebase'


const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trucks', label: 'Trucks', icon: Truck },
  { to: '/deliveries', label: 'Deliveries', icon: ClipboardList },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/finance', label: 'Finance', icon: BarChart3 },
  { to: '/fuel', label: 'Fuel', icon: Fuel },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
]

function Placeholder({ title, description }: { title: string; description: string }) {
  return <section className="page-card"><p className="eyebrow">Next phase</p><h2>{title}</h2><p>{description}</p></section>
}

function Dashboard({ user }: { user: User }) {
  return (
    <div className="dashboard">
      <div className="hero">
        <div>
          <p className="eyebrow">Tshinanne Transport</p>
          <h2>Welcome back 👋</h2>
          <p className="muted">{user.email ?? 'Signed-in user'} — your transport business in one place.</p>
        </div>
        <div className="truck-badge"><Truck size={28} /><span>2 TATA 1518 trucks</span></div>
      </div>
      <div className="stats">
        <div className="stat"><span>Today’s revenue</span><strong>R0.00</strong></div>
        <div className="stat"><span>Today’s expenses</span><strong>R0.00</strong></div>
        <div className="stat"><span>Deliveries</span><strong>0</strong></div>
        <div className="stat"><span>Estimated profit</span><strong>R0.00</strong></div>
      </div>
      <div className="page-card">
        <p className="eyebrow">Authentication</p>
        <h3>You are signed in</h3>
        <p className="muted">Your account is now the entry point to the protected business system. Real truck and financial records come in the next phases.</p>
      </div>
    </div>
  )
}

function AppShell({ user }: { user: User }) {
  async function handleLogout() {
    if (auth) await signOut(auth)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Truck size={21} /></div><div><strong>Tshinanne Transport</strong><span>Fleet Manager</span></div></div>
        <button className="icon-button" onClick={handleLogout} aria-label="Sign out" title="Sign out"><LogOut size={20} /></button>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/trucks" element={<Placeholder title="Truck Management" description="Manage the two TATA 1518 trucks, drivers, odometers and status." />} />
          <Route path="/deliveries" element={<Placeholder title="Deliveries" description="Record customer orders, assignments, delivery status and payments." />} />
          <Route path="/customers" element={<Placeholder title="Customers" description="Keep customer contact details and delivery history in one place." />} />
          <Route path="/finance" element={<Placeholder title="Finance" description="Track income, expenses and estimated business profit." />} />
          <Route path="/fuel" element={<Placeholder title="Fuel" description="Record litres, fuel costs, stations and odometer readings." />} />
          <Route path="/maintenance" element={<Placeholder title="Maintenance" description="Track services, repairs, tyres, parts and upcoming maintenance." />} />
        </Routes>
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}><Icon size={19} /><span>{label}</span></NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    if (!auth) {
      setUser(null)
      return
    }
    return auth.onAuthStateChanged(setUser)
  }, [])

  if (user === undefined) return <main className="auth-page"><p className="muted">Loading secure session…</p></main>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/*" element={<AppShell user={user} />} />
      </Route>
    </Routes>
  )
}
