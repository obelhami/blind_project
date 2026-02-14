import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Pill, ChevronLeft } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/consultation', label: 'Consultation Notes', icon: FileText },
  { path: '/prescriptions', label: 'Prescriptions', icon: Pill },
]

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-darkGreen/30 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 min-h-screen bg-darkGreen flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-primaryGreen/20">
          <div>
            <h1 className="text-white font-semibold text-lg">Emergency Care</h1>
            <p className="text-primaryGreen/80 text-xs mt-0.5">Healthcare System</p>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg text-primaryGreen/80 hover:bg-primaryGreen/20"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primaryGreen text-white'
                    : 'text-primaryGreen/90 hover:bg-primaryGreen/20 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
