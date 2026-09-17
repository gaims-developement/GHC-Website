const express = require('express');
const router = express.Router();
const committeeModel = require('../models/committeeModel');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const members = await committeeModel.list({ includeDrafts: false });
    res.json({ members });
  })
);

router.get(
  '/:type',
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const members = await committeeModel.list({ type, includeDrafts: false });
    res.json({ members });
  })
);

module.exports = router;
