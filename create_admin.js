const url = 'https://tcqwaoobymicskftstmu.supabase.co';
const key = 'sb_publishable_ycKKA4OU0nBoD6BaWOx2eg_s0i9_6FN';

async function signUp() {
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      email: 'admin@metrocity.gov',
      password: 'password123'
    })
  });
  
  const data = await res.json();
  console.log("Signup Response:", data);
}

signUp();
