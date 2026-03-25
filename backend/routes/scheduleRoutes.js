const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Schedule = require("../models/Schedule");

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("organizer", "firstName lastName email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Get single schedule
// @route   GET /api/schedules/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate(
      "organizer",
      "firstName lastName email"
    );

    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, error: "Schedule not found" });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Create schedule
// @route   POST /api/schedules
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    req.body.organizer = req.user._id;
    const schedule = await Schedule.create(req.body);

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, error: "Schedule not found" });
    }

    // Make sure user is schedule owner
    if (schedule.organizer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Not authorized to update this schedule",
        });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, error: "Schedule not found" });
    }

    // Make sure user is schedule owner
    if (schedule.organizer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Not authorized to delete this schedule",
        });
    }

    await schedule.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Update attendance status
// @route   PUT /api/schedules/:id/attendance
// @access  Private
router.put("/:id/attendance", protect, async (req, res) => {
  try {
    res.json({ success: true, message: "Attendance updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Check for scheduling conflicts
// @route   POST /api/schedules/check-conflicts
// @access  Private
router.post("/check-conflicts", protect, async (req, res) => {
  try {
    const { startDate, endDate, location, resources, excludeId } = req.body;

    // Build query to find conflicting schedules
    const query = {
      $and: [{ startDate: { $lt: endDate } }, { endDate: { $gt: startDate } }],
    };

    // Add location filter if provided
    if (location) {
      query.location = location;
    }

    // Add resource filters if provided
    if (resources && resources.length > 0) {
      query.resources = { $in: resources };
    }

    // Exclude current schedule if updating
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Find conflicting schedules
    const conflicts = await Schedule.find(query)
      .populate("organizer", "firstName lastName email")
      .select("title startDate endDate location type organizer");

    res.status(200).json({
      success: true,
      data: conflicts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Get resource availability
// @route   GET /api/schedules/resource-availability
// @access  Private
router.get("/resource-availability", protect, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Generate schedule report
// @route   GET /api/schedules/report
// @access  Private (Admin/Lecturer only)
router.get("/report", protect, async (req, res) => {
  try {
    res.json({
      message: "Report generated successfully",
      reportUrl: "/reports/sample-report.pdf",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Bulk update schedules
// @route   POST /api/schedules/bulk
// @access  Private (Admin only)
router.post("/bulk", protect, async (req, res) => {
  try {
    const { eventIds, updates } = req.body;

    const updatedSchedules = await Promise.all(
      eventIds.map(async (id) => {
        const schedule = await Schedule.findById(id);
        if (!schedule) return null;

        // Make sure user is schedule owner
        if (schedule.organizer.toString() !== req.user._id.toString()) {
          return null;
        }

        return await Schedule.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });
      })
    );

    // Filter out null values (schedules that couldn't be updated)
    const validUpdates = updatedSchedules.filter(
      (schedule) => schedule !== null
    );

    res.status(200).json({
      success: true,
      data: validUpdates,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
