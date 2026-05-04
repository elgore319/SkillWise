import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MentorDetail from '../frontend/components/MentorDetail'

const mockMentor = {
  id: 1,
  userId: 99,
  firstName: 'Carol',
  lastName: 'White',
  skills: 'JavaScript',
  hourlyRate: 75,
  bio: 'Experienced developer',
  credentials: 'CS Degree',
  availability: 'Weekends',
}

const defaultProps = {
  selectedMentor: mockMentor,
  backToBrowse: vi.fn(),
  mentorReviews: [],
  reviewForm: { rating: '5', comment: '' },
  setReviewForm: vi.fn(),
  handleAddReview: vi.fn(),
  handleDeleteReview: vi.fn(),
  handleBookSession: vi.fn(),
  authUser: { id: 1 },
  formSubmitting: false,
  message: null,
  error: null,
}

describe('MentorDetail', () => {
  it("renders the mentor's name", () => {
    render(<MentorDetail {...defaultProps} />)
    expect(screen.getByText('Carol White')).toBeInTheDocument()
  })

  it('calls backToBrowse when Back to Browse button is clicked', () => {
    const backToBrowse = vi.fn()
    render(<MentorDetail {...defaultProps} backToBrowse={backToBrowse} />)
    fireEvent.click(screen.getByText('Back to Browse'))
    expect(backToBrowse).toHaveBeenCalled()
  })

  it('shows the Book Session button for a user who does not own the profile', () => {
    render(<MentorDetail {...defaultProps} />)
    expect(screen.getByText(/Book Session/)).toBeInTheDocument()
  })

  it('does not show the Book Session button for the mentor owner', () => {
    render(<MentorDetail {...defaultProps} authUser={{ id: 99 }} />)
    expect(screen.queryByText(/Book Session/)).not.toBeInTheDocument()
  })

  it('renders existing reviews', () => {
    const reviews = [{ id: 1, firstName: 'Dan', lastName: 'Lee', rating: 4, comment: 'Great mentor!', reviewerId: 2 }]
    render(<MentorDetail {...defaultProps} mentorReviews={reviews} />)
    expect(screen.getByText('Great mentor!')).toBeInTheDocument()
  })

  it('shows the Leave a Review form for a non-owner', () => {
    render(<MentorDetail {...defaultProps} />)
    expect(screen.getByText('Leave a Review')).toBeInTheDocument()
  })

  it('shows a Delete button on a review belonging to the current user', () => {
    const reviews = [{ id: 5, firstName: 'Me', lastName: 'User', rating: 5, comment: 'Awesome!', reviewerId: 1 }]
    render(<MentorDetail {...defaultProps} mentorReviews={reviews} />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls handleDeleteReview when Delete is clicked on own review', () => {
    const handleDeleteReview = vi.fn()
    const reviews = [{ id: 10, firstName: 'Me', lastName: 'User', rating: 5, comment: 'Awesome!', reviewerId: 1 }]
    render(<MentorDetail {...defaultProps} mentorReviews={reviews} handleDeleteReview={handleDeleteReview} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(handleDeleteReview).toHaveBeenCalledWith(10)
  })

  it('triggers Book Session handler when button is clicked', () => {
    const handleBookSession = vi.fn()
    render(<MentorDetail {...defaultProps} handleBookSession={handleBookSession} />)
    fireEvent.click(screen.getByText(/Book Session/))
    expect(handleBookSession).toHaveBeenCalledWith(mockMentor)
  })

  it('triggers review form rating change', () => {
    const setReviewForm = vi.fn()
    render(<MentorDetail {...defaultProps} setReviewForm={setReviewForm} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } })
    expect(setReviewForm).toHaveBeenCalled()
  })

  it('triggers review form comment change', () => {
    const setReviewForm = vi.fn()
    render(<MentorDetail {...defaultProps} setReviewForm={setReviewForm} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Very helpful!' } })
    expect(setReviewForm).toHaveBeenCalled()
  })

  it('displays an error message when error prop is provided', () => {
    render(<MentorDetail {...defaultProps} error="Booking failed" />)
    expect(screen.getByText('Booking failed')).toBeInTheDocument()
  })
})
