const axios = require('axios');

async function test() {
  try {
    const res = await axios.options('http://localhost:3000/api/system-admin/email/test', {
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log("Success:", res.status, res.headers);
  } catch (err) {
    console.log("Error:", err.response?.status, err.response?.statusText);
  }
}

test();
