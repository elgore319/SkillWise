export default function Payments({ payments, authUser, loading, error }) {
  return (
    <section className="panel">
      <h2>Payments</h2>

      {loading && <div className="spinner" role="status" aria-label="Loading" />}
      {!loading && payments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <p>No payments yet. Book a mentor session to get started.</p>
        </div>
      )}

      <div className="user-grid">
        {payments.map(p => (
          <article className="user-card payment-card" key={p.id}>
            <div className="payment-amount">${p.amount} <span className="payment-currency">{p.currency}</span></div>
            <p className="name">
              {p.payerId === authUser.id
                ? `Paid to: ${p.mentorFirstName} ${p.mentorLastName}`
                : `Received from: ${p.payerFirstName} ${p.payerLastName}`}
            </p>
            <p className="skills-tag">{p.skills}</p>
            <p className="muted small">{new Date(p.createdAt).toLocaleString()}</p>
            <span className={`status-badge status-${p.status}`}>{p.status}</span>
          </article>
        ))}
      </div>

      {error && <p className="feedback bad">{error}</p>}
    </section>
  )
}
