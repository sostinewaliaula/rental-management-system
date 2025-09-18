import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Admin', email: 'admin@example.com', role: 'admin', password: 'Admin@123' },
    { name: 'John Landlord', email: 'landlord@example.com', role: 'landlord', password: 'Landlord@123' },
    { name: 'Tina Tenant', email: 'tenant@example.com', role: 'tenant', password: 'Tenant@123' },
  ];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: { name: u.name, email: u.email, role: u.role, password: hashed },
    });
  }
  // Create Kenyan sample properties
  const westlands = await prisma.property.upsert({
    where: { id: 1 },
    update: { name: 'Westlands Apartment', location: 'Westlands, Nairobi', type: 'Apartment', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=60' },
    create: { name: 'Westlands Apartment', location: 'Westlands, Nairobi', type: 'Apartment', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=60' },
  });
  const kilimani = await prisma.property.upsert({
    where: { id: 2 },
    update: { name: 'Kilimani Townhouse', location: 'Kilimani, Nairobi', type: 'Townhouse', image: 'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=60' },
    create: { name: 'Kilimani Townhouse', location: 'Kilimani, Nairobi', type: 'Townhouse', image: 'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=60' },
  });

  // Floors and units for Westlands
  const westlandsGround = await prisma.floor.upsert({
    where: { id: 1 },
    update: { name: 'Ground Floor', propertyId: westlands.id },
    create: { name: 'Ground Floor', propertyId: westlands.id },
  });
  const westlandsFirst = await prisma.floor.upsert({
    where: { id: 2 },
    update: { name: 'First Floor', propertyId: westlands.id },
    create: { name: 'First Floor', propertyId: westlands.id },
  });
  // Units
  await prisma.unit.upsert({
    where: { id: 1 },
    update: { number: 'G1', type: 'one bedroom', status: 'occupied', floorId: westlandsGround.id, rent: 45000 },
    create: { number: 'G1', type: 'one bedroom', status: 'occupied', floorId: westlandsGround.id, rent: 45000 },
  });
  await prisma.unit.upsert({
    where: { id: 2 },
    update: { number: 'G2', type: 'studio', status: 'vacant', floorId: westlandsGround.id, rent: 25000 },
    create: { number: 'G2', type: 'studio', status: 'vacant', floorId: westlandsGround.id, rent: 25000 },
  });
  await prisma.unit.upsert({
    where: { id: 3 },
    update: { number: '1A', type: 'two bedroom', status: 'maintenance', floorId: westlandsFirst.id, rent: 60000 },
    create: { number: '1A', type: 'two bedroom', status: 'maintenance', floorId: westlandsFirst.id, rent: 60000 },
  });
  await prisma.unit.upsert({
    where: { id: 4 },
    update: { number: '1B', type: 'bedsitter', status: 'vacant', floorId: westlandsFirst.id, rent: 18000 },
    create: { number: '1B', type: 'bedsitter', status: 'vacant', floorId: westlandsFirst.id, rent: 18000 },
  });

  // Kilimani floors/units
  const kilimaniGround = await prisma.floor.upsert({
    where: { id: 3 },
    update: { name: 'Ground Floor', propertyId: kilimani.id },
    create: { name: 'Ground Floor', propertyId: kilimani.id },
  });
  await prisma.unit.upsert({
    where: { id: 5 },
    update: { number: 'G1', type: 'three bedroom', status: 'vacant', floorId: kilimaniGround.id, rent: 95000 },
    create: { number: 'G1', type: 'three bedroom', status: 'vacant', floorId: kilimaniGround.id, rent: 95000 },
  });

  // Link tenant user to a tenant entity in a unit
  const tenantUser = await prisma.user.findUnique({ where: { email: 'tenant@example.com' } });
  if (tenantUser) {
    await prisma.tenant.upsert({
      where: { id: 1 },
      update: { name: 'Tina Tenant', email: tenantUser.email, phone: '+254700000000', moveInDate: new Date('2024-01-01'), leaseEnd: new Date('2025-12-31'), status: 'active', unitId: 1, userId: tenantUser.id },
      create: { name: 'Tina Tenant', email: tenantUser.email, phone: '+254700000000', moveInDate: new Date('2024-01-01'), leaseEnd: new Date('2025-12-31'), status: 'active', unitId: 1, userId: tenantUser.id },
    });
  }

  // Seed ~10 maintenance requests across units
  const sampleRequests = [
    { title: 'Leaking tap in kitchen', description: 'Water dripping continuously under sink.', priority: 'medium', status: 'pending', unitId: 1, tenantId: 1 },
    { title: 'Bathroom tiles loose', description: 'Tiles coming off near shower area.', priority: 'low', status: 'pending', unitId: 1, tenantId: 1 },
    { title: 'AC not cooling', description: 'AC blows warm air after 10 minutes.', priority: 'high', status: 'in_progress', unitId: 3 },
    { title: 'Broken window', description: 'Cracked bedroom window needs replacement.', priority: 'medium', status: 'completed', unitId: 3 },
    { title: 'Power socket faulty', description: 'Living room socket sparks when plugging.', priority: 'high', status: 'pending', unitId: 4 },
    { title: 'Paint peeling', description: 'Ceiling paint peeling in corridor.', priority: 'low', status: 'pending', unitId: 2 },
    { title: 'Elevator noise', description: 'Odd grinding sound when stopping.', priority: 'medium', status: 'in_progress', unitId: 1 },
    { title: 'Gate remote not working', description: 'Remote fails intermittently.', priority: 'low', status: 'completed', unitId: 5 },
    { title: 'Water heater issue', description: 'Heats for a minute then cold.', priority: 'high', status: 'pending', unitId: 1, tenantId: 1 },
    { title: 'Clogged drain', description: 'Bathroom drain clogs frequently.', priority: 'medium', status: 'pending', unitId: 1, tenantId: 1 },
  ] as const;

  for (const r of sampleRequests) {
    await prisma.maintenanceRequest.create({
      data: {
        title: r.title,
        description: r.description,
        priority: r.priority,
        status: r.status,
        dateReported: new Date(),
        unit: { connect: { id: r.unitId } },
        tenant: r.tenantId ? { connect: { id: r.tenantId } } : undefined,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seeded users, properties, units, tenant, and maintenance requests');
}

main().finally(async () => prisma.$disconnect());


