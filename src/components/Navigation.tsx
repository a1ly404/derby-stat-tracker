import './Navigation.css'
import { getNavigationEmoji } from '../utils/emojis'

type ActiveView = 'dashboard' | 'players' | 'bouts' | 'teams' | 'settings'

interface NavigationProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
}

const Navigation = ({ activeView, onViewChange }: NavigationProps) => {
  const navItems = [
    { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: getNavigationEmoji('dashboard') },
    { id: 'players' as ActiveView, label: 'Players', icon: getNavigationEmoji('players') },
    { id: 'bouts' as ActiveView, label: 'Bouts', icon: getNavigationEmoji('bouts') },
    { id: 'teams' as ActiveView, label: 'Teams', icon: getNavigationEmoji('teams') },
    { id: 'settings' as ActiveView, label: 'Settings', icon: getNavigationEmoji('settings') },
  ]

  return (
    <nav className="navigation">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="supabase-badge">
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
          <img
            width="168"
            height="30"
            src="https://supabase.com/badge-made-with-supabase-dark.svg"
            alt="Made with Supabase"
          />
        </a>
      </div>
    </nav>
  )
}

export default Navigation