import React from 'react'
import type { PlayerStats } from '../lib/supabase'
import type { ExtendedPlayer } from '../types'
import './JammerPointsPie.css'

interface Props {
  teamName: string
  players: ExtendedPlayer[]
  playerStats: Map<string, PlayerStats>
  size?: number
}

const COLORS = [
  '#4caf50',
  '#2196f3',
  '#ff9800',
  '#9c27b0',
  '#f44336',
  '#03a9f4',
  '#8bc34a',
  '#ffc107'
]

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians)
  }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ')
}

const JammerPointsPie: React.FC<Props> = ({ teamName, players, playerStats, size = 220 }) => {
  // Filter only jammers
  const jammers = players.filter(p => p.position === 'jammer' || p.position === 'pivot' || p.position === 'jammer')

  const data = jammers.map((p) => {
    const stats = playerStats.get(p.id)
    const points = stats ? (stats.points_scored || 0) : 0
    return {
      id: p.id,
      label: `#${p.team_number || p.preferred_number} ${p.derby_name}`,
      points
    }
  })

  const total = data.reduce((s, d) => s + d.points, 0)

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 10

  let cumulative = 0

  return (
    <div className="jammer-pie">
      <h3 className="pie-title">{teamName} — Jammer Points</h3>
      {data.length === 0 ? (
        <div className="no-data">No jammers on this team.</div>
      ) : total === 0 ? (
        <div className="no-data">No points scored yet.</div>
      ) : (
        <div className="pie-and-legend">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pie-svg">
            {data.map((d, i) => {
              const value = d.points
              const startAngle = (cumulative / total) * 360
              cumulative += value
              const endAngle = (cumulative / total) * 360
              const path = describeArc(cx, cy, r, startAngle, endAngle)
              const color = COLORS[i % COLORS.length]
              return <path key={d.id} d={path} fill={color} stroke="#ffffff" strokeWidth={1} />
            })}
            <circle cx={cx} cy={cy} r={r * 0.5} fill="#ffffff" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="pie-center-text">
              {total}
            </text>
          </svg>

          <div className="pie-legend">
            {data.map((d, i) => (
              <div className="legend-item" key={d.id}>
                <span className="legend-color" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="legend-label">{d.label}</span>
                <span className="legend-value">{d.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default JammerPointsPie
