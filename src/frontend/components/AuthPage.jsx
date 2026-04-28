import logo from '../../assets/title.png'

export default function AuthPage({
  authMode,
  switchAuthMode,
  loginForm,
  onLoginInputChange,
  handleLogin,
  registerForm,
  onRegisterInputChange,
  handleRegister,
  resetPasswordForm,
  onResetInputChange,
  handleResetPassword,
  authSubmitting,
  message,
  error,
  apiStatus,
}) {
  return (
    <main className="app-shell auth-shell">
      <header className="hero">
        <img src={logo} alt="SkillWise" className="hero-logo" />
        <h1>Welcome Back</h1>
        <p className="hero-copy">Login first, then continue to your dashboard.</p>

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

        {authMode === 'login' && (
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
        )}

        {authMode === 'register' && (
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
        )}

        {authMode === 'reset' && (
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
        )}

        {message && <p className="feedback ok">{message}</p>}
        {error && <p className="feedback bad">{error}</p>}
      </section>
    </main>
  )
}
