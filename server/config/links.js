// Public links used in invitation emails. Override on the server with the matching environment variables.
const getDelegateWhatsappGroupUrl = () =>
  process.env.DELEGATE_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/IbiHwOt9HJY6GbldT6DTwa';

const getRegistrationUrl = () =>
  process.env.REGISTRATION_URL || 'https://mc.clirnet.com/mastercast/connect/D0921-Conclave-1';

module.exports = { getDelegateWhatsappGroupUrl, getRegistrationUrl };
