## Database

Provider: MariaDB (via Prisma `provider = "mysql"`).

Primary table for authentication and RBAC:

```schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      String   // 'admin' | 'landlord' | 'tenant'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Seeded users:
- admin@example.com / Admin@123 (role: admin)
- landlord@example.com / Landlord@123 (role: landlord)
- tenant@example.com / Tenant@123 (role: tenant)

Connection string:
```
mysql://root:mctm@localhost:3306/rental_mgmt
```


