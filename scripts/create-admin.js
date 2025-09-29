const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
  return hash;
}

async function createAdmin() {
  const email = 'ira@irawatkins.com';
  const password = 'Bobby321!';
  const firstName = 'Ira';
  const lastName = 'Watkins';

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Admin user already exists:', email);
      return;
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_USER_CREATED',
        entityType: 'USER',
        entityId: admin.id,
        userId: admin.id,
        metadata: {
          email: admin.email,
          role: admin.role,
          createdBy: 'setup_script'
        }
      }
    });

    console.log('✅ Audit log created');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();