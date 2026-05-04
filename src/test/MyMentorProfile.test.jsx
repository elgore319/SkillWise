import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MyMentorProfile from '../frontend/components/MyMentorProfile'

const mockProfile = {
  skills: 'React, Node.js',
  bio: 'Full-stack developer',
  credentials: 'BS Computer Science',
  availability: 'Weekday evenings',
  hourlyRate: 60,
}

const defaultProps = {
  myMentorProfile: null,
  mentorForm: { bio: '', skills: '', credentials: '', hourlyRate: '', availability: '' },
  setMentorForm: vi.fn(),
  editingMentor: false,
  setEditingMentor: vi.fn(),
  handleCreateMentor: vi.fn(),
  handleUpdateMentor: vi.fn(),
  handleDeleteMentor: vi.fn(),
  loading: false,
  formSubmitting: false,
  message: null,
  error: null,
}

describe('MyMentorProfile', () => {
  it('renders the My Mentor Profile heading', () => {
    render(<MyMentorProfile {...defaultProps} />)
    expect(screen.getByText('My Mentor Profile')).toBeInTheDocument()
  })

  it('shows the create form when no profile exists', () => {
    render(<MyMentorProfile {...defaultProps} />)
    expect(screen.getByText('Become a Mentor')).toBeInTheDocument()
    expect(screen.getByText('Create Profile')).toBeInTheDocument()
  })

  it('shows profile details and Edit/Delete buttons when a profile exists', () => {
    render(<MyMentorProfile {...defaultProps} myMentorProfile={mockProfile} />)
    expect(screen.getByText('React, Node.js')).toBeInTheDocument()
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByText('Delete Profile')).toBeInTheDocument()
  })

  it('calls setEditingMentor when Edit Profile is clicked', () => {
    const setEditingMentor = vi.fn()
    render(<MyMentorProfile {...defaultProps} myMentorProfile={mockProfile} setEditingMentor={setEditingMentor} />)
    fireEvent.click(screen.getByText('Edit Profile'))
    expect(setEditingMentor).toHaveBeenCalledWith(true)
  })

  it('displays an error message when error prop is provided', () => {
    render(<MyMentorProfile {...defaultProps} error="Could not save profile" />)
    expect(screen.getByText('Could not save profile')).toBeInTheDocument()
  })

  it('shows the edit form with Save Changes button when editingMentor is true', () => {
    const editForm = { bio: 'Dev', skills: 'React', credentials: 'BS CS', hourlyRate: '60', availability: 'Evenings' }
    render(<MyMentorProfile {...defaultProps} myMentorProfile={mockProfile} editingMentor={true} mentorForm={editForm} />)
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })

  it('calls setEditingMentor(false) when Cancel is clicked in edit mode', () => {
    const setEditingMentor = vi.fn()
    const editForm = { bio: '', skills: '', credentials: '', hourlyRate: '', availability: '' }
    render(<MyMentorProfile {...defaultProps} myMentorProfile={mockProfile} editingMentor={true} setEditingMentor={setEditingMentor} mentorForm={editForm} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(setEditingMentor).toHaveBeenCalledWith(false)
  })

  it('triggers setMentorForm when the skills input changes', () => {
    const setMentorForm = vi.fn()
    render(<MyMentorProfile {...defaultProps} setMentorForm={setMentorForm} />)
    fireEvent.change(screen.getByPlaceholderText('Your teachable skills'), { target: { value: 'Python' } })
    expect(setMentorForm).toHaveBeenCalled()
  })

  it('triggers setMentorForm when the bio textarea changes', () => {
    const setMentorForm = vi.fn()
    render(<MyMentorProfile {...defaultProps} setMentorForm={setMentorForm} />)
    fireEvent.change(screen.getByPlaceholderText('Tell learners about yourself'), { target: { value: 'I teach' } })
    expect(setMentorForm).toHaveBeenCalled()
  })

  it('triggers setMentorForm when the credentials input changes', () => {
    const setMentorForm = vi.fn()
    render(<MyMentorProfile {...defaultProps} setMentorForm={setMentorForm} />)
    fireEvent.change(screen.getByPlaceholderText('Degrees, certifications, experience'), { target: { value: 'BS CS' } })
    expect(setMentorForm).toHaveBeenCalled()
  })

  it('triggers setMentorForm when the hourly rate input changes', () => {
    const setMentorForm = vi.fn()
    render(<MyMentorProfile {...defaultProps} setMentorForm={setMentorForm} />)
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '50' } })
    expect(setMentorForm).toHaveBeenCalled()
  })

  it('triggers setMentorForm when the availability input changes', () => {
    const setMentorForm = vi.fn()
    render(<MyMentorProfile {...defaultProps} setMentorForm={setMentorForm} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Weekday evenings'), { target: { value: 'Evenings' } })
    expect(setMentorForm).toHaveBeenCalled()
  })

  it('shows Saving... when formSubmitting is true', () => {
    render(<MyMentorProfile {...defaultProps} formSubmitting={true} />)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('displays a success message when message prop is provided', () => {
    render(<MyMentorProfile {...defaultProps} message="Profile saved!" />)
    expect(screen.getByText('Profile saved!')).toBeInTheDocument()
  })

  it('shows a loading spinner when loading is true', () => {
    render(<MyMentorProfile {...defaultProps} loading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows bio text when the profile has a bio', () => {
    render(<MyMentorProfile {...defaultProps} myMentorProfile={mockProfile} />)
    expect(screen.getByText('Full-stack developer')).toBeInTheDocument()
  })
})
