// Public links used in invitation emails. Override on the server with the matching environment variables.
const getDelegateWhatsappGroupUrl = () =>
  process.env.DELEGATE_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/F2LpwX1XqJhCHW0OZvmxWF';

const getRegistrationUrl = () =>
  process.env.REGISTRATION_URL || 'https://ghc.gaims.org/register';

module.exports = { getDelegateWhatsappGroupUrl, getRegistrationUrl };
