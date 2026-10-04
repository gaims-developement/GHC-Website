const express = require('express');
const router = express.Router();
const committeeModel = require('../models/committeeModel');
const asyncHandler = require('../utils/asyncHandler');

// Get all committee definitions/names
router.get(
  '/definitions',
  asyncHandler(async (req, res) => {
    const committees = await committeeModel.listCommittees();
    res.json({ committees });
  })
);

// Create new committee definition
router.post(
  '/definitions',
  asyncHandler(async (req, res) => {
    const committee = await committeeModel.createCommittee(req.body);
    res.status(201).json({ committee });
  })
);

// Reorder committee definitions
router.put(
  '/definitions/reorder',
  asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id && item.displayOrder !== undefined) {
          await committeeModel.updateCommittee(item.id, { displayOrder: item.displayOrder });
        }
      }
    }
    const committees = await committeeModel.listCommittees();
    res.json({ committees });
  })
);

// Update committee definition
router.put(
  '/definitions/:defId',
  asyncHandler(async (req, res) => {
    const { defId } = req.params;
    const committee = await committeeModel.updateCommittee(defId, req.body);
    res.json({ committee });
  })
);

// Delete committee definition
router.delete(
  '/definitions/:defId',
  asyncHandler(async (req, res) => {
    const { defId } = req.params;
    await committeeModel.removeCommittee(defId);
    res.json({ success: true });
  })
);

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

// Reorder committee members
router.put(
  '/reorder',
  asyncHandler(async (req, res) => {
    const { items } = req.body;
    await committeeModel.reorder(items);
    res.json({ success: true });
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
