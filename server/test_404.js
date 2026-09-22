const axios = require('axios');

async function test() {
  try {
    await axios.post('http://localhost:3000/api/this-does-not-exist');
    console.log("Success");
  } catch (err) {
    console.log("Error:", err.response?.status, err.response?.statusText);
  }
}

test();
