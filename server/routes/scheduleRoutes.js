const express = require("express");
const {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(getSchedules)
  .post(requireAuth, createSchedule); // Assuming you want only authenticated admins to create

router.route("/:id")
  .get(getSchedule)
  .put(requireAuth, updateSchedule)
  .delete(requireAuth, deleteSchedule);

module.exports = router;
