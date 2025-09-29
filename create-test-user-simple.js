#!/usr/bin/env node

// Simple script to create a test user for authentication testing
const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user for authentication testing...');

    // Hash the password using argon2
    console.log('Hashing password...');
    const passwordHash = await argon2.hash('Bobby321!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: 'test-user-' + Date.now(),
        email: 'ira@irawatkins.com',
        emailVerified: new Date(), // Pre-verified for testing
        passwordHash,
        firstName: 'Ira',
        lastName: 'Watkins',
        displayName: 'Ira Watkins',
        role: 'ADMIN', // Give admin access for testing
        status: 'ACTIVE',
        isVerified: true,
        timezone: 'America/New_York',
        language: 'en',
        marketingOptIn: false
      }
    });

    console.log('✅ Test user created successfully!');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log('Password: Bobby321!');
    console.log('\n🎯 You can now test authentication on the platform');

  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    if (error.code === 'P2002') {
      console.log('💡 User already exists. Updating password instead...');

      try {
        const passwordHash = await argon2.hash('Bobby321!', {
          type: argon2.argon2id,
          memoryCost: 2 ** 16,
          timeCost: 3,
          parallelism: 1,
        });

        await prisma.user.update({
          where: { email: 'ira@irawatkins.com' },
          data: {
            passwordHash,
            emailVerified: new Date(),
            isVerified: true,
            status: 'ACTIVE'
          }
        });
        console.log('✅ User password updated successfully!');
      } catch (updateError) {
        console.error('❌ Failed to update user:', updateError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();