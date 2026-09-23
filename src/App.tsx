import { NavLink, Route, Routes } from 'react-router-dom'
import { BarChart3, ClipboardList, Fuel, LayoutDashboard, Settings, Truck, Users, Wrench } from 'lucide-react'

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
  return <section className="page-card"><p className="eyebrow">Coming in the next phase</p><h2>{title}</h2><p>{description}</p></section>
}

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="hero">
        <div>
          <p className="eyebrow">Tshinanne Transport</p>
          <h2>Good day, Tshinanne 👋</h2>
          <p className="muted">A simple home for your trucks, deliveries and business money.</p>
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
        <p className="eyebrow">Phase 1 foundation</p>
        <h3>Ready for the real data</h3>
        <p className="muted">Firebase authentication and Firestore records will be connected in Phase 2. No financial values are hard-coded as business records.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Truck size={21} /></div><div><strong>Tshinanne Transport</strong><span>Fleet Manager</span></div></div>
        <button className="icon-button" aria-label="Settings"><Settings size={20} /></button>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
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