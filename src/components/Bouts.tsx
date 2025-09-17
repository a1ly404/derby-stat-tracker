import React, { useState, useEffect } from 'react'
import { requireSupabase } from '../lib/supabase'
import type { Team } from '../lib/supabase'
import { getBoutEmoji } from '../utils/emojis'
import './Bouts.css'

export interface Bout {
    id: string
    home_team_id: string
    away_team_id: string
    bout_date: string
    venue: string
    home_score?: number
    away_score?: number
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    notes?: string
    created_at: string
    updated_at: string
}

interface BoutWithTeams extends Bout {
    home_team: Team
    away_team: Team
}

interface BoutFormData {
    home_team_id: string
    away_team_id: string
    bout_date: string
    venue: string
    home_score: number | ''
    away_score: number | ''
    status: Bout['status']
    notes: string
}

const Bouts: React.FC = () => {
    const [bouts, setBouts] = useState<BoutWithTeams[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')
    const [showForm, setShowForm] = useState(false)
    const [editingBout, setEditingBout] = useState<BoutWithTeams | null>(null)
    const [formData, setFormData] = useState<BoutFormData>({
        home_team_id: '',
        away_team_id: '',
        bout_date: '',
        venue: '',
        home_score: '',
        away_score: '',
        status: 'scheduled',
        notes: ''
    })

    const fetchBouts = async () => {
        try {
            const { data, error } = await requireSupabase()
                .from('bouts')
                .select(`
          *,
          home_team:teams!bouts_home_team_id_fkey(*),
          away_team:teams!bouts_away_team_id_fkey(*)
        `)
                .order('bout_date', { ascending: false })

            if (error) throw error
            setBouts(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch bouts')
        }
    }

    const fetchTeams = async () => {
        try {
            const { data, error } = await requireSupabase()
                .from('teams')
                .select('*')
                .order('name')

            if (error) throw error
            setTeams(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch teams')
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            await Promise.all([fetchBouts(), fetchTeams()])
            setLoading(false)
        }
        fetchData()
    }, [])

    const resetForm = () => {
        setFormData({
            home_team_id: '',
            away_team_id: '',
            bout_date: '',
            venue: '',
            home_score: '',
            away_score: '',
            status: 'scheduled',
            notes: ''
        })
        setEditingBout(null)
        setShowForm(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.home_team_id || !formData.away_team_id || !formData.bout_date || !formData.venue) {
            setError('Please fill in all required fields')
            return
        }

        if (formData.home_team_id === formData.away_team_id) {
            setError('Home and away teams must be different')
            return
        }

        try {
            const boutData = {
                home_team_id: formData.home_team_id,
                away_team_id: formData.away_team_id,
                bout_date: formData.bout_date,
                venue: formData.venue,
                home_score: formData.home_score === '' ? null : Number(formData.home_score),
                away_score: formData.away_score === '' ? null : Number(formData.away_score),
                status: formData.status,
                notes: formData.notes || null
            }

            if (editingBout) {
                const { error } = await requireSupabase()
                    .from('bouts')
                    .update(boutData)
                    .eq('id', editingBout.id)

                if (error) throw error
            } else {
                const { error } = await requireSupabase()
                    .from('bouts')
                    .insert([boutData])

                if (error) throw error
            }

            await fetchBouts()
            resetForm()
            setError('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save bout')
        }
    }

    const handleEdit = (bout: BoutWithTeams) => {
        setFormData({
            home_team_id: bout.home_team_id,
            away_team_id: bout.away_team_id,
            bout_date: bout.bout_date.split('T')[0], // Convert to date input format
            venue: bout.venue,
            home_score: bout.home_score ?? '',
            away_score: bout.away_score ?? '',
            status: bout.status,
            notes: bout.notes || ''
        })
        setEditingBout(bout)
        setShowForm(true)
    }

    const handleDelete = async (boutId: string) => {
        if (!confirm('Are you sure you want to delete this bout?')) return

        try {
            const { error } = await requireSupabase()
                .from('bouts')
                .delete()
                .eq('id', boutId)

            if (error) throw error
            await fetchBouts()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete bout')
        }
    }

    const getStatusColor = (status: Bout['status']) => {
        switch (status) {
            case 'scheduled': return 'status-scheduled'
            case 'in_progress': return 'status-in-progress'
            case 'completed': return 'status-completed'
            case 'cancelled': return 'status-cancelled'
            default: return 'status-scheduled'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="bouts-container">
                <div className="loading">Loading bouts...</div>
            </div>
        )
    }

    return (
        <div className="bouts-container">
            <div className="bouts-header">
                <div className="header-content">
                    <h1>Bout Management</h1>
                    <p className="subtitle">Schedule and track derby bouts between teams</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : 'Schedule New Bout'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button
                        className="error-close"
                        onClick={() => setError('')}
                    >
                        ×
                    </button>
                </div>
            )}

            {showForm && (
                <div className="bout-form-container">
                    <h2>{editingBout ? 'Edit Bout' : 'Schedule New Bout'}</h2>
                    <form onSubmit={handleSubmit} className="bout-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="home_team_id">Home Team *</label>
                                <select
                                    id="home_team_id"
                                    value={formData.home_team_id}
                                    onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select home team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="away_team_id">Away Team *</label>
                                <select
                                    id="away_team_id"
                                    value={formData.away_team_id}
                                    onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select away team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="bout_date">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    id="bout_date"
                                    value={formData.bout_date}
                                    onChange={(e) => setFormData({ ...formData, bout_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="venue">Venue *</label>
                                <input
                                    type="text"
                                    id="venue"
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    placeholder="Enter venue name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="home_score">Home Score</label>
                                <input
                                    type="number"
                                    id="home_score"
                                    value={formData.home_score}
                                    onChange={(e) => setFormData({ ...formData, home_score: e.target.value === '' ? '' : Number(e.target.value) })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="away_score">Away Score</label>
                                <input
                                    type="number"
                                    id="away_score"
                                    value={formData.away_score}
                                    onChange={(e) => setFormData({ ...formData, away_score: e.target.value === '' ? '' : Number(e.target.value) })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Bout['status'] })}
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes about the bout..."
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingBout ? 'Update Bout' : 'Schedule Bout'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {bouts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">{getBoutEmoji('empty')}</div>
                    <h3>No Bouts Scheduled</h3>
                    <p>Get started by scheduling your first bout between teams!</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        Schedule Your First Bout
                    </button>
                </div>
            ) : (
                <div className="bouts-grid">
                    {bouts.map(bout => (
                        <div key={bout.id} className="bout-card">
                            <div className="bout-header">
                                <div className={`bout-status ${getStatusColor(bout.status)}`}>
                                    {bout.status.replace('_', ' ').toUpperCase()}
                                </div>
                                <div className="bout-actions">
                                    <button
                                        onClick={() => handleEdit(bout)}
                                        className="btn btn-sm btn-secondary"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bout.id)}
                                        className="btn btn-sm btn-danger"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="bout-matchup">
                                <div className="team home-team">
                                    {bout.home_team.logo_url && (
                                        <img
                                            src={bout.home_team.logo_url}
                                            alt={`${bout.home_team.name} logo`}
                                            className="team-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    )}
                                    <div className="team-info">
                                        <div className="team-name">{bout.home_team.name}</div>
                                        <div className="team-label">Home</div>
                                    </div>
                                    {bout.home_score !== null && bout.home_score !== undefined && (
                                        <div className="team-score">{bout.home_score}</div>
                                    )}
                                </div>

                                <div className="vs-divider">VS</div>

                                <div className="team away-team">
                                    {bout.away_score !== null && bout.away_score !== undefined && (
                                        <div className="team-score">{bout.away_score}</div>
                                    )}
                                    <div className="team-info">
                                        <div className="team-name">{bout.away_team.name}</div>
                                        <div className="team-label">Away</div>
                                    </div>
                                    {bout.away_team.logo_url && (
                                        <img
                                            src={bout.away_team.logo_url}
                                            alt={`${bout.away_team.name} logo`}
                                            className="team-logo"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="bout-details">
                                <div className="bout-date">
                                    {getBoutEmoji('date')} {formatDate(bout.bout_date)}
                                </div>
                                <div className="bout-venue">
                                    {getBoutEmoji('venue')} {bout.venue}
                                </div>
                                {bout.notes && (
                                    <div className="bout-notes">
                                        {getBoutEmoji('notes')} {bout.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Bouts
