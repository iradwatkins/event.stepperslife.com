#!/usr/bin/env node

// Test database connection using the same configuration as the app
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test user query
    const user = await prisma.user.findUnique({
      where: { email: 'ira@irawatkins.com' },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (user) {
      console.log('✅ User query successful:', user);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();