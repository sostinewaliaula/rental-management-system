import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

type NotificationPrefs = { email: boolean; sms: boolean; push: boolean };
const defaultNotificationPrefs: NotificationPrefs = { email: true, sms: false, push: true };

function signToken(payload: object): string {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function authenticate(req: any, res: any): { id: number; role: string } | null {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ message: 'Missing token' });
    return null;
  }
  const token = auth.replace('Bearer ', '');
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    return jwt.verify(token, secret) as { id: number; role: string };
  } catch {
    res.status(401).json({ message: 'Invalid token' });
    return null;
  }
}

function mapSettingsResponse(user: any) {
  const notifications = (user.notificationPreferences as NotificationPrefs | null) ?? defaultNotificationPrefs;
  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      avatar: user.avatar ?? '',
    },
    notifications,
    organization: {
      name: user.organizationName ?? '',
      address: user.organizationAddress ?? '',
      logo: user.organizationLogo ?? '',
    },
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken({ id: user.id, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', async (req, res) => {
  const payload = authenticate(req, res);
  if (!payload) return;
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// POST /api/auth/change-password - logged-in user changes own password
router.post('/change-password', async (req, res) => {
  const payload = authenticate(req, res);
  if (!payload) return;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both currentPassword and newPassword are required' });
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  res.json({ ok: true });
});

router.get('/settings', async (req, res) => {
  const payload = authenticate(req, res);
  if (!payload) return;
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      notificationPreferences: true,
      organizationAddress: true,
      organizationLogo: true,
      organizationName: true,
      twoFactorEnabled: true,
    },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(mapSettingsResponse(user));
});

router.put('/settings', async (req, res) => {
  const payload = authenticate(req, res);
  if (!payload) return;
  const {
    name,
    email,
    phone,
    avatar,
    twoFactorEnabled,
    notifications,
    organization,
  } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    twoFactorEnabled?: boolean;
    notifications?: NotificationPrefs;
    organization?: { name?: string; address?: string; logo?: string };
  };

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (avatar !== undefined) data.avatar = avatar;
  if (twoFactorEnabled !== undefined) data.twoFactorEnabled = twoFactorEnabled;
  if (notifications !== undefined) data.notificationPreferences = notifications;
  if (organization) {
    if (organization.name !== undefined) data.organizationName = organization.name;
    if (organization.address !== undefined) data.organizationAddress = organization.address;
    if (organization.logo !== undefined) data.organizationLogo = organization.logo;
  }

  if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No settings provided' });

  try {
    const updated = await prisma.user.update({
      where: { id: payload.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        notificationPreferences: true,
        organizationAddress: true,
        organizationLogo: true,
        organizationName: true,
        twoFactorEnabled: true,
      },
    });
    res.json(mapSettingsResponse(updated));
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ message: 'Email already taken' });
    }
    res.status(400).json({ message: 'Unable to update settings' });
  }
});

export default router;


