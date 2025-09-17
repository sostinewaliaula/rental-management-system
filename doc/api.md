## API

Base URL (dev): `http://localhost:4000/api`

Auth
- POST `/auth/login`
  - body: `{ email, password }`
  - 200: `{ token, user: { id, name, email, role } }`

- GET `/auth/me`
  - header: `Authorization: Bearer <token>`
  - 200: `{ user: { id, name, email, role } }`

Admin Users (require admin token)
- GET `/users` → `{ users: User[] }`
- POST `/users` → create `{ name, email, password, role }`
- PUT `/users/:id` → update any subset `{ name?, email?, password?, role? }`
- DELETE `/users/:id` → 204

Notes
- JWT secret from env `JWT_SECRET`.
- Passwords hashed with bcrypt.


