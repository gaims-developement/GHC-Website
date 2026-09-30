import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, HeartPulse, Menu } from 'lucide-react'

const registrationUrl = 'https://mc.clirnet.com/mastercast/connect/D0921-Conclave-1'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: registrationUrl, label: 'Register', external: true },
]

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f7faf8] text-[#16201d]">
      <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <NavLink to="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-10 place-items-center rounded bg-teal-700 text-white">
              <HeartPulse size={22} />
            </span>
            <span>Global Healthcare Conclave</span>
          </NavLink>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-600 transition hover:text-teal-700"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition ${isActive ? 'text-teal-700' : 'text-slate-600 hover:text-teal-700'}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded border border-teal-700/20 px-3 py-2 text-sm text-teal-800 sm:flex">
              <CalendarDays size={16} />
              2026 Edition
            </span>
            <button
              type="button"
              className="grid size-10 place-items-center rounded border border-slate-200 text-slate-700 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
