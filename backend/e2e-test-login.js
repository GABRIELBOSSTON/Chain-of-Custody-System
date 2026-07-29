const { PrismaClient } = require('@prisma/client');
const { generateSync } = require('otplib');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'superadmin@police.gov' },
      include: { mfaSecret: true }
    });
    if (!user) throw new Error('user not found');
    const secret = user.mfaSecret.secret;
    const mfaCode = generateSync({ secret });
    
    console.log('1. Logging in with email and password...');
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@police.gov',
        password: 'Password123!'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (loginData.mfaRequired) {
      const tempToken = loginData.tempToken;
      console.log('2. Received tempToken. Length:', tempToken.length);
      console.log('tempToken:', tempToken);
      
      console.log(`3. Sending MFA request with valid code: ${mfaCode}...`);
      const mfaRes = await fetch('http://localhost:3000/api/v1/auth/login/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          mfaCode
        })
      });
      const mfaData = await mfaRes.json();
      console.log('MFA Response:', mfaData);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
