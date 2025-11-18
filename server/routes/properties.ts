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

router.get('/', requireAuth, async (_req, res) => {
  const properties = await prisma.property.findMany({
    include: {
      floors: {
        include: {
          units: {
            include: {
              tenants: {
                where: { status: 'active' },
                orderBy: { moveInDate: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { id: 'desc' },
  });
  // Attach the current tenant (if any) as 'tenant' field for each unit
  for (const property of properties) {
    for (const floor of property.floors) {
      for (const unit of floor.units) {
        unit.tenant = unit.tenants && unit.tenants.length > 0 ? unit.tenants[0] : null;
        delete unit.tenants;
      }
    }
  }
  res.json({ properties });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, location, type, image, floors } = req.body as {
    name?: string; location?: string; type?: string; image?: string; floors?: Array<{ name: string; units: Array<{ number: string; type: string; status?: string; rent?: number }> }>;
  };
  if (!name || !location || !type || !floors || floors.length === 0) {
    return res.status(400).json({ message: 'Missing required fields: name, location, type, floors' });
  }
  try {
    const created = await prisma.property.create({
      data: {
        name,
        location,
        type,
        image,
        floors: {
          create: floors.map(f => ({
            name: f.name,
            units: {
              create: (f.units || []).map(u => ({ number: u.number, type: u.type, status: u.status || 'vacant', rent: u.rent ?? 0 })),
            },
          })),
        },
      },
      include: { floors: { include: { units: true } } },
    });
    res.status(201).json({ property: created });
  } catch (e: any) {
    console.error('Failed to create property', e);
    res.status(400).json({ message: e?.message || 'Could not create property' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, location, type, image, floors } = req.body as {
    name?: string; location?: string; type?: string; image?: string; floors?: Array<{ name: string; units: Array<{ number: string; type: string; status?: string; rent?: number }> }>;
  };
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  if (!name || !location || !type || !floors || floors.length === 0) {
    return res.status(400).json({ message: 'Missing required fields: name, location, type, floors' });
  }
  try {
    // Replace floors/units for simplicity
    const existingFloors = await prisma.floor.findMany({ where: { propertyId: id }, select: { id: true } });
    const existingFloorIds = existingFloors.map(f => f.id);
    if (existingFloorIds.length > 0) {
      const existingUnits = await prisma.unit.findMany({ where: { floorId: { in: existingFloorIds } }, select: { id: true } });
      const existingUnitIds = existingUnits.map(u => u.id);
      if (existingUnitIds.length > 0) {
        await prisma.payment.deleteMany({ where: { unitId: { in: existingUnitIds } } });
        await prisma.maintenanceRequest.deleteMany({ where: { unitId: { in: existingUnitIds } } });
        await prisma.tenant.updateMany({ where: { unitId: { in: existingUnitIds } }, data: { unitId: null } });
      }
      await prisma.unit.deleteMany({ where: { floorId: { in: existingFloorIds } } });
      await prisma.floor.deleteMany({ where: { id: { in: existingFloorIds } } });
    }
    const updated = await prisma.property.update({
      where: { id },
      data: {
        name,
        location,
        type,
        image,
        floors: {
          create: floors.map(f => ({
            name: f.name,
            units: {
              create: (f.units || []).map(u => ({ number: u.number, type: u.type, status: u.status || 'vacant', rent: u.rent ?? 0 })),
            },
          })),
        },
      },
      include: { floors: { include: { units: true } } },
    });
    res.json({ property: updated });
  } catch (e: any) {
    console.error(`Failed to update property ${id}`, e);
    res.status(400).json({ message: e?.message || 'Could not update property' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  try {
    // Delete children first due to FK constraints
    const floors = await prisma.floor.findMany({ where: { propertyId: id }, select: { id: true } });
    const floorIds = floors.map(f => f.id);
    if (floorIds.length > 0) {
      const units = await prisma.unit.findMany({ where: { floorId: { in: floorIds } }, select: { id: true } });
      const unitIds = units.map(u => u.id);
      if (unitIds.length > 0) {
        await prisma.payment.deleteMany({ where: { unitId: { in: unitIds } } });
        await prisma.maintenanceRequest.deleteMany({ where: { unitId: { in: unitIds } } });
        await prisma.tenant.updateMany({ where: { unitId: { in: unitIds } }, data: { unitId: null } });
      }
      await prisma.unit.deleteMany({ where: { floorId: { in: floorIds } } });
      await prisma.floor.deleteMany({ where: { id: { in: floorIds } } });
    }
    await prisma.property.delete({ where: { id } });
    res.status(204).end();
  } catch (e: any) {
    console.error(`Failed to delete property ${id}`, e);
    res.status(400).json({ message: e?.message || 'Could not delete property' });
  }
});

export default router;


