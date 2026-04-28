import { useEffect, useMemo, useState } from 'react'
import './App.css'
import AuthPage from './components/AuthPage.jsx'
import SetupPage from './components/SetupPage.jsx'
import BrowseMentors from './components/BrowseMentors.jsx'
import MentorDetail from './components/MentorDetail.jsx'
import Messages from './components/Messages.jsx'
import MyMentorProfile from './components/MyMentorProfile.jsx'
import Payments from './components/Payments.jsx'
import logo from '../assets/title.png'

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
    if (!mentorForm.skills.trim()) {
      setError('Skills are required.')
      setFormSubmitting(false)
      return
    }
    const rate = Number(mentorForm.hourlyRate)
    if (!mentorForm.hourlyRate || isNaN(rate) || rate <= 0) {
      setError('Hourly rate must be a number greater than 0.')
      setFormSubmitting(false)
      return
    }
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
    if (!mentorForm.skills.trim()) {
      setError('Skills are required.')
      setFormSubmitting(false)
      return
    }
    const rate = Number(mentorForm.hourlyRate)
    if (!mentorForm.hourlyRate || isNaN(rate) || rate <= 0) {
      setError('Hourly rate must be a number greater than 0.')
      setFormSubmitting(false)
      return
    }
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
    if (!messageForm.receiverId) {
      setError('Please select a recipient.')
      setFormSubmitting(false)
      return
    }
    if (!messageForm.content.trim()) {
      setError('Message cannot be empty.')
      setFormSubmitting(false)
      return
    }
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
    if (!reviewForm.comment.trim()) {
      setError('Please write a comment for your review.')
      setFormSubmitting(false)
      return
    }
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(loginForm.email.trim())) {
      setError('Please enter a valid email address.')
      setAuthSubmitting(false)
      return
    }
    if (!loginForm.password) {
      setError('Password is required.')
      setAuthSubmitting(false)
      return
    }

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.email.trim())) {
      setError('Please enter a valid email address.')
      setAuthSubmitting(false)
      return
    }
    if (registerForm.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setAuthSubmitting(false)
      return
    }
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetPasswordForm.email.trim())) {
      setError('Please enter a valid email address.')
      setAuthSubmitting(false)
      return
    }
    if (resetPasswordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      setAuthSubmitting(false)
      return
    }
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
    const nameRegex = /^[a-zA-Z\s'\-]+$/
    if (!nameRegex.test(setupForm.firstName.trim()) || !nameRegex.test(setupForm.lastName.trim())) {
      setError('Names may only contain letters, spaces, hyphens, and apostrophes.')
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
      <AuthPage
        authMode={authMode}
        switchAuthMode={switchAuthMode}
        loginForm={loginForm}
        onLoginInputChange={onLoginInputChange}
        handleLogin={handleLogin}
        registerForm={registerForm}
        onRegisterInputChange={onRegisterInputChange}
        handleRegister={handleRegister}
        resetPasswordForm={resetPasswordForm}
        onResetInputChange={onResetInputChange}
        handleResetPassword={handleResetPassword}
        authSubmitting={authSubmitting}
        message={message}
        error={error}
        apiStatus={apiStatus}
      />
    )
  }

  if (!authUser.profileCompleted) {
    return (
      <SetupPage
        setupForm={setupForm}
        onSetupInputChange={onSetupInputChange}
        handleSetupAccount={handleSetupAccount}
        authSubmitting={authSubmitting}
        message={message}
        error={error}
        apiStatus={apiStatus}
      />
    )
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <img src={logo} alt="SkillWise" className="hero-logo" />
        <h1>Find Your Mentor</h1>
        <p className="hero-copy">Signed in as {authUser.firstName} {authUser.lastName}.</p>
        <button type="button" className="logout-btn" onClick={logout}>Logout</button>
      </header>

      <nav className="dash-nav">
        <button className={dashView === 'browse' ? 'tab active' : 'tab'} onClick={() => { setDashView('browse'); setSelectedMentor(null) }}>Browse Mentors</button>
        <button className={dashView === 'messages' ? 'tab active' : 'tab'} onClick={() => setDashView('messages')}>Messages</button>
        <button className={dashView === 'my-profile' ? 'tab active' : 'tab'} onClick={() => setDashView('my-profile')}>My Mentor Profile</button>
        <button className={dashView === 'payments' ? 'tab active' : 'tab'} onClick={() => setDashView('payments')}>Payments</button>
      </nav>

      {dashView === 'browse' && !selectedMentor && (
        <BrowseMentors
          filteredMentors={filteredMentors}
          skillFilter={skillFilter}
          setSkillFilter={setSkillFilter}
          loading={loading}
          viewMentor={viewMentor}
          message={message}
          error={error}
        />
      )}

      {dashView === 'browse' && selectedMentor && (
        <MentorDetail
          selectedMentor={selectedMentor}
          backToBrowse={backToBrowse}
          mentorReviews={mentorReviews}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          handleAddReview={handleAddReview}
          handleDeleteReview={handleDeleteReview}
          handleBookSession={handleBookSession}
          authUser={authUser}
          formSubmitting={formSubmitting}
          message={message}
          error={error}
        />
      )}

      {dashView === 'messages' && (
        <Messages
          messages={messages}
          users={users}
          authUser={authUser}
          messageForm={messageForm}
          setMessageForm={setMessageForm}
          handleSendMessage={handleSendMessage}
          handleDeleteMessage={handleDeleteMessage}
          loading={loading}
          formSubmitting={formSubmitting}
          message={message}
          error={error}
        />
      )}

      {dashView === 'my-profile' && (
        <MyMentorProfile
          myMentorProfile={myMentorProfile}
          mentorForm={mentorForm}
          setMentorForm={setMentorForm}
          editingMentor={editingMentor}
          setEditingMentor={setEditingMentor}
          handleCreateMentor={handleCreateMentor}
          handleUpdateMentor={handleUpdateMentor}
          handleDeleteMentor={handleDeleteMentor}
          loading={loading}
          formSubmitting={formSubmitting}
          message={message}
          error={error}
        />
      )}

      {dashView === 'payments' && (
        <Payments
          payments={payments}
          authUser={authUser}
          loading={loading}
          error={error}
        />
      )}
    </main>
  )
}

export default App

