const axios = require('axios');
const jwt = require('jsonwebtoken');

// Generate a dummy super admin token
const token = jwt.sign(
  { id: 1, role: 'SUPER_ADMIN' },
  process.env.JWT_SECRET || 'change-this-secret',
  { expiresIn: '1h' }
);

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/system-admin/email/test', {
      email: 'sushmitmorey1805@gmail.com'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response?.status, err.response?.statusText, err.response?.data);
  }
}

test();
