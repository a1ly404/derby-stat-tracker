import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Player, Team } from '../lib/supabase'
import './Players.css'

interface PlayerWithTeams extends Player {
    teams: Array<{
        team: Team
        number: string
        position: 'jammer' | 'blocker' | 'pivot'
        is_active: boolean
    }>
}

const Players: React.FC = () => {
    const [players, setPlayers] = useState<PlayerWithTeams[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingPlayer, setEditingPlayer] = useState<PlayerWithTeams | null>(null)
    const [formData, setFormData] = useState({
        derby_name: '',
        preferred_number: '',
        selectedTeams: [] as Array<{
            team_id: string
            number: string
            position: 'jammer' | 'blocker' | 'pivot'
            is_active: boolean
        }>
    })
    const [error, setError] = useState<string>('')

    // Fetch all data
    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch teams first
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .order('name')

            if (teamsError) throw teamsError
            setTeams(teamsData || [])

            // Fetch players with their team assignments
            const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select(`
          *,
          player_teams (
            number,
            position,
            is_active,
            team_id,
            teams (
              id,
              name,
              logo_url
            )
          )
        `)
                .order('derby_name')

            if (playersError) throw playersError

            // Transform the data to match our interface
            const transformedPlayers = (playersData || []).map(player => ({
                ...player,
                teams: player.player_teams.map((pt: { number: string; position: string; is_active: boolean; teams: Team }) => ({
                    team: pt.teams,
                    number: pt.number,
                    position: pt.position as 'jammer' | 'blocker' | 'pivot',
                    is_active: pt.is_active
                }))
            }))

            setPlayers(transformedPlayers)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.derby_name.trim()) {
            setError('Derby name is required')
            return
        }

        if (!formData.preferred_number.trim()) {
            setError('Preferred number is required')
            return
        }

        if (formData.selectedTeams.length === 0) {
            setError('At least one team assignment is required')
            return
        }

        try {
            if (editingPlayer) {
                // Update existing player
                const { error: playerError } = await supabase
                    .from('players')
                    .update({
                        derby_name: formData.derby_name.trim(),
                        preferred_number: formData.preferred_number.trim()
                    })
                    .eq('id', editingPlayer.id)

                if (playerError) throw playerError

                // Delete existing team assignments
                const { error: deleteError } = await supabase
                    .from('player_teams')
                    .delete()
                    .eq('player_id', editingPlayer.id)

                if (deleteError) throw deleteError

                // Insert new team assignments
                const { error: insertError } = await supabase
                    .from('player_teams')
                    .insert(
                        formData.selectedTeams.map(team => ({
                            player_id: editingPlayer.id,
                            team_id: team.team_id,
                            number: team.number,
                            position: team.position,
                            is_active: team.is_active
                        }))
                    )

                if (insertError) throw insertError
            } else {
                // Create new player
                const { data: playerData, error: playerError } = await supabase
                    .from('players')
                    .insert({
                        derby_name: formData.derby_name.trim(),
                        preferred_number: formData.preferred_number.trim()
                    })
                    .select()
                    .single()

                if (playerError) throw playerError

                // Insert team assignments
                const { error: insertError } = await supabase
                    .from('player_teams')
                    .insert(
                        formData.selectedTeams.map(team => ({
                            player_id: playerData.id,
                            team_id: team.team_id,
                            number: team.number,
                            position: team.position,
                            is_active: team.is_active
                        }))
                    )

                if (insertError) throw insertError
            }

            // Reset form and refresh data
            setFormData({
                derby_name: '',
                preferred_number: '',
                selectedTeams: []
            })
            setShowAddForm(false)
            setEditingPlayer(null)
            fetchData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save player')
        }
    }

    // Handle player deletion
    const handleDelete = async (player: PlayerWithTeams) => {
        if (!confirm(`Are you sure you want to delete "${player.derby_name}"? This will remove all team assignments and stats.`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', player.id)

            if (error) throw error
            fetchData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete player')
        }
    }

    // Start editing a player
    const startEdit = (player: PlayerWithTeams) => {
        setEditingPlayer(player)
        setFormData({
            derby_name: player.derby_name,
            preferred_number: player.preferred_number,
            selectedTeams: player.teams.map(t => ({
                team_id: t.team.id,
                number: t.number,
                position: t.position,
                is_active: t.is_active
            }))
        })
        setShowAddForm(true)
    }

    // Add team assignment to form
    const addTeamAssignment = () => {
        setFormData({
            ...formData,
            selectedTeams: [
                ...formData.selectedTeams,
                {
                    team_id: teams[0]?.id || '',
                    number: formData.preferred_number,
                    position: 'blocker',
                    is_active: true
                }
            ]
        })
    }

    // Remove team assignment from form
    const removeTeamAssignment = (index: number) => {
        setFormData({
            ...formData,
            selectedTeams: formData.selectedTeams.filter((_, i) => i !== index)
        })
    }

    // Update team assignment
    const updateTeamAssignment = (index: number, field: string, value: string | boolean) => {
        const updated = [...formData.selectedTeams]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, selectedTeams: updated })
    }

    // Cancel form
    const cancelForm = () => {
        setFormData({
            derby_name: '',
            preferred_number: '',
            selectedTeams: []
        })
        setShowAddForm(false)
        setEditingPlayer(null)
        setError('')
    }

    if (loading) {
        return (
            <div className="players-container">
                <div className="loading">Loading players...</div>
            </div>
        )
    }

    return (
        <div className="players-container">
            <div className="players-header">
                <h1>Players Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                    disabled={showAddForm}
                >
                    Add New Player
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="player-form-container">
                    <form onSubmit={handleSubmit} className="player-form">
                        <h3>{editingPlayer ? 'Edit Player' : 'Add New Player'}</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="derby_name">Derby Name *</label>
                                <input
                                    id="derby_name"
                                    type="text"
                                    value={formData.derby_name}
                                    onChange={(e) => setFormData({ ...formData, derby_name: e.target.value })}
                                    placeholder="Enter derby name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="preferred_number">Preferred Number *</label>
                                <input
                                    id="preferred_number"
                                    type="text"
                                    value={formData.preferred_number}
                                    onChange={(e) => setFormData({ ...formData, preferred_number: e.target.value })}
                                    placeholder="e.g., 404"
                                    required
                                />
                            </div>
                        </div>

                        <div className="team-assignments">
                            <div className="team-assignments-header">
                                <h4>Team Assignments</h4>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={addTeamAssignment}
                                    disabled={teams.length === 0}
                                >
                                    Add Team
                                </button>
                            </div>

                            {formData.selectedTeams.map((assignment, index) => (
                                <div key={index} className="team-assignment">
                                    <div className="assignment-row">
                                        <select
                                            value={assignment.team_id}
                                            onChange={(e) => updateTeamAssignment(index, 'team_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Team</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>{team.name}</option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            value={assignment.number}
                                            onChange={(e) => updateTeamAssignment(index, 'number', e.target.value)}
                                            placeholder="Number"
                                            required
                                        />

                                        <select
                                            value={assignment.position}
                                            onChange={(e) => updateTeamAssignment(index, 'position', e.target.value)}
                                            required
                                        >
                                            <option value="blocker">Blocker</option>
                                            <option value="jammer">Jammer</option>
                                            <option value="pivot">Pivot</option>
                                        </select>

                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={assignment.is_active}
                                                onChange={(e) => updateTeamAssignment(index, 'is_active', e.target.checked)}
                                            />
                                            Active
                                        </label>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => removeTeamAssignment(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {formData.selectedTeams.length === 0 && (
                                <p className="no-assignments">No team assignments. Add at least one team.</p>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                {editingPlayer ? 'Update Player' : 'Create Player'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="players-grid">
                {players.length === 0 ? (
                    <div className="no-players">
                        <p>No players found. Create your first player to get started!</p>
                    </div>
                ) : (
                    players.map((player) => (
                        <div key={player.id} className="player-card">
                            <div className="player-card-header">
                                <h3 className="player-name">{player.derby_name}</h3>
                                <span className="preferred-number">#{player.preferred_number}</span>
                            </div>

                            <div className="player-teams">
                                {player.teams.map((teamAssignment, index) => (
                                    <div key={index} className="team-assignment-display">
                                        <div className="team-info">
                                            <span className="team-name">{teamAssignment.team.name}</span>
                                            <span className="team-number">#{teamAssignment.number}</span>
                                        </div>
                                        <div className="team-details">
                                            <span className="position">{teamAssignment.position}</span>
                                            <span className={`status ${teamAssignment.is_active ? 'active' : 'inactive'}`}>
                                                {teamAssignment.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="player-card-actions">
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => startEdit(player)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(player)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Players