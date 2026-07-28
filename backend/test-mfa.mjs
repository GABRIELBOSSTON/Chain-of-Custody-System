import fetch from 'node-fetch';

async function test() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@fccms.test', password: 'Password123!' })
    });

    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData);
  } catch (err) {
    console.error(err);
  }
}

test();
