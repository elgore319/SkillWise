import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const emptyLogin = { email: '', password: '' }
const emptyRegister = { email: '', password: '', confirmPassword: '' }
const emptyReset = { email: '', newPassword: '', confirmPassword: '' }
const emptySetup = { firstName: '', lastName: '' }

function App() {
  const [users, setUsers] = useState([])
  const [authMode, setAuthMode] = useState('login')
  const [authUser, setAuthUser] = useState(null)
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [resetPasswordForm, setResetPasswordForm] = useState(emptyReset)
  const [setupForm, setSetupForm] = useState(emptySetup)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState('Checking API...')

  async function fetchUsers() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`)
      if (!response.ok) {
        throw new Error('Could not load users.')
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authUser?.profileCompleted) {
      fetchUsers()
    }
  }, [authUser])

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

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return users
    }

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
      return fullName.includes(normalizedQuery) || user.email.toLowerCase().includes(normalizedQuery)
    })
  }, [query, users])

  function getDisplayName(user) {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    return fullName || 'Profile setup pending'
  }

  function switchAuthMode(mode) {
    setAuthMode(mode)
    setError('')
    setMessage('')
  }

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
    setUsers([])
    setError('')
    setMessage('')
    setAuthMode('login')
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
        <p className="eyebrow">SkillWise Dashboard</p>
        <h1>Account Directory</h1>
        <p className="hero-copy">
          Registered accounts are listed below. New accounts complete setup one time after first login.
        </p>
        <p className="hero-copy">Signed in as {authUser.firstName} {authUser.lastName}.</p>
        <button type="button" className="logout-btn" onClick={logout}>Logout</button>
        <p className="status-pill" role="status">{apiStatus}</p>
      </header>

      <section className="panel list-panel">
        <div className="panel-headline">
          <h2>Users ({filteredUsers.length})</h2>
          <input
            className="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
          />
        </div>

        {loading ? <p className="muted">Loading users...</p> : null}
        {!loading && filteredUsers.length === 0 ? (
          <p className="muted">No users found yet.</p>
        ) : null}

        <div className="user-grid">
          {filteredUsers.map((user) => (
            <article className="user-card" key={user.id}>
              <p className="name">{getDisplayName(user)}</p>
              <p className="email">{user.email}</p>
              <p className="muted">Status: {user.profileCompleted ? 'Setup complete' : 'Pending setup'}</p>
            </article>
          ))}
        </div>

        {message ? <p className="feedback ok">{message}</p> : null}
        {error ? <p className="feedback bad">{error}</p> : null}
      </section>
    </main>
  )
}

export default App
