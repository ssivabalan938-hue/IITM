import { PrismaClient } from '@prisma/client';
// Simple hash stub for seeding (not for production)
const hash = async (pw: string) => pw;
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin and engineers...');

  // Admin account
  await prisma.governmentUser.upsert({
    where: { employeeId: 'ADM001' },
    update: {},
    create: {
      employeeId: 'ADM001',
      name: 'Admin User',
      department: 'Highways & Infrastructure',
      officialEmail: 'admin@roadwatch.ai',
      designation: 'System Admin',
      password: await hash('admin123'),
      govRole: 'ADMIN',
      approvalStatus: 'APPROVED',
    },
  });

  // Engineer accounts (up to two)
  const engineers = [
    { employeeId: 'ENG001', name: 'Engineer One', email: 'eng1@roadwatch.ai' },
    { employeeId: 'ENG002', name: 'Engineer Two', email: 'eng2@roadwatch.ai' },
  ];

  for (const e of engineers) {
    await prisma.governmentUser.upsert({
      where: { employeeId: e.employeeId },
      update: {},
      create: {
        employeeId: e.employeeId,
        name: e.name,
        department: 'Engineering',
        officialEmail: e.email,
        designation: 'Field Engineer',
        password: await hash('engineer123'),
        govRole: 'ENGINEER',
        approvalStatus: 'APPROVED',
      },
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
