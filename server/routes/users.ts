import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing token' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me') as { role: string };
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

router.get('/', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
  res.json({ users });
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role: string };
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { name, email, password: hashed, role } });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    res.status(400).json({ message: e?.meta?.cause || 'Could not create user' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: string };
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.update({ where: { id }, data });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    res.status(400).json({ message: 'Could not update user' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(400).json({ message: 'Could not delete user' });
  }
});

export default router;


