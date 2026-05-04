import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BrowseMentors from '../frontend/components/BrowseMentors'

const mockMentors = [
  { id: 1, firstName: 'Alice', lastName: 'Smith', skills: 'Python', hourlyRate: 50, availability: 'Evenings', avgRating: null, reviewCount: 0 },
  { id: 2, firstName: 'Bob', lastName: 'Jones', skills: 'Guitar', hourlyRate: 30, availability: 'Weekends', avgRating: '4.5', reviewCount: 3 },
]

const defaultProps = {
  filteredMentors: [],
  skillFilter: '',
  setSkillFilter: vi.fn(),
  loading: false,
  viewMentor: vi.fn(),
  message: null,
  error: null,
}

describe('BrowseMentors', () => {
  it('renders the mentors heading', () => {
    render(<BrowseMentors {...defaultProps} />)
    expect(screen.getByText('Mentors (0)')).toBeInTheDocument()
  })

  it('shows mentor cards when mentors are provided', () => {
    render(<BrowseMentors {...defaultProps} filteredMentors={mockMentors} />)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('shows the empty state message when no mentors match', () => {
    render(<BrowseMentors {...defaultProps} />)
    expect(screen.getByText(/No mentors found/)).toBeInTheDocument()
  })

  it('shows a loading spinner when loading is true', () => {
    render(<BrowseMentors {...defaultProps} loading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('calls viewMentor when View Profile is clicked', () => {
    const viewMentor = vi.fn()
    render(<BrowseMentors {...defaultProps} filteredMentors={mockMentors} viewMentor={viewMentor} />)
    fireEvent.click(screen.getAllByText('View Profile')[0])
    expect(viewMentor).toHaveBeenCalledWith(mockMentors[0])
  })

  it('calls setSkillFilter when the search field changes', () => {
    const setSkillFilter = vi.fn()
    render(<BrowseMentors {...defaultProps} setSkillFilter={setSkillFilter} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Python' } })
    expect(setSkillFilter).toHaveBeenCalled()
  })
})
