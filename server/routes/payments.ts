import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing token' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me') as { id: number; role: string };
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// GET /api/payments
router.get('/', requireAuth, async (_req, res) => {
  const payments = await prisma.payment.findMany({
    include: {
      tenant: true,
      unit: { include: { floor: { include: { property: true } } } },
    },
    orderBy: { id: 'desc' },
  });
  res.json({ payments });
});

// GET /api/payments/my - payments for logged-in tenant
router.get('/my', requireAuth, async (req, res) => {
  const authUser = (req as any).user as { id: number };
  const tenant = await prisma.tenant.findFirst({ where: { userId: authUser.id } });
  if (!tenant) return res.json({ payments: [] });
  const payments = await prisma.payment.findMany({
    where: { tenantId: tenant.id },
    include: { tenant: true, unit: { include: { floor: { include: { property: true } } } } },
    orderBy: { id: 'desc' },
  });
  res.json({ payments });
});

// POST /api/payments - tenant makes payment for a given month/year (creates or completes)
router.post('/', requireAuth, async (req, res) => {
  const authUser = (req as any).user as { id: number; role: string };
  const { month, year, method } = req.body as { month?: number; year?: number; method?: string };
  if (authUser.role !== 'tenant') return res.status(403).json({ message: 'Forbidden' });
  if (!month || !year) return res.status(400).json({ message: 'month and year required' });
  const tenant = await prisma.tenant.findFirst({ where: { userId: authUser.id } });
  if (!tenant || !tenant.unitId) return res.status(400).json({ message: 'Tenant or unit not found' });
  const unit = await prisma.unit.findUnique({ where: { id: tenant.unitId } });
  if (!unit) return res.status(404).json({ message: 'Unit not found' });
  const dueDate = new Date(year, month - 1, 5);
  const existing = await prisma.payment.findFirst({ where: { tenantId: tenant.id, unitId: unit.id, month, year } });
  if (existing) {
    const updated = await prisma.payment.update({
      where: { id: existing.id },
      data: { status: 'completed', method: method || 'M-Pesa', reference: `MPE${Math.floor(100000000 + Math.random() * 900000000)}`, date: new Date() },
      include: { tenant: true, unit: { include: { floor: { include: { property: true } } } } },
    });
    return res.json({ payment: updated });
  }
  const created = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      unitId: unit.id,
      month,
      year,
      amount: unit.rent,
      status: 'completed',
      date: new Date(),
      dueDate,
      method: method || 'M-Pesa',
      reference: `MPE${Math.floor(100000000 + Math.random() * 900000000)}`,
    },
    include: { tenant: true, unit: { include: { floor: { include: { property: true } } } } },
  });
  return res.status(201).json({ payment: created });
});

// PATCH /api/payments/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status, method, reference, date } = req.body;
  if (!id) return res.status(400).json({ message: 'Invalid payment id' });
  try {
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status,
        method,
        reference,
        date: date ? new Date(date) : undefined,
      },
      include: { tenant: true, unit: { include: { floor: { include: { property: true } } } } },
    });
    res.json({ payment: updated });
  } catch (e: any) {
    res.status(400).json({ message: 'Could not update payment' });
  }
});

export default router;

