const express = require("express");
const router = express.Router();

// Wrap route handlers to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

let login, register, dashboard, getAllUsers, authMiddleware;

try {
  const userController = require("../controllers/user");
  login = userController.login;
  register = userController.register;
  dashboard = userController.dashboard;
  getAllUsers = userController.getAllUsers;
  
  authMiddleware = require('../middleware/auth');
  
  console.log("✅ Routes loaded successfully");
} catch (error) {
  console.error("❌ Failed to load routes:", error);
  console.error("Error stack:", error.stack);
}

router.route("/login").post(asyncHandler(login));
router.route("/register").post(asyncHandler(register));
router.route("/dashboard").get(authMiddleware, asyncHandler(dashboard));
router.route("/users").get(asyncHandler(getAllUsers));

module.exports = router;