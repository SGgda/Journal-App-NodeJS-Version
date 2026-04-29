import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Edit2, Trash2, BookOpen, Clock, Loader2 } from 'lucide-react'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

function App() {
  const [journals, setJournals] = null || useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchJournals()
  }, [])

  const fetchJournals = async () => {
    try {
      const response = await axios.get(`${API_URL}/journals`)
      setJournals(response.data)
    } catch (error) {
      console.error('Error fetching journals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingId) {
        await axios.put(`${API_URL}/journals/${editingId}`, formData)
      } else {
        await axios.post(`${API_URL}/journals`, formData)
      }
      setFormData({ title: '', content: '' })
      setEditingId(null)
      setIsFormOpen(false)
      fetchJournals()
    } catch (error) {
      console.error('Error saving journal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (journal) => {
    setFormData({ title: journal.title, content: journal.content })
    setEditingId(journal.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`${API_URL}/journals/${id}`)
        fetchJournals()
      } catch (error) {
        console.error('Error deleting journal:', error)
      }
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <BookOpen className="logo-icon" size={32} />
            <h1>My Journal</h1>
          </div>
          <button className="primary-btn" onClick={() => {
            setIsFormOpen(!isFormOpen)
            setEditingId(null)
            setFormData({ title: '', content: '' })
          }}>
            <Plus size={20} />
            <span>New Entry</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {isFormOpen && (
          <div className="form-container fade-in">
            <h2>{editingId ? 'Edit Entry' : 'Create New Entry'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title..."
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  required
                  rows="6"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your thoughts..."
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinner" size={20} /> : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner large" size={48} />
            <p>Loading your journals...</p>
          </div>
        ) : (
          <div className="journals-grid">
            {journals && journals.length > 0 ? (
              journals.map((journal) => (
                <article key={journal.id} className="journal-card fade-in">
                  <div className="journal-header">
                    <h3>{journal.title}</h3>
                    <div className="journal-actions">
                      <button className="icon-btn edit" onClick={() => handleEdit(journal)} title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDelete(journal.id)} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="journal-meta">
                    <Clock size={14} />
                    <span>{formatDate(journal.created_at)}</span>
                  </div>
                  <p className="journal-content">{journal.content}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <BookOpen size={64} className="empty-icon" />
                <h2>No journals yet</h2>
                <p>Click "New Entry" to start writing your thoughts.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
