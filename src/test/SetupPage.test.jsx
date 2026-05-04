import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SetupPage from '../frontend/components/SetupPage'

const defaultProps = {
  setupForm: { firstName: '', lastName: '' },
  onSetupInputChange: vi.fn(),
  handleSetupAccount: vi.fn(),
  authSubmitting: false,
  message: null,
  error: null,
  apiStatus: 'ok',
}

describe('SetupPage', () => {
  it('renders the setup heading', () => {
    render(<SetupPage {...defaultProps} />)
    expect(screen.getByText('Set Up Your Account')).toBeInTheDocument()
  })

  it('displays an error message when error prop is provided', () => {
    render(<SetupPage {...defaultProps} error="Setup failed" />)
    expect(screen.getByText('Setup failed')).toBeInTheDocument()
  })

  it('displays a success message when message prop is provided', () => {
    render(<SetupPage {...defaultProps} message="Account ready!" />)
    expect(screen.getByText('Account ready!')).toBeInTheDocument()
  })

  it('shows loading text on the submit button when authSubmitting is true', () => {
    render(<SetupPage {...defaultProps} authSubmitting={true} />)
    expect(screen.getByText('Saving profile...')).toBeInTheDocument()
  })
})
