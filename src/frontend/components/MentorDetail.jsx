import { useState } from 'react'

const emptyReviewForm = { rating: '5', comment: '' }

export default function MentorDetail({
  selectedMentor,
  backToBrowse,
  mentorReviews,
  reviewForm,
  setReviewForm,
  handleAddReview,
  handleDeleteReview,
  handleBookSession,
  authUser,
  formSubmitting,
  message,
  error,
}) {
  return (
    <section className="panel">
      <button className="ghost-btn" onClick={backToBrowse}>Back to Browse</button>

      <div className="mentor-hero">
        <div className="avatar-lg">{selectedMentor.firstName[0]}{selectedMentor.lastName[0]}</div>
        <div className="mentor-hero-info">
          <h2>{selectedMentor.firstName} {selectedMentor.lastName}</h2>
          <p className="skills-tag">{selectedMentor.skills}</p>
          <p className="mentor-rate">${selectedMentor.hourlyRate}<span>/hr</span></p>
        </div>
      </div>

      <div className="mentor-detail">
        {selectedMentor.bio && <p>{selectedMentor.bio}</p>}
        {selectedMentor.credentials && (
          <p className="muted">Credentials: {selectedMentor.credentials}</p>
        )}
        <p className="muted">Availability: {selectedMentor.availability || 'Not specified'}</p>

        {selectedMentor.userId !== authUser.id && (
          <button
            className="solid-btn"
            style={{ gridColumn: 'unset', width: 'fit-content' }}
            onClick={() => handleBookSession(selectedMentor)}
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Booking...' : `Book Session — $${selectedMentor.hourlyRate}`}
          </button>
        )}
      </div>

      <div className="reviews-section">
        <h3>Reviews ({mentorReviews.length})</h3>
        {mentorReviews.length === 0 && <p className="muted">No reviews yet.</p>}

        {mentorReviews.map(r => (
          <div className="review-card" key={r.id}>
            <p>
              <strong>{r.firstName} {r.lastName}</strong> — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            </p>
            {r.comment && <p>{r.comment}</p>}
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
              <select
                value={reviewForm.rating}
                onChange={e => setReviewForm(c => ({ ...c, rating: e.target.value }))}
              >
                <option value="5">★★★★★ (5)</option>
                <option value="4">★★★★☆ (4)</option>
                <option value="3">★★★☆☆ (3)</option>
                <option value="2">★★☆☆☆ (2)</option>
                <option value="1">★☆☆☆☆ (1)</option>
              </select>
            </label>
            <label className="wide">
              Comment
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm(c => ({ ...c, comment: e.target.value }))}
                rows={3}
              />
            </label>
            <button className="solid-btn" type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>
        )}
      </div>

      {message && <p className="feedback ok">{message}</p>}
      {error && <p className="feedback bad">{error}</p>}
    </section>
  )
}
