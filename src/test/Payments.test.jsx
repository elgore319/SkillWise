import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Payments from '../frontend/components/Payments'

const mockPayments = [
  {
    id: 1,
    payerId: 1,
    amount: 75,
    currency: 'USD',
    skills: 'JavaScript',
    status: 'completed',
    mentorFirstName: 'Carol',
    mentorLastName: 'White',
    payerFirstName: 'Me',
    payerLastName: 'User',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    payerId: 2,
    amount: 50,
    currency: 'USD',
    skills: 'Python',
    status: 'pending',
    mentorFirstName: 'Me',
    mentorLastName: 'User',
    payerFirstName: 'Alice',
    payerLastName: 'Smith',
    createdAt: new Date().toISOString(),
  },
]

const defaultProps = {
  payments: [],
  authUser: { id: 1 },
  loading: false,
  error: null,
}

describe('Payments', () => {
  it('renders the Payments heading', () => {
    render(<Payments {...defaultProps} />)
    expect(screen.getByText('Payments')).toBeInTheDocument()
  })

  it('shows empty state when there are no payments', () => {
    render(<Payments {...defaultProps} />)
    expect(screen.getByText(/No payments yet/)).toBeInTheDocument()
  })

  it('renders payment cards when payments are provided', () => {
    render(<Payments {...defaultProps} payments={mockPayments} />)
    expect(screen.getByText('$75')).toBeInTheDocument()
    expect(screen.getByText('Paid to: Carol White')).toBeInTheDocument()
  })

  it('shows "Received from" for incoming payments', () => {
    render(<Payments {...defaultProps} payments={mockPayments} />)
    expect(screen.getByText('Received from: Alice Smith')).toBeInTheDocument()
  })

  it('displays an error message when error prop is provided', () => {
    render(<Payments {...defaultProps} error="Failed to load payments" />)
    expect(screen.getByText('Failed to load payments')).toBeInTheDocument()
  })
})
