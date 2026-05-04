import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Messages from '../frontend/components/Messages'

const mockUsers = [
  { id: 2, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
]

const mockMessages = [
  {
    id: 1,
    senderId: 2,
    receiverId: 1,
    content: 'Hello there!',
    senderFirstName: 'Jane',
    senderLastName: 'Doe',
    receiverFirstName: 'Me',
    receiverLastName: 'User',
    sentAt: new Date().toISOString(),
  },
  {
    id: 2,
    senderId: 1,
    receiverId: 2,
    content: 'Hey back!',
    senderFirstName: 'Me',
    senderLastName: 'User',
    receiverFirstName: 'Jane',
    receiverLastName: 'Doe',
    sentAt: new Date().toISOString(),
  },
]

const defaultProps = {
  messages: [],
  users: mockUsers,
  authUser: { id: 1 },
  messageForm: { receiverId: '', content: '' },
  setMessageForm: vi.fn(),
  handleSendMessage: vi.fn(),
  handleDeleteMessage: vi.fn(),
  loading: false,
  formSubmitting: false,
  message: null,
  error: null,
}

describe('Messages', () => {
  it('renders the Messages heading', () => {
    render(<Messages {...defaultProps} />)
    expect(screen.getByText('Messages')).toBeInTheDocument()
  })

  it('shows empty state when there are no messages', () => {
    render(<Messages {...defaultProps} />)
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument()
  })

  it('renders messages in the list', () => {
    render(<Messages {...defaultProps} messages={mockMessages} />)
    expect(screen.getByText('Hello there!')).toBeInTheDocument()
    expect(screen.getByText('Hey back!')).toBeInTheDocument()
  })

  it('shows a Delete button only on sent messages', () => {
    render(<Messages {...defaultProps} messages={mockMessages} />)
    const deleteButtons = screen.getAllByText('Delete')
    expect(deleteButtons).toHaveLength(1)
  })

  it('shows an error message when error prop is provided', () => {
    render(<Messages {...defaultProps} error="Failed to load messages" />)
    expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
  })

  it('shows a loading spinner in the message list when loading is true', () => {
    render(<Messages {...defaultProps} loading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('triggers setMessageForm when the message textarea changes', () => {
    const setMessageForm = vi.fn()
    render(<Messages {...defaultProps} setMessageForm={setMessageForm} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello!' } })
    expect(setMessageForm).toHaveBeenCalled()
  })

  it('triggers setMessageForm when the recipient select changes', () => {
    const setMessageForm = vi.fn()
    render(<Messages {...defaultProps} setMessageForm={setMessageForm} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
    expect(setMessageForm).toHaveBeenCalled()
  })

  it('calls handleDeleteMessage when Delete is clicked on a sent message', () => {
    const handleDeleteMessage = vi.fn()
    render(<Messages {...defaultProps} messages={mockMessages} handleDeleteMessage={handleDeleteMessage} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(handleDeleteMessage).toHaveBeenCalledWith(2)
  })
})
