## Frontend

Run:
```powershell
npm run dev
```

Dev URL: http://localhost:5173 (auto-switches if busy)

Login page: `/login`
- Use seeded users to sign in.
- On success, stores `token` and `user` in `localStorage` and redirects by role:
  - admin → `/admin`
  - landlord → `/dashboard`
  - tenant → `/tenant-dashboard`

Seeded logins:
- admin@example.com / Admin@123
- landlord@example.com / Landlord@123
- tenant@example.com / Tenant@123

API proxy:
- Vite dev server proxies `/api` → `http://localhost:4000`.


