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
      unit: true,
    },
    orderBy: { id: 'desc' },
  });
  res.json({ payments });
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
      include: { tenant: true, unit: true },
    });
    res.json({ payment: updated });
  } catch (e: any) {
    res.status(400).json({ message: 'Could not update payment' });
  }
});

export default router;

