import './StatButton.css'

interface StatButtonProps {
  label: string
  value: number
  onIncrement: () => void
  onDecrement: () => void
  color: string
  icon: string
  disabled?: boolean
}

const StatButton: React.FC<StatButtonProps> = ({
  label,
  value,
  onIncrement,
  onDecrement,
  color,
  icon,
  disabled = false
}) => {
  return (
    <div className={`stat-button ${disabled ? 'disabled' : ''}`}>
      <div className="stat-info">
        <div className="stat-icon" style={{ color }}>{icon}</div>
        <div className="stat-details">
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color }}>{value}</div>
        </div>
      </div>
      
      <div className="stat-controls">
        <button
          className="control-btn decrement"
          onClick={onDecrement}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <button
          className="control-btn increment"
          onClick={onIncrement}
          disabled={disabled}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default StatButton