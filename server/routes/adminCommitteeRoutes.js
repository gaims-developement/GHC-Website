const express = require('express');
const router = express.Router();
const committeeModel = require('../models/committeeModel');
const asyncHandler = require('../utils/asyncHandler');

// Get all members for CMS (including drafts)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type } = req.query;
    const members = await committeeModel.list({ type, includeDrafts: true });
    res.json({ members });
  })
);

// Create new member
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const member = await committeeModel.create(req.body);
    res.status(201).json({ member });
  })
);

// Update member
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const member = await committeeModel.update(id, req.body);
    res.json({ member });
  })
);

// Delete member
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await committeeModel.remove(id);
    res.json({ success: true });
  })
);

module.exports = router;
