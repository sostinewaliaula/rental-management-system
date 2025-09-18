import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

router.get('/', requireAuth, async (_req, res) => {
  const tenants = await prisma.tenant.findMany({
    include: { unit: { include: { floor: { include: { property: true } } } } },
    orderBy: { id: 'desc' },
  });
  res.json({ tenants });
});

// GET /api/tenants/me - current logged-in tenant profile
router.get('/me', requireAuth, async (req, res) => {
  const user = (req as any).user as { id: number };
  const tenant = await prisma.tenant.findFirst({
    where: { userId: user.id },
    include: { unit: { include: { floor: { include: { property: true } } } }, user: { select: { id: true, name: true, email: true } } },
  });
  if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
  res.json({ tenant });
});

router.get('/vacant-units', requireAuth, async (_req, res) => {
  const units = await prisma.unit.findMany({
    where: { status: 'vacant' },
    include: { floor: { include: { property: true } } },
    orderBy: { id: 'asc' },
  });
  res.json({ units });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, email, phone, moveInDate, leaseEnd, unitId, password } = req.body as {
    name?: string; email?: string; phone?: string; moveInDate?: string; leaseEnd?: string; unitId?: number; password?: string;
  };
  if (!name || !email || !phone || !moveInDate || !leaseEnd || !unitId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    if (unit.status !== 'vacant') return res.status(400).json({ message: 'Unit is not vacant' });

    const plainPassword = password || `Tenant@${Math.floor(100000 + Math.random() * 900000)}`;
    const hashed = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({ data: { name, email, password: hashed, role: 'tenant' } });
    const tenant = await prisma.tenant.create({
      data: {
        name,
        email,
        phone,
        moveInDate: new Date(moveInDate),
        leaseEnd: new Date(leaseEnd),
        status: 'active',
        unit: { connect: { id: unitId } },
        user: { connect: { id: user.id } },
      },
      include: { unit: { include: { floor: { include: { property: true } } } }, user: true },
    });
    await prisma.unit.update({ where: { id: unitId }, data: { status: 'occupied' } });
    res.status(201).json({ tenant, credentials: { email, password: plainPassword } });
  } catch (e: any) {
    res.status(400).json({ message: e?.meta?.cause || 'Could not create tenant' });
  }
});

// PATCH /api/tenants/:id - update tenant details
router.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, email, moveInDate, leaseEnd, status } = req.body;
  if (!id) return res.status(400).json({ message: 'Invalid tenant id' });
  try {
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        leaseEnd: leaseEnd ? new Date(leaseEnd) : undefined,
        status,
      },
      include: { unit: { include: { floor: { include: { property: true } } } } },
    });
    res.json({ tenant: updated });
  } catch (e: any) {
    res.status(400).json({ message: 'Could not update tenant' });
  }
});

export default router;



