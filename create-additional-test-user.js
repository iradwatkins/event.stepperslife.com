#!/usr/bin/env node

// Create additional test users for the platform
const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔧 Creating additional test users...');

    // Create a simple test user
    const testUserPassword = await argon2.hash('Test123!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create attendee user
    const attendeeUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        passwordHash: testUserPassword,
        emailVerified: new Date(),
        isVerified: true,
        status: 'ACTIVE'
      },
      create: {
        id: 'test-attendee-' + Date.now(),
        email: 'test@example.com',
        emailVerified: new Date(),
        passwordHash: testUserPassword,
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        role: 'ATTENDEE',
        status: 'ACTIVE',
        isVerified: true,
        timezone: 'America/New_York',
        language: 'en',
        marketingOptIn: false
      }
    });

    // Update admin user password (ira@irawatkins.com)
    const adminPassword = await argon2.hash('Admin123!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.user.update({
      where: { email: 'ira@irawatkins.com' },
      data: {
        passwordHash: adminPassword,
        emailVerified: new Date(),
        isVerified: true,
        status: 'ACTIVE'
      }
    });

    console.log('\n✅ Test users created/updated successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('====================');
    console.log('\n🔑 Admin User:');
    console.log('   Email: ira@irawatkins.com');
    console.log('   Password: Admin123!');
    console.log('   Role: ADMIN');
    console.log('\n🔑 Test User:');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!');
    console.log('   Role: ATTENDEE');
    console.log('\n🌐 Login URL: https://events.stepperslife.com/auth/login');
    console.log('\n💡 Note: These credentials are for testing purposes only.');
    console.log('   Please change them in production!');

  } catch (error) {
    console.error('❌ Failed to create test users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();