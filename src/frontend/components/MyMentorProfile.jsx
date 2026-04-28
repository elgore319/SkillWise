const emptyMentorForm = { bio: '', skills: '', credentials: '', hourlyRate: '', availability: '' }

export default function MyMentorProfile({
  myMentorProfile,
  mentorForm,
  setMentorForm,
  editingMentor,
  setEditingMentor,
  handleCreateMentor,
  handleUpdateMentor,
  handleDeleteMentor,
  loading,
  formSubmitting,
  message,
  error,
}) {
  return (
    <section className="panel">
      <h2>My Mentor Profile</h2>

      {loading && <div className="spinner" role="status" aria-label="Loading" />}

      {!loading && myMentorProfile && !editingMentor && (
        <div className="mentor-detail">
          <p className="skills-tag">{myMentorProfile.skills}</p>
          {myMentorProfile.bio && <p>{myMentorProfile.bio}</p>}
          {myMentorProfile.credentials && (
            <p className="muted">Credentials: {myMentorProfile.credentials}</p>
          )}
          <p className="muted">Availability: {myMentorProfile.availability || 'Not set'}</p>
          <p><strong>${myMentorProfile.hourlyRate}/hr</strong></p>
          <div className="btn-row">
            <button className="ghost-btn" onClick={() => setEditingMentor(true)}>Edit Profile</button>
            <button className="ghost-btn danger" onClick={handleDeleteMentor} disabled={formSubmitting}>
              Delete Profile
            </button>
          </div>
        </div>
      )}

      {!loading && (myMentorProfile === null || editingMentor) && (
        <form className="user-form" onSubmit={myMentorProfile ? handleUpdateMentor : handleCreateMentor}>
          <h3 className="wide" style={{ margin: '0 0 0.25rem' }}>
            {myMentorProfile ? 'Edit Profile' : 'Become a Mentor'}
          </h3>
          <label className="wide">
            Skills (e.g. Python, Guitar, Cooking)
            <input
              value={mentorForm.skills}
              onChange={e => setMentorForm(c => ({ ...c, skills: e.target.value }))}
              required
              placeholder="Your teachable skills"
            />
          </label>
          <label className="wide">
            Bio
            <textarea
              value={mentorForm.bio}
              onChange={e => setMentorForm(c => ({ ...c, bio: e.target.value }))}
              rows={3}
              placeholder="Tell learners about yourself"
            />
          </label>
          <label className="wide">
            Credentials
            <input
              value={mentorForm.credentials}
              onChange={e => setMentorForm(c => ({ ...c, credentials: e.target.value }))}
              placeholder="Degrees, certifications, experience"
            />
          </label>
          <label>
            Hourly Rate (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={mentorForm.hourlyRate}
              onChange={e => setMentorForm(c => ({ ...c, hourlyRate: e.target.value }))}
              required
              placeholder="0.00"
            />
          </label>
          <label>
            Availability
            <input
              value={mentorForm.availability}
              onChange={e => setMentorForm(c => ({ ...c, availability: e.target.value }))}
              placeholder="e.g. Weekday evenings"
            />
          </label>
          <div className="btn-row wide">
            <button
              className="solid-btn"
              style={{ gridColumn: 'unset' }}
              type="submit"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Saving...' : myMentorProfile ? 'Save Changes' : 'Create Profile'}
            </button>
            {editingMentor && (
              <button type="button" className="ghost-btn" onClick={() => setEditingMentor(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {message && <p className="feedback ok">{message}</p>}
      {error && <p className="feedback bad">{error}</p>}
    </section>
  )
}
