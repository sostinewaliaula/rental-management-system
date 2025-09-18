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

// GET /api/maintenance/my - tenant's own maintenance requests
router.get('/my', requireAuth, async (req, res) => {
  const { id, role } = (req as any).user as { id: number; role: string };
  try {
    const tenant = await prisma.tenant.findFirst({ where: { userId: id } });
    if (!tenant) return res.json({ requests: [] });
    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: tenant.id },
      include: { unit: { include: { floor: { include: { property: true } } } } },
      orderBy: { id: 'desc' },
    });
    res.json({ requests });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// POST /api/maintenance - create a maintenance request
// - Tenants: unit inferred from their tenancy
// - Landlord/Admin: must provide unitId
router.post('/', requireAuth, async (req, res) => {
  const { id, role } = (req as any).user as { id: number; role: string };
  const { title, description, priority, unitId } = req.body as { title?: string; description?: string; priority?: 'high' | 'medium' | 'low'; unitId?: number };
  if (!title || !description || !priority) return res.status(400).json({ message: 'Missing required fields' });
  try {
    let finalUnitId: number | null = null;
    let tenantId: number | null = null;
    if (role === 'tenant') {
      const tenant = await prisma.tenant.findFirst({ where: { userId: id } });
      if (!tenant || !tenant.unitId) return res.status(400).json({ message: 'Tenant unit not found' });
      finalUnitId = tenant.unitId;
      tenantId = tenant.id;
    } else {
      if (!unitId) return res.status(400).json({ message: 'unitId is required' });
      const unit = await prisma.unit.findUnique({ where: { id: Number(unitId) } });
      if (!unit) return res.status(404).json({ message: 'Unit not found' });
      finalUnitId = unit.id;
    }
    const created = await prisma.maintenanceRequest.create({
      data: {
        title,
        description,
        priority,
        status: 'pending',
        dateReported: new Date(),
        unit: { connect: { id: finalUnitId! } },
        tenant: tenantId ? { connect: { id: tenantId } } : undefined,
      },
      include: { unit: { include: { floor: { include: { property: true } } } }, tenant: true },
    });
    res.status(201).json({ request: created });
  } catch (e: any) {
    res.status(400).json({ message: 'Could not create request' });
  }
});

// GET /api/maintenance - list all requests (landlord/admin)
router.get('/', requireAuth, async (req, res) => {
  const { role } = (req as any).user as { role: string };
  if (role !== 'landlord' && role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: { unit: { include: { floor: { include: { property: true } } } }, tenant: true },
      orderBy: { id: 'desc' },
    });
    res.json({ requests });
  } catch {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// GET /api/maintenance/units - list units for selection (landlord/admin)
router.get('/units', requireAuth, async (req, res) => {
  const { role } = (req as any).user as { role: string };
  if (role !== 'landlord' && role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const units = await prisma.unit.findMany({ include: { floor: { include: { property: true } } } });
    res.json({ units });
  } catch {
    res.status(500).json({ message: 'Failed to fetch units' });
  }
});

export default router;
// PATCH /api/maintenance/:id - tenant can edit their own pending request
router.patch('/:id', requireAuth, async (req, res) => {
  const user = (req as any).user as { id: number; role: string };
  const id = Number(req.params.id);
  const { description, status, priority } = req.body as { description?: string; status?: string; priority?: 'high' | 'medium' | 'low' };
  if (!id) return res.status(400).json({ message: 'Invalid request id' });
  try {
    if (user.role === 'tenant') {
      const tenant = await prisma.tenant.findFirst({ where: { userId: user.id } });
      if (!tenant) return res.status(403).json({ message: 'Not allowed' });
      const reqItem = await prisma.maintenanceRequest.findUnique({ where: { id } });
      if (!reqItem || reqItem.tenantId !== tenant.id) return res.status(404).json({ message: 'Request not found' });
      if (reqItem.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be edited' });
      if (!description) return res.status(400).json({ message: 'Description is required' });
      const updated = await prisma.maintenanceRequest.update({ where: { id }, data: { description } });
      return res.json({ request: updated });
    }
    // landlord/admin manage status/priority
    const updated = await prisma.maintenanceRequest.update({ where: { id }, data: { status, priority } });
    return res.json({ request: updated });
  } catch {
    res.status(400).json({ message: 'Could not update request' });
  }
});

// DELETE /api/maintenance/:id - landlord/admin
router.delete('/:id', requireAuth, async (req, res) => {
  const { role } = (req as any).user as { role: string };
  if (role !== 'landlord' && role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  try {
    await prisma.maintenanceRequest.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(400).json({ message: 'Could not delete request' });
  }
});


