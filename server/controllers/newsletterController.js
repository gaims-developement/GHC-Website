const newsletterModel = require('../models/newsletterModel');

const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    await newsletterModel.subscribe(email);
    
    res.status(200).json({ message: 'Successfully subscribed to the newsletter' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Failed to subscribe to newsletter. Please try again later.' });
  }
};

const listSubscribers = async (_req, res) => {
  try {
    const subscribers = await newsletterModel.listSubscribers();
    res.status(200).json({ subscribers });
  } catch (error) {
    console.error('Error loading newsletter subscribers:', error);
    res.status(500).json({ error: 'Failed to load newsletter subscribers.' });
  }
};

module.exports = {
  subscribe,
  listSubscribers,
};
