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
          units: true,
        },
      },
    },
    orderBy: { id: 'desc' },
  });
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
    res.status(400).json({ message: 'Could not create property' });
  }
});

export default router;


