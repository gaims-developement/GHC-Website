require('dotenv').config();
const { sendTemplateEmail } = require('./services/mailService');

async function test() {
  try {
    const result = await sendTemplateEmail('test_email', 'sushmitmorey1805@gmail.com');
    console.log("Success:", result);
  } catch (err) {
    console.error("Error in sendTemplateEmail:", err);
  } finally {
    process.exit(0);
  }
}

test();
