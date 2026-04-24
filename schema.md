skillwise.db

---

Table: users

columns: id, firstName, lastName, email, password, profileCompleted;

{
   id: int,
   firstName: string,
   lastName: string,
   email: string,
   password: string,
   profileCompleted: boolean
}

---

Table: mentors

columns: id, userId, bio, skills, credentials, hourlyRate, availability, createdAt;

{
   id: int,
   userId: int,         // foreign key → users.id (one profile per user)
   bio: string,
   skills: string,      // comma-separated list of teachable skills
   credentials: string,
   hourlyRate: decimal,
   availability: string,
   createdAt: string
}

---

Table: reviews

columns: id, mentorId, reviewerId, rating, comment, createdAt;

{
   id: int,
   mentorId: int,       // foreign key → mentors.id
   reviewerId: int,     // foreign key → users.id
   rating: int,         // 1–5
   comment: string,
   createdAt: string
}

---

Table: messages

columns: id, senderId, receiverId, content, sentAt;

{
   id: int,
   senderId: int,       // foreign key → users.id
   receiverId: int,     // foreign key → users.id
   content: string,
   sentAt: string
}

---

Table: payments

columns: id, payerId, mentorId, amount, currency, status, createdAt;

{
   id: int,
   payerId: int,        // foreign key → users.id
   mentorId: int,       // foreign key → mentors.id
   amount: decimal,
   currency: string,
   status: string,      // pending | completed | refunded
   createdAt: string
}