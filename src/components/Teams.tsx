import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Team } from '../lib/supabase'
import './Teams.css'

const Teams: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        logo_url: ''
    })
    const [error, setError] = useState<string>('')

    // Fetch teams from database
    const fetchTeams = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .order('name')

            if (error) throw error
            setTeams(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch teams')
        } finally {
            setLoading(false)
        }
    }

    // Load teams on component mount
    useEffect(() => {
        fetchTeams()
    }, [])

    // Handle form submission for adding/editing teams
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.name.trim()) {
            setError('Team name is required')
            return
        }

        try {
            if (editingTeam) {
                // Update existing team
                const { error } = await supabase
                    .from('teams')
                    .update({
                        name: formData.name.trim(),
                        logo_url: formData.logo_url.trim() || null
                    })
                    .eq('id', editingTeam.id)

                if (error) throw error
            } else {
                // Create new team
                const { error } = await supabase
                    .from('teams')
                    .insert({
                        name: formData.name.trim(),
                        logo_url: formData.logo_url.trim() || null
                    })

                if (error) throw error
            }

            // Reset form and refresh data
            setFormData({ name: '', logo_url: '' })
            setShowAddForm(false)
            setEditingTeam(null)
            fetchTeams()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save team')
        }
    }

    // Handle team deletion
    const handleDelete = async (team: Team) => {
        if (!confirm(`Are you sure you want to delete "${team.name}"? This will also remove all associated players and stats.`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', team.id)

            if (error) throw error
            fetchTeams()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete team')
        }
    }

    // Start editing a team
    const startEdit = (team: Team) => {
        setEditingTeam(team)
        setFormData({
            name: team.name,
            logo_url: team.logo_url || ''
        })
        setShowAddForm(true)
    }

    // Cancel form
    const cancelForm = () => {
        setFormData({ name: '', logo_url: '' })
        setShowAddForm(false)
        setEditingTeam(null)
        setError('')
    }

    if (loading) {
        return (
            <div className="teams-container">
                <div className="loading">Loading teams...</div>
            </div>
        )
    }

    return (
        <div className="teams-container">
            <div className="teams-header">
                <h1>Teams Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                    disabled={showAddForm}
                >
                    Add New Team
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="team-form-container">
                    <form onSubmit={handleSubmit} className="team-form">
                        <h3>{editingTeam ? 'Edit Team' : 'Add New Team'}</h3>

                        <div className="form-group">
                            <label htmlFor="name">Team Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter team name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="logo_url">Logo URL (optional)</label>
                            <input
                                id="logo_url"
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                {editingTeam ? 'Update Team' : 'Create Team'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="teams-grid">
                {teams.length === 0 ? (
                    <div className="no-teams">
                        <p>No teams found. Create your first team to get started!</p>
                    </div>
                ) : (
                    teams.map((team) => (
                        <div key={team.id} className="team-card">
                            <div className="team-card-header">
                                {team.logo_url && (
                                    <img
                                        src={team.logo_url}
                                        alt={`${team.name} logo`}
                                        className="team-logo"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                )}
                                <h3 className="team-name">{team.name}</h3>
                            </div>

                            <div className="team-card-info">
                                <p className="team-created">
                                    Created: {new Date(team.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="team-card-actions">
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => startEdit(team)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(team)}
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

export default Teams