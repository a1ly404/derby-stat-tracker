import React, { useState, useRef, useEffect } from 'react'
import './SearchableSelect.css'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  placeholder?: string
  onChange: (value: string) => void
  required?: boolean
}

const SearchableSelect: React.FC<Props> = ({ options, value, placeholder, onChange, required }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  // If value corresponds to option, show its label in the input
  const selectedLabel = options.find(o => o.value === value)?.label || ''

  useEffect(() => {
    // keep query in sync when external value changes
    if (!open) setQuery(selectedLabel)
  }, [value, open, selectedLabel])

  const handleSelect = (opt: Option) => {
    onChange(opt.value)
    setOpen(false)
    setQuery(opt.label)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      setFocusedIndex(0)
      return
    }

    if (e.key === 'ArrowDown') {
      setFocusedIndex(i => Math.min(i + 1, filtered.length - 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex(i => Math.max(i - 1, 0))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (open && filtered[focusedIndex]) {
        handleSelect(filtered[focusedIndex])
      }
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIndex(-1)
    }
  }

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <input
        type="text"
        className="searchable-input"
        placeholder={placeholder}
        value={open ? query : (query || selectedLabel)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setFocusedIndex(0) }}
        onFocus={() => { setOpen(true); setQuery(selectedLabel) }}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        required={required}
      />

      {open && (
        <ul className="searchable-options" role="listbox">
          {filtered.length === 0 ? (
            <li className="no-options">No results</li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                className={`searchable-option ${i === focusedIndex ? 'focused' : ''} ${value === opt.value ? 'selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
                onMouseEnter={() => setFocusedIndex(i)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default SearchableSelect
