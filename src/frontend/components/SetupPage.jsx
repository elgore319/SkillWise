export default function SetupPage({
  setupForm,
  onSetupInputChange,
  handleSetupAccount,
  authSubmitting,
  message,
  error,
  apiStatus,
}) {
  return (
    <main className="app-shell auth-shell">
      <header className="hero">
        <p className="eyebrow">SkillWise</p>
        <h1>Set Up Your Account</h1>
        <p className="hero-copy">This is a one-time step. Add your name to finish onboarding.</p>

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

        {message && <p className="feedback ok">{message}</p>}
        {error && <p className="feedback bad">{error}</p>}
      </section>
    </main>
  )
}
