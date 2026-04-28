export default function BrowseMentors({
  filteredMentors,
  skillFilter,
  setSkillFilter,
  loading,
  viewMentor,
  message,
  error,
}) {
  return (
    <section className="panel list-panel">
      <div className="panel-headline">
        <h2>Mentors ({filteredMentors.length})</h2>
        <input
          className="search"
          type="search"
          value={skillFilter}
          onChange={e => setSkillFilter(e.target.value)}
          placeholder="Search by skill or name"
        />
      </div>

      {loading && <div className="spinner" role="status" aria-label="Loading" />}
      {!loading && filteredMentors.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <p>No mentors found. Be the first — set up your mentor profile!</p>
        </div>
      )}

      <div className="user-grid">
        {filteredMentors.map(mentor => (
          <article className="user-card" key={mentor.id}>
            <div className="avatar-circle">{mentor.firstName[0]}{mentor.lastName[0]}</div>
            <p className="name">{mentor.firstName} {mentor.lastName}</p>
            <p className="skills-tag">{mentor.skills}</p>
            <p className="muted">${mentor.hourlyRate}/hr · {mentor.availability || 'Availability not set'}</p>
            {mentor.avgRating
              ? <p className="muted">★ {mentor.avgRating} ({mentor.reviewCount} reviews)</p>
              : null
            }
            <button className="ghost-btn" onClick={() => viewMentor(mentor)}>View Profile</button>
          </article>
        ))}
      </div>

      {message && <p className="feedback ok">{message}</p>}
      {error && <p className="feedback bad">{error}</p>}
    </section>
  )
}
