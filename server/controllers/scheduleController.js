const Schedule = require('../models/scheduleModel');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all schedule items
// @route   GET /api/schedules
// @access  Public
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.list();
  res.status(200).json({ success: true, count: schedules.length, data: schedules });
});

// @desc    Get single schedule item
// @route   GET /api/schedules/:id
// @access  Public
const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, error: 'Schedule item not found' });
  }
  res.status(200).json({ success: true, data: schedule });
});

// @desc    Create new schedule item
// @route   POST /api/schedules
// @access  Private
const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.create(req.body);
  res.status(201).json({ success: true, data: schedule });
});

// @desc    Update schedule item
// @route   PUT /api/schedules/:id
// @access  Private
const updateSchedule = asyncHandler(async (req, res) => {
  const existing = await Schedule.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Schedule item not found' });
  }

  const schedule = await Schedule.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: schedule });
});

// @desc    Delete schedule item
// @route   DELETE /api/schedules/:id
// @access  Private
const deleteSchedule = asyncHandler(async (req, res) => {
  const deleted = await Schedule.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Schedule item not found' });
  }
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};