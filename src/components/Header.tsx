import './Header.css'
import { useAuth } from '../hooks/useAuth'

const Header = () => {
  const { user, signOut } = useAuth()

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="app-title">Derby Stat Tracker</h1>
        <div className="header-actions">
          <span className="date">{new Date().toLocaleDateString()}</span>
          {user && (
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button onClick={signOut} className="sign-out-btn">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header