## Troubleshooting

ESM error when starting server:
```
Must use import to load ES Module: server/index.ts
```
Fix: Ensure `type` is `module` in `package.json` (already set) and run with ts-node-dev which supports ESM. If error persists, try:
```powershell
npx ts-node --esm --transpile-only server/index.ts
```
or switch to ts-node-dev CommonJS loader:
```powershell
setx TS_NODE_COMPILER_OPTIONS "{\"module\":\"commonjs\"}"
```

Frontend port 5173 in use:
- Vite auto-picks another port (check console). Open the shown URL.

Cannot connect to DB:
- Verify MariaDB is running and credentials in `DATABASE_URL` are correct.
- Test with: `mysql -u root -p` then `use rental_mgmt;`.

Login fails for seeded users:
- Re-run seed: `npx ts-node --transpile-only prisma/seed.ts`
- Check backend logs on http://localhost:4000/health


