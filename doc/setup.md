## Setup

Prerequisites:
- Node 18+
- MariaDB 10.6+ running locally

Environment variables (PowerShell):
```powershell
$env:DATABASE_URL="mysql://root:mctm@localhost:3306/rental_mgmt"
$env:JWT_SECRET="change_this_in_production_please"
```

Optional: create a `.env.local` (or `.env`) file in project root:
```
DATABASE_URL=mysql://root:mctm@localhost:3306/rental_mgmt
JWT_SECRET=change_this_in_production_please
PORT=4000
```

Install deps, generate Prisma, migrate, and seed:
```powershell
npm install
$env:DATABASE_URL="mysql://root:mctm@localhost:3306/rental_mgmt"; npm run prisma:generate
$env:DATABASE_URL="mysql://root:mctm@localhost:3306/rental_mgmt"; npm run prisma:migrate
$env:DATABASE_URL="mysql://root:mctm@localhost:3306/rental_mgmt"; npx ts-node --transpile-only prisma/seed.ts
```

Run servers:
```powershell
npm run server
npm run dev
```

Dev URLs:
- Frontend: http://localhost:5173 (or 5174 if 5173 is in use)
- Backend: http://localhost:4000

Seeded login accounts:
- admin@example.com / Admin@123 → Admin dashboard
- landlord@example.com / Landlord@123 → Landlord dashboard
- tenant@example.com / Tenant@123 → Tenant dashboard


