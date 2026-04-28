export default function Messages({
  messages,
  users,
  authUser,
  messageForm,
  setMessageForm,
  handleSendMessage,
  handleDeleteMessage,
  loading,
  formSubmitting,
  message,
  error,
}) {
  return (
    <section className="panel">
      <h2>Messages</h2>

      <form className="user-form" onSubmit={handleSendMessage}>
        <h3 className="wide" style={{ margin: '0 0 0.25rem' }}>New Message</h3>
        <label className="wide">
          To
          <select
            value={messageForm.receiverId}
            onChange={e => setMessageForm(c => ({ ...c, receiverId: e.target.value }))}
            required
          >
            <option value="">Select a user...</option>
            {users
              .filter(u => u.id !== authUser.id)
              .map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))
            }
          </select>
        </label>
        <label className="wide">
          Message
          <textarea
            value={messageForm.content}
            onChange={e => setMessageForm(c => ({ ...c, content: e.target.value }))}
            rows={3}
            required
          />
        </label>
        <button className="solid-btn" type="submit" disabled={formSubmitting}>
          {formSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <div className="message-list">
        <h3>Inbox / Sent ({messages.length})</h3>
        {loading && <div className="spinner" role="status" aria-label="Loading" />}
        {!loading && messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <p>No messages yet. Send one above!</p>
          </div>
        )}

        {messages.map(msg => {
          const isSent = msg.senderId === authUser.id
          return (
            <div className={`message-card ${isSent ? 'msg-sent' : 'msg-received'}`} key={msg.id}>
              <p className="msg-label">
                {isSent
                  ? `To: ${msg.receiverFirstName} ${msg.receiverLastName}`
                  : `From: ${msg.senderFirstName} ${msg.senderLastName}`}
              </p>
              <p className="msg-content">{msg.content}</p>
              <p className="muted small">{new Date(msg.sentAt).toLocaleString()}</p>
              {isSent && (
                <button className="ghost-btn danger" onClick={() => handleDeleteMessage(msg.id)}>
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>

      {message && <p className="feedback ok">{message}</p>}
      {error && <p className="feedback bad">{error}</p>}
    </section>
  )
}
