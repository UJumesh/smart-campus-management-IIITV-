const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyToken,
  refreshToken,
} = require("../controllers/auth.controller");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.get("/verify", verifyToken);

// Protected routes
router.use(protect);
router.get("/me", getMe);
router.put("/updatepassword", updatePassword);
router.get("/logout", logout);

// Add the refresh token route to the router
router.post("/refresh-token", refreshToken);

module.exports = router;
