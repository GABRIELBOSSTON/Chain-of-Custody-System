const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateSecret, generate } = require('otplib');

async function fetchApi(path, options = {}) {
  const url = `http://localhost:3000/api/v1${path}`;
  const { headers, ...rest } = options;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    ...rest
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function run() {
  const prisma = new PrismaClient();
  try {
    console.log('--- 1. Setting up Super Admin ---');
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    let superAdmin = await prisma.user.findUnique({ where: { email: 'superadmin@police.gov' } });
    
    if (!superAdmin) {
      const pw = await bcrypt.hash('admin123', 12);
      superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@police.gov',
          password: pw,
          roleId: superAdminRole.id,
          isActive: true
        }
      });
      const secret = generateSecret({ length: 20 });
      await prisma.mFASecret.create({
        data: { userId: superAdmin.id, secret, isEnabled: true }
      });
      console.log('Superadmin created.');
    }

    const saSecretRow = await prisma.mFASecret.findUnique({ where: { userId: superAdmin.id } });
    
    console.log('--- 2. MFA Login (Super Admin) ---');
    let res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'superadmin@police.gov', password: 'admin123' })
    });
    const tempTokenSa = res.tempToken;

    const saMfaCode = await generate({ secret: saSecretRow.secret });
    res = await fetchApi('/auth/login/mfa', {
      method: 'POST',
      body: JSON.stringify({ tempToken: tempTokenSa, mfaCode: saMfaCode })
    });
    const accessToken = res.accessToken;
    console.log('Superadmin Login SUCCESS.');

    console.log('--- 3. Users Module CRUD (Create Officer) ---');
    const officerRole = await prisma.role.findUnique({ where: { name: 'OFFICER' } });
    const officerEmail = `officer_${Date.now()}@police.gov`;
    const officerBadge = `BDG-${Date.now()}`;
    
    res = await fetchApi('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        email: officerEmail,
        policeId: officerBadge,
        fullName: 'John Officer',
        roleId: officerRole.id,
        isActive: true
      })
    });
    const officerId = res.id;
    console.log('User created:', officerId);

    console.log('--- 4. Account Activation Flow ---');
    res = await fetchApi('/auth/activation/request', {
      method: 'POST',
      body: JSON.stringify({ email: officerEmail, badgeNumber: officerBadge })
    });
    console.log('Activation request SUCCESS.');

    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { userId: officerId },
      orderBy: { createdAt: 'desc' }
    });
    
    res = await fetchApi('/auth/activation/verify', {
      method: 'POST',
      body: JSON.stringify({ email: officerEmail, otpCode: otpRecord.otpCode })
    });
    const tempTokenSetup = res.tempToken;
    console.log('OTP verify SUCCESS.');

    res = await fetchApi('/auth/activation/setup', {
      method: 'POST',
      body: JSON.stringify({ tempToken: tempTokenSetup, password: 'new_secure_password123' })
    });
    console.log('Account setup SUCCESS. QR URI:', res.qrCodeUrl.slice(0, 30) + '...');

    console.log('--- 5. MFA Login (Newly Activated Officer) ---');
    res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: officerEmail, password: 'new_secure_password123' })
    });
    const officerTempToken = res.tempToken;

    const officerSecretRow = await prisma.mFASecret.findUnique({ where: { userId: officerId } });
    const officerMfaCode = await generate({ secret: officerSecretRow.secret });
    
    res = await fetchApi('/auth/login/mfa', {
      method: 'POST',
      body: JSON.stringify({ tempToken: officerTempToken, mfaCode: officerMfaCode })
    });
    console.log('Officer Login SUCCESS.');

    console.log('\n✅ ALL E2E TESTS PASSED!');
  } catch(e) {
    console.error('❌ E2E TEST FAILED:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
