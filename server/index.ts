import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import propertiesRouter from './routes/properties';
import tenantsRouter from './routes/tenants';
import paymentsRouter from './routes/payments';
import maintenanceRouter from './routes/maintenance';

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'db' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/maintenance', maintenanceRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});


