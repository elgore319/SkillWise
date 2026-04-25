import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const emptyLogin = { email: '', password: '' }
const emptyRegister = { email: '', password: '', confirmPassword: '' }
const emptyReset = { email: '', newPassword: '', confirmPassword: '' }
const emptySetup = { firstName: '', lastName: '' }
const emptyMentorForm = { bio: '', skills: '', credentials: '', hourlyRate: '', availability: '' }
const emptyMessageForm = { receiverId: '', content: '' }
const emptyReviewForm = { rating: '5', comment: '' }

function App() {
  // ── Auth state ──────────────────────────────────────────────
  const [authMode, setAuthMode] = useState('login')
  const [authUser, setAuthUser] = useState(() => {
    // Restore session from localStorage on first load
    try {
      const stored = localStorage.getItem('skillwise_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [resetPasswordForm, setResetPasswordForm] = useState(emptyReset)
  const [setupForm, setSetupForm] = useState(emptySetup)
  const [authSubmitting, setAuthSubmitting] = useState(false)

  // ── Dashboard state ─────────────────────────────────────────
  const [dashView, setDashView] = useState('browse')
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [mentors, setMentors] = useState([])
  const [myMentorProfile, setMyMentorProfile] = useState(null)
  const [mentorReviews, setMentorReviews] = useState([])
  const [messages, setMessages] = useState([])
  const [payments, setPayments] = useState([])
  const [users, setUsers] = useState([])
  const [skillFilter, setSkillFilter] = useState('')
  const [mentorForm, setMentorForm] = useState(emptyMentorForm)
  const [messageForm, setMessageForm] = useState(emptyMessageForm)
  const [reviewForm, setReviewForm] = useState(emptyReviewForm)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editingMentor, setEditingMentor] = useState(false)

  // ── Shared UI state ─────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState('Checking API...')

  // Fetch all mentor profiles with user info and average rating
  async function fetchMentors() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentors`)
      if (!res.ok) throw new Error('Could not load mentors.')
      setMentors(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all messages sent or received by the logged-in user
  async function fetchMessages() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages?userId=${authUser.id}`)
      if (!res.ok) throw new Error('Could not load messages.')
      setMessages(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all payments where the logged-in user is the payer or the mentor
  async function fetchPayments() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments?userId=${authUser.id}`)
      if (!res.ok) throw new Error('Could not load payments.')
      setPayments(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all users — populates the message recipient dropdown
  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`)
      if (res.ok) setUsers(await res.json())
    } catch { /* silent — non-critical */ }
  }

  // Check whether the logged-in user has an existing mentor profile
  async function checkMyMentorProfile() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentors`)
      if (!res.ok) throw new Error()
      const all = await res.json()
      const mine = all.find(m => m.userId === authUser.id) || null
      setMyMentorProfile(mine)
      if (mine) {
        setMentorForm({
          bio: mine.bio || '',
          skills: mine.skills || '',
          credentials: mine.credentials || '',
          hourlyRate: String(mine.hourlyRate || ''),
          availability: mine.availability || '',
        })
      } else {
        setMentorForm(emptyMentorForm)
      }
    } catch {
      setError('Could not load mentor profile.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch all reviews for a specific mentor
  async function fetchMentorReviews(mentorId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews?mentorId=${mentorId}`)
      if (res.ok) setMentorReviews(await res.json())
    } catch { /* silent */ }
  }

  // Re-fetch data whenever the active dashboard tab changes
  useEffect(() => {
    if (!authUser?.profileCompleted) return
    setError('')
    setMessage('')
    if (dashView === 'browse') fetchMentors()
    if (dashView === 'messages') { fetchMessages(); fetchUsers() }
    if (dashView === 'my-profile') checkMyMentorProfile()
    if (dashView === 'payments') fetchPayments()
  }, [dashView, authUser])

  useEffect(() => {
    if (authMode !== 'register') {
      setRegisterForm(emptyRegister)
    }

    if (authMode !== 'login') {
      setLoginForm(emptyLogin)
    }

    if (authMode !== 'reset') {
      setResetPasswordForm(emptyReset)
    }

    if (authMode !== 'setup') {
      setSetupForm(emptySetup)
    }

    setError('')
    setMessage('')
  }, [authMode])

  useEffect(() => {
    let ignore = false

    async function checkApi() {
      try {
        const response = await fetch(`${API_BASE_URL}/`)
        if (!response.ok) {
          throw new Error()
        }

        const data = await response.json()
        if (!ignore) {
          setApiStatus(data.message || 'API online')
        }
      } catch {
        if (!ignore) {
          setApiStatus('API offline or not reachable')
        }
      }
    }

    checkApi()

    return () => {
      ignore = true
    }
  }, [])

  // Filter mentor list by skill keyword or mentor name
  const filteredMentors = useMemo(() => {
    const q = skillFilter.trim().toLowerCase()
    if (!q) return mentors
    return mentors.filter(m =>
      m.skills.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    )
  }, [mentors, skillFilter])

  function switchAuthMode(mode) {
    setAuthMode(mode)
    setError('')
    setMessage('')
  }

  // ── Mentor CRUD ──────────────────────────────────────────────

  // Create a new mentor profile for the logged-in user
  async function handleCreateMentor(e) {
    e.preventDefault()
    setFormSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, ...mentorForm, hourlyRate: Number(mentorForm.hourlyRate) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create profile')
      setMessage('Mentor profile created!')
      setMyMentorProfile(data)
      setEditingMentor(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Save edits to the logged-in user's existing mentor profile
  async function handleUpdateMentor(e) {
    e.preventDefault()
    setFormSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentors/${myMentorProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mentorForm, hourlyRate: Number(mentorForm.hourlyRate) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      setMessage('Profile updated.')
      setMyMentorProfile(data)
      setEditingMentor(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete the logged-in user's mentor profile after confirmation
  async function handleDeleteMentor() {
    if (!window.confirm('Delete your mentor profile? This cannot be undone.')) return
    setFormSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentors/${myMentorProfile.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete profile')
      setMessage('Mentor profile deleted.')
      setMyMentorProfile(null)
      setMentorForm(emptyMentorForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // ── Messages ──────────────────────────────────────────────────

  // Send a direct message to another user
  async function handleSendMessage(e) {
    e.preventDefault()
    setFormSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: authUser.id, receiverId: Number(messageForm.receiverId), content: messageForm.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setMessage('Message sent.')
      setMessageForm(emptyMessageForm)
      fetchMessages()
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete a message the current user sent
  async function handleDeleteMessage(msgId) {
    try {
      await fetch(`${API_BASE_URL}/api/messages/${msgId}`, { method: 'DELETE' })
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch { /* silent */ }
  }

  // ── Reviews ───────────────────────────────────────────────────

  // Post a review for the currently viewed mentor profile
  async function handleAddReview(e) {
    e.preventDefault()
    setFormSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: selectedMentor.id, reviewerId: authUser.id, rating: Number(reviewForm.rating), comment: reviewForm.comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add review')
      setMessage('Review added.')
      setReviewForm(emptyReviewForm)
      fetchMentorReviews(selectedMentor.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete a review the current user left
  async function handleDeleteReview(reviewId) {
    try {
      await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, { method: 'DELETE' })
      setMentorReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch { /* silent */ }
  }

  // ── Payments ─────────────────────────────────────────────────

  // Book a session with a mentor and record the payment
  async function handleBookSession(mentor) {
    setFormSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerId: authUser.id, mentorId: mentor.id, amount: mentor.hourlyRate, currency: 'USD' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setMessage(`Session booked with ${mentor.firstName} ${mentor.lastName} for $${mentor.hourlyRate}!`)
    } catch (err) {
      setError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // ── Mentor detail navigation ──────────────────────────────────

  // Open a mentor's detail view and load their reviews
  function viewMentor(mentor) {
    setSelectedMentor(mentor)
    setMentorReviews([])
    setReviewForm(emptyReviewForm)
    setError('')
    setMessage('')
    fetchMentorReviews(mentor.id)
  }

  // Return to the mentor browse list
  function backToBrowse() {
    setSelectedMentor(null)
    setError('')
    setMessage('')
  }

  // ── Auth input handlers ───────────────────────────────────────

  function onLoginInputChange(event) {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
  }

  function onRegisterInputChange(event) {
    const { name, value } = event.target
    setRegisterForm((current) => ({ ...current, [name]: value }))
  }

  function onResetInputChange(event) {
    const { name, value } = event.target
    setResetPasswordForm((current) => ({ ...current, [name]: value }))
  }

  function onSetupInputChange(event) {
    const { name, value } = event.target
    setSetupForm((current) => ({ ...current, [name]: value }))
  }

  async function handleLogin(event) {
    event.preventDefault()
    setAuthSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setAuthUser(data.user)
      localStorage.setItem('skillwise_user', JSON.stringify(data.user))
      setMessage(data.user.profileCompleted ? 'Logged in successfully.' : 'Finish account setup to continue.')
      setLoginForm(emptyLogin)
      if (!data.user.profileCompleted) {
        setAuthMode('setup')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setAuthSubmitting(true)
    setError('')
    setMessage('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.')
      setAuthSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerForm.email.trim(),
          password: registerForm.password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setMessage('Account created. You can log in now.')
      setRegisterForm(emptyRegister)
      setAuthMode('login')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setAuthSubmitting(true)
    setError('')
    setMessage('')

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setError('Passwords do not match.')
      setAuthSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetPasswordForm.email.trim(),
          newPassword: resetPasswordForm.newPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed')
      }

      setMessage(data.message || 'Password updated. You can now login.')
      setResetPasswordForm(emptyReset)
      setAuthMode('login')
    } catch (err) {
      setError(err.message || 'Password reset failed')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleSetupAccount(event) {
    event.preventDefault()
    setAuthSubmitting(true)
    setError('')
    setMessage('')

    if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
      setError('First and last name are required.')
      setAuthSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/setup-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          firstName: setupForm.firstName.trim(),
          lastName: setupForm.lastName.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Account setup failed')
      }

      setAuthUser(data.user)
      localStorage.setItem('skillwise_user', JSON.stringify(data.user))
      setSetupForm(emptySetup)
      setMessage('Account setup complete.')
    } catch (err) {
      setError(err.message || 'Account setup failed')
    } finally {
      setAuthSubmitting(false)
    }
  }

  function logout() {
    setAuthUser(null)
    localStorage.removeItem('skillwise_user')
    setMentors([])
    setMessages([])
    setPayments([])
    setUsers([])
    setSelectedMentor(null)
    setMyMentorProfile(null)
    setError('')
    setMessage('')
    setAuthMode('login')
    setDashView('browse')
  }

  if (!authUser) {
    return (
      <main className="app-shell auth-shell">
        <header className="hero">
          <p className="eyebrow">SkillWise</p>
          <h1>Welcome Back</h1>
          <p className="hero-copy">Login first, then continue to your dashboard.</p>
          <p className="status-pill" role="status">{apiStatus}</p>
        </header>

        <section className="panel auth-panel">
          <div className="auth-tabs">
            <button type="button" className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => switchAuthMode('login')}>
              Login
            </button>
            <button type="button" className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => switchAuthMode('register')}>
              Register
            </button>
            <button type="button" className={authMode === 'reset' ? 'tab active' : 'tab'} onClick={() => switchAuthMode('reset')}>
              Forgot Password
            </button>
          </div>

          {authMode === 'login' ? (
            <form className="user-form auth-form" onSubmit={handleLogin}>
              <label className="wide">
                Email
                <input name="email" type="email" value={loginForm.email} onChange={onLoginInputChange} required />
              </label>
              <label className="wide">
                Password
                <input name="password" type="password" value={loginForm.password} onChange={onLoginInputChange} required />
              </label>
              <button className="solid-btn" type="submit" disabled={authSubmitting}>
                {authSubmitting ? 'Signing in...' : 'Login'}
              </button>
            </form>
          ) : null}

          {authMode === 'register' ? (
            <form className="user-form auth-form" onSubmit={handleRegister}>
              <label className="wide">
                Email
                <input name="email" type="email" value={registerForm.email} onChange={onRegisterInputChange} required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={registerForm.password} onChange={onRegisterInputChange} required />
              </label>
              <label>
                Confirm password
                <input name="confirmPassword" type="password" value={registerForm.confirmPassword} onChange={onRegisterInputChange} required />
              </label>
              <button className="solid-btn" type="submit" disabled={authSubmitting}>
                {authSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          ) : null}

          {authMode === 'reset' ? (
            <form className="user-form auth-form" onSubmit={handleResetPassword}>
              <label className="wide">
                Account email
                <input name="email" type="email" value={resetPasswordForm.email} onChange={onResetInputChange} required />
              </label>
              <label>
                New password
                <input name="newPassword" type="password" value={resetPasswordForm.newPassword} onChange={onResetInputChange} required />
              </label>
              <label>
                Confirm password
                <input name="confirmPassword" type="password" value={resetPasswordForm.confirmPassword} onChange={onResetInputChange} required />
              </label>
              <button className="solid-btn" type="submit" disabled={authSubmitting}>
                {authSubmitting ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          ) : null}

          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      </main>
    )
  }

  if (!authUser.profileCompleted) {
    return (
      <main className="app-shell auth-shell">
        <header className="hero">
          <p className="eyebrow">SkillWise</p>
          <h1>Set Up Your Account</h1>
          <p className="hero-copy">This is a one-time step. Add your name to finish onboarding.</p>
          <p className="status-pill" role="status">{apiStatus}</p>
        </header>

        <section className="panel auth-panel">
          <form className="user-form auth-form" onSubmit={handleSetupAccount}>
            <label>
              First name
              <input name="firstName" value={setupForm.firstName} onChange={onSetupInputChange} required />
            </label>
            <label>
              Last name
              <input name="lastName" value={setupForm.lastName} onChange={onSetupInputChange} required />
            </label>
            <button className="solid-btn" type="submit" disabled={authSubmitting}>
              {authSubmitting ? 'Saving profile...' : 'Finish setup'}
            </button>
          </form>

          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">SkillWise</p>
        <h1>Find Your Mentor</h1>
        <p className="hero-copy">Signed in as {authUser.firstName} {authUser.lastName}.</p>
        <button type="button" className="logout-btn" onClick={logout}>Logout</button>
        <p className="status-pill" role="status">{apiStatus}</p>
      </header>

      <nav className="dash-nav">
        <button className={dashView === 'browse' ? 'tab active' : 'tab'} onClick={() => { setDashView('browse'); setSelectedMentor(null) }}>Browse Mentors</button>
        <button className={dashView === 'messages' ? 'tab active' : 'tab'} onClick={() => setDashView('messages')}>Messages</button>
        <button className={dashView === 'my-profile' ? 'tab active' : 'tab'} onClick={() => setDashView('my-profile')}>My Mentor Profile</button>
        <button className={dashView === 'payments' ? 'tab active' : 'tab'} onClick={() => setDashView('payments')}>Payments</button>
      </nav>

      {/* ── Browse Mentors ── */}
      {dashView === 'browse' && !selectedMentor && (
        <section className="panel list-panel">
          <div className="panel-headline">
            <h2>Mentors ({filteredMentors.length})</h2>
            <input className="search" type="search" value={skillFilter} onChange={e => setSkillFilter(e.target.value)} placeholder="Search by skill or name" />
          </div>
          {loading ? <p className="muted">Loading mentors...</p> : null}
          {!loading && filteredMentors.length === 0 ? <p className="muted">No mentors found. Be the first — set up your mentor profile!</p> : null}
          <div className="user-grid">
            {filteredMentors.map(mentor => (
              <article className="user-card" key={mentor.id}>
                <p className="name">{mentor.firstName} {mentor.lastName}</p>
                <p className="skills-tag">{mentor.skills}</p>
                <p className="muted">${mentor.hourlyRate}/hr · {mentor.availability || 'Availability not set'}</p>
                {mentor.avgRating ? <p className="muted">★ {mentor.avgRating} ({mentor.reviewCount} reviews)</p> : null}
                <button className="ghost-btn" onClick={() => viewMentor(mentor)}>View Profile</button>
              </article>
            ))}
          </div>
          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      )}

      {/* ── Mentor Detail ── */}
      {dashView === 'browse' && selectedMentor && (
        <section className="panel">
          <button className="ghost-btn" onClick={backToBrowse}>← Back to Browse</button>
          <div className="mentor-detail">
            <h2>{selectedMentor.firstName} {selectedMentor.lastName}</h2>
            <p className="skills-tag">{selectedMentor.skills}</p>
            {selectedMentor.bio ? <p>{selectedMentor.bio}</p> : null}
            {selectedMentor.credentials ? <p className="muted">Credentials: {selectedMentor.credentials}</p> : null}
            <p className="muted">Availability: {selectedMentor.availability || 'Not specified'}</p>
            <p><strong>${selectedMentor.hourlyRate}/hr</strong></p>
            {selectedMentor.userId !== authUser.id && (
              <button className="solid-btn" style={{ gridColumn: 'unset', width: 'fit-content' }} onClick={() => handleBookSession(selectedMentor)} disabled={formSubmitting}>
                {formSubmitting ? 'Booking...' : `Book Session — $${selectedMentor.hourlyRate}`}
              </button>
            )}
          </div>
          <div className="reviews-section">
            <h3>Reviews ({mentorReviews.length})</h3>
            {mentorReviews.length === 0 ? <p className="muted">No reviews yet.</p> : null}
            {mentorReviews.map(r => (
              <div className="review-card" key={r.id}>
                <p><strong>{r.firstName} {r.lastName}</strong> — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                {r.comment ? <p>{r.comment}</p> : null}
                {r.reviewerId === authUser.id && (
                  <button className="ghost-btn danger" onClick={() => handleDeleteReview(r.id)}>Delete</button>
                )}
              </div>
            ))}
            {selectedMentor.userId !== authUser.id && (
              <form className="user-form" style={{ marginTop: '1rem' }} onSubmit={handleAddReview}>
                <h4 style={{ gridColumn: '1 / -1', margin: '0 0 0.25rem' }}>Leave a Review</h4>
                <label>
                  Rating
                  <select value={reviewForm.rating} onChange={e => setReviewForm(c => ({ ...c, rating: e.target.value }))}>
                    <option value="5">★★★★★ (5)</option>
                    <option value="4">★★★★☆ (4)</option>
                    <option value="3">★★★☆☆ (3)</option>
                    <option value="2">★★☆☆☆ (2)</option>
                    <option value="1">★☆☆☆☆ (1)</option>
                  </select>
                </label>
                <label className="wide">
                  Comment
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm(c => ({ ...c, comment: e.target.value }))} rows={3} />
                </label>
                <button className="solid-btn" type="submit" disabled={formSubmitting}>{formSubmitting ? 'Posting...' : 'Post Review'}</button>
              </form>
            )}
          </div>
          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      )}

      {/* ── Messages ── */}
      {dashView === 'messages' && (
        <section className="panel">
          <h2>Messages</h2>
          <form className="user-form" onSubmit={handleSendMessage}>
            <h3 className="wide" style={{ margin: '0 0 0.25rem' }}>New Message</h3>
            <label className="wide">
              To
              <select value={messageForm.receiverId} onChange={e => setMessageForm(c => ({ ...c, receiverId: e.target.value }))} required>
                <option value="">Select a user...</option>
                {users.filter(u => u.id !== authUser.id).map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Message
              <textarea value={messageForm.content} onChange={e => setMessageForm(c => ({ ...c, content: e.target.value }))} rows={3} required />
            </label>
            <button className="solid-btn" type="submit" disabled={formSubmitting}>{formSubmitting ? 'Sending...' : 'Send Message'}</button>
          </form>
          <div className="message-list">
            <h3>Inbox / Sent ({messages.length})</h3>
            {loading ? <p className="muted">Loading...</p> : null}
            {!loading && messages.length === 0 ? <p className="muted">No messages yet.</p> : null}
            {messages.map(msg => (
              <div className="message-card" key={msg.id}>
                <p className="muted">
                  {msg.senderId === authUser.id
                    ? `To: ${msg.receiverFirstName} ${msg.receiverLastName}`
                    : `From: ${msg.senderFirstName} ${msg.senderLastName}`}
                </p>
                <p>{msg.content}</p>
                <p className="muted small">{new Date(msg.sentAt).toLocaleString()}</p>
                {msg.senderId === authUser.id && (
                  <button className="ghost-btn danger" onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                )}
              </div>
            ))}
          </div>
          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      )}

      {/* ── My Mentor Profile ── */}
      {dashView === 'my-profile' && (
        <section className="panel">
          <h2>My Mentor Profile</h2>
          {loading ? <p className="muted">Loading...</p> : null}
          {!loading && myMentorProfile && !editingMentor && (
            <div className="mentor-detail">
              <p className="skills-tag">{myMentorProfile.skills}</p>
              {myMentorProfile.bio ? <p>{myMentorProfile.bio}</p> : null}
              {myMentorProfile.credentials ? <p className="muted">Credentials: {myMentorProfile.credentials}</p> : null}
              <p className="muted">Availability: {myMentorProfile.availability || 'Not set'}</p>
              <p><strong>${myMentorProfile.hourlyRate}/hr</strong></p>
              <div className="btn-row">
                <button className="ghost-btn" onClick={() => setEditingMentor(true)}>Edit Profile</button>
                <button className="ghost-btn danger" onClick={handleDeleteMentor} disabled={formSubmitting}>Delete Profile</button>
              </div>
            </div>
          )}
          {!loading && (myMentorProfile === null || editingMentor) && (
            <form className="user-form" onSubmit={myMentorProfile ? handleUpdateMentor : handleCreateMentor}>
              <h3 className="wide" style={{ margin: '0 0 0.25rem' }}>{myMentorProfile ? 'Edit Profile' : 'Become a Mentor'}</h3>
              <label className="wide">
                Skills (e.g. Python, Guitar, Cooking)
                <input value={mentorForm.skills} onChange={e => setMentorForm(c => ({ ...c, skills: e.target.value }))} required placeholder="Your teachable skills" />
              </label>
              <label className="wide">
                Bio
                <textarea value={mentorForm.bio} onChange={e => setMentorForm(c => ({ ...c, bio: e.target.value }))} rows={3} placeholder="Tell learners about yourself" />
              </label>
              <label className="wide">
                Credentials
                <input value={mentorForm.credentials} onChange={e => setMentorForm(c => ({ ...c, credentials: e.target.value }))} placeholder="Degrees, certifications, experience" />
              </label>
              <label>
                Hourly Rate (USD)
                <input type="number" min="0" step="0.01" value={mentorForm.hourlyRate} onChange={e => setMentorForm(c => ({ ...c, hourlyRate: e.target.value }))} required placeholder="0.00" />
              </label>
              <label>
                Availability
                <input value={mentorForm.availability} onChange={e => setMentorForm(c => ({ ...c, availability: e.target.value }))} placeholder="e.g. Weekday evenings" />
              </label>
              <div className="btn-row wide">
                <button className="solid-btn" style={{ gridColumn: 'unset' }} type="submit" disabled={formSubmitting}>{formSubmitting ? 'Saving...' : myMentorProfile ? 'Save Changes' : 'Create Profile'}</button>
                {editingMentor && <button type="button" className="ghost-btn" onClick={() => setEditingMentor(false)}>Cancel</button>}
              </div>
            </form>
          )}
          {message ? <p className="feedback ok">{message}</p> : null}
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      )}

      {/* ── Payments ── */}
      {dashView === 'payments' && (
        <section className="panel">
          <h2>Payments</h2>
          {loading ? <p className="muted">Loading...</p> : null}
          {!loading && payments.length === 0 ? <p className="muted">No payments yet. Book a mentor session to get started.</p> : null}
          <div className="user-grid">
            {payments.map(p => (
              <article className="user-card" key={p.id}>
                <p className="name">
                  {p.payerId === authUser.id
                    ? `Paid to: ${p.mentorFirstName} ${p.mentorLastName}`
                    : `Received from: ${p.payerFirstName} ${p.payerLastName}`}
                </p>
                <p className="skills-tag">{p.skills}</p>
                <p className="muted">{p.currency} ${p.amount} · <span className={`status-${p.status}`}>{p.status}</span></p>
                <p className="muted small">{new Date(p.createdAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
          {error ? <p className="feedback bad">{error}</p> : null}
        </section>
      )}
    </main>
  )
}

export default App
