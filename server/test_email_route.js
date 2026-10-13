const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const { getJwtSecret } = require('./config/jwt');

// Generate a dummy super admin token
const token = jwt.sign(
  { id: 1, role: 'SUPER_ADMIN' },
  getJwtSecret(),
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
