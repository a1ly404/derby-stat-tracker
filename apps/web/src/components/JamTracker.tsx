import React from 'react'
import type { ExtendedPlayer } from '../types'
import './JamTracker.css'
import SearchableSelect from './SearchableSelect'

interface JamTrackerProps {
  jams: Array<{
    jamNumber: number
    homeJammer: ExtendedPlayer | null
    awayJammer: ExtendedPlayer | null
    homeScore: number
    awayScore: number
    homeLineup: ExtendedPlayer[]
    awayLineup: ExtendedPlayer[]
    isComplete: boolean
  }>
  currentLineup: {
    homeJammer: ExtendedPlayer | null
    awayJammer: ExtendedPlayer | null
    homeLineup: ExtendedPlayer[]
    awayLineup: ExtendedPlayer[]
  }
  isJamActive: boolean
  homeTeamPlayers: ExtendedPlayer[]
  awayTeamPlayers: ExtendedPlayer[]
  onUpdateCurrentLineup: (lineup: {
    homeJammer: ExtendedPlayer | null
    awayJammer: ExtendedPlayer | null
    homeLineup: ExtendedPlayer[]
    awayLineup: ExtendedPlayer[]
  }) => void
  onUpdateJamScore: (jamNumber: number, team: 'home' | 'away', score: number) => void
  onEditJam?: (jamNumber: number) => void
  currentJamNumber: number
}

const JamTracker: React.FC<JamTrackerProps> = ({
  jams,
  currentLineup,
  isJamActive,
  homeTeamPlayers,
  awayTeamPlayers,
  onUpdateCurrentLineup,
  onUpdateJamScore,
  onEditJam,
  currentJamNumber
}) => {
  const handleJammerSelect = (team: 'home' | 'away', player: ExtendedPlayer | null) => {
    onUpdateCurrentLineup({
      ...currentLineup,
      [team === 'home' ? 'homeJammer' : 'awayJammer']: player
    })
  }

  const handleScoreUpdate = (jamNumber: number, team: 'home' | 'away', score: string) => {
    const numScore = parseInt(score) || 0
    onUpdateJamScore(jamNumber, team, numScore)
  }

  return (
    <div className="jam-tracker">
      <div className="table-scroll">
        <table>
        <thead>
          <tr>
            <th>Jam #</th>
            <th>Home Jammer</th>
            <th>Away Jammer</th>
            <th>Home Score</th>
            <th>Away Score</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {/* Current Jam Input Row - always visible so live jam can be edited while clock runs */}
          <tr className="current-jam">
            <td>{currentJamNumber}</td>
              <td>
                <SearchableSelect
                  options={homeTeamPlayers.map(p => ({ value: p.id, label: `#${p.team_number || p.preferred_number} ${p.derby_name}` }))}
                  value={currentLineup.homeJammer?.id || ''}
                  placeholder="Select Jammer"
                  onChange={(id) => {
                    const player = homeTeamPlayers.find(p => p.id === id)
                    handleJammerSelect('home', player || null)
                  }}
                />
              </td>
              <td>
                <SearchableSelect
                  options={awayTeamPlayers.map(p => ({ value: p.id, label: `#${p.team_number || p.preferred_number} ${p.derby_name}` }))}
                  value={currentLineup.awayJammer?.id || ''}
                  placeholder="Select Jammer"
                  onChange={(id) => {
                    const player = awayTeamPlayers.find(p => p.id === id)
                    handleJammerSelect('away', player || null)
                  }}
                />
              </td>
            <td colSpan={2} className="waiting-message">
              {isJamActive ? 'Live jam — edit scores below while clock runs' : 'Select jammers and click "Start Jam"'}
            </td>
          </tr>

          {/* Previous Jams */}
          {jams.map(jam => (
            <tr key={jam.jamNumber} className={jam.isComplete ? 'completed' : 'active'}>
              <td>{jam.jamNumber}</td>
              <td>#{jam.homeJammer?.team_number || ''}</td>
              <td>#{jam.awayJammer?.team_number || ''}</td>
              <td>
                {jam.isComplete ? (
                  jam.homeScore
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={jam.homeScore}
                    onChange={(e) => handleScoreUpdate(jam.jamNumber, 'home', e.target.value)}
                  />
                )}
              </td>
              <td>
                {jam.isComplete ? (
                  jam.awayScore
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={jam.awayScore}
                    onChange={(e) => handleScoreUpdate(jam.jamNumber, 'away', e.target.value)}
                  />
                )}
              </td>
              <td>
                <button
                  className="edit-btn"
                  title="Edit jam"
                  onClick={() => onEditJam && onEditJam(jam.jamNumber)}
                >
                  ✏️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  )
}

export default JamTracker