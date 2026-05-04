import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AuthPage from '../frontend/components/AuthPage'

vi.mock('../assets/title.png', () => ({ default: 'mock-logo' }))

const defaultProps = {
  authMode: 'login',
  switchAuthMode: vi.fn(),
  loginForm: { email: '', password: '' },
  onLoginInputChange: vi.fn(),
  handleLogin: vi.fn(),
  registerForm: { email: '', password: '', confirmPassword: '' },
  onRegisterInputChange: vi.fn(),
  handleRegister: vi.fn(),
  resetPasswordForm: { email: '', password: '', confirmPassword: '' },
  onResetInputChange: vi.fn(),
  handleResetPassword: vi.fn(),
  authSubmitting: false,
  message: null,
  error: null,
  apiStatus: 'ok',
}

describe('AuthPage', () => {
  it('renders the welcome heading', () => {
    render(<AuthPage {...defaultProps} />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
  })

  it('calls switchAuthMode when Register tab is clicked', () => {
    const switchAuthMode = vi.fn()
    render(<AuthPage {...defaultProps} switchAuthMode={switchAuthMode} />)
    fireEvent.click(screen.getByText('Register'))
    expect(switchAuthMode).toHaveBeenCalledWith('register')
  })

  it('renders the register form when authMode is register', () => {
    render(<AuthPage {...defaultProps} authMode="register" />)
    expect(screen.getByText('Create account')).toBeInTheDocument()
  })

  it('displays an error message when error prop is provided', () => {
    render(<AuthPage {...defaultProps} error="Invalid credentials" />)
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('shows loading text on the submit button when authSubmitting is true', () => {
    render(<AuthPage {...defaultProps} authSubmitting={true} />)
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('renders the reset password form when authMode is reset', () => {
    render(<AuthPage {...defaultProps} authMode="reset" />)
    expect(screen.getByText('Reset password')).toBeInTheDocument()
  })

  it('displays a success message when message prop is provided', () => {
    render(<AuthPage {...defaultProps} message="Password updated!" />)
    expect(screen.getByText('Password updated!')).toBeInTheDocument()
  })

  it('calls switchAuthMode when Forgot Password tab is clicked', () => {
    const switchAuthMode = vi.fn()
    render(<AuthPage {...defaultProps} switchAuthMode={switchAuthMode} />)
    fireEvent.click(screen.getByText('Forgot Password'))
    expect(switchAuthMode).toHaveBeenCalledWith('reset')
  })
})
