import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StatButton from '../components/StatButton'

describe('StatButton Component', () => {
  const mockOnIncrement = vi.fn()
  const mockOnDecrement = vi.fn()

  const defaultProps = {
    label: 'Points',
    value: 5,
    onIncrement: mockOnIncrement,
    onDecrement: mockOnDecrement,
    color: '#27ae60',
    icon: '🏆'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with correct label and value', () => {
    render(<StatButton {...defaultProps} />)

    expect(screen.getByText('Points')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('handles increment button clicks', () => {
    render(<StatButton {...defaultProps} />)

    const incrementButton = screen.getByRole('button', { name: 'Increase Points' })
    fireEvent.click(incrementButton)

    expect(mockOnIncrement).toHaveBeenCalledTimes(1)
  })

  it('handles decrement button clicks when enabled', () => {
    render(<StatButton {...defaultProps} />)

    const decrementButton = screen.getByRole('button', { name: 'Decrease Points' })
    fireEvent.click(decrementButton)

    expect(mockOnDecrement).toHaveBeenCalledTimes(1)
  })

  it('disables decrement button when value is 0', () => {
    render(<StatButton {...defaultProps} value={0} />)

    const decrementButton = screen.getByRole('button', { name: 'Decrease Points' })
    expect(decrementButton).toBeDisabled()
  })

  it('disables both buttons when disabled prop is true', () => {
    render(<StatButton {...defaultProps} disabled={true} />)

    const incrementButton = screen.getByRole('button', { name: 'Increase Points' })
    const decrementButton = screen.getByRole('button', { name: 'Decrease Points' })
    
    expect(incrementButton).toBeDisabled()
    expect(decrementButton).toBeDisabled()
  })

  it('displays icon and color correctly', () => {
    const { container } = render(<StatButton {...defaultProps} />)
    
    const icon = container.querySelector('.stat-icon')
    expect(icon).toHaveTextContent('🏆')
    expect(icon).toHaveStyle({ color: '#27ae60' })
  })

  it('handles zero value correctly', () => {
    render(<StatButton {...defaultProps} value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('handles negative values correctly', () => {
    render(<StatButton {...defaultProps} value={-2} />)
    expect(screen.getByText('-2')).toBeInTheDocument()
  })

  it('applies disabled styling when disabled', () => {
    const { container } = render(<StatButton {...defaultProps} disabled={true} />)
    
    const statButton = container.querySelector('.stat-button')
    expect(statButton).toHaveClass('disabled')
  })

  it('handles rapid clicks correctly', () => {
    render(<StatButton {...defaultProps} />)

    const incrementButton = screen.getByRole('button', { name: 'Increase Points' })
    
    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)

    expect(mockOnIncrement).toHaveBeenCalledTimes(3)
  })
})