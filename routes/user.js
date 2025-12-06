const express = require("express");
const router = express.Router();

// Wrap route handlers to catch errors
const asyncHandler = (fn) => {
  if (!fn || typeof fn !== 'function') {
    return (req, res) => {
      res.status(500).json({
        msg: "Route handler not available",
        error: "Controller function failed to load",
        errorType: "module_loading_error"
      });
    };
  }
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

let login, register, dashboard, getAllUsers, authMiddleware;
let routesLoaded = false;

try {
  console.log("Loading controllers/user...");
  const userController = require("../controllers/user");
  login = userController.login;
  register = userController.register;
  dashboard = userController.dashboard;
  getAllUsers = userController.getAllUsers;
  console.log("✅ Controllers loaded");
  
  console.log("Loading middleware/auth...");
  authMiddleware = require('../middleware/auth');
  console.log("✅ Middleware loaded");
  
  routesLoaded = true;
  console.log("✅ All routes loaded successfully");
} catch (error) {
  console.error("❌ Failed to load routes:", error);
  console.error("Error name:", error.name);
  console.error("Error message:", error.message);
  console.error("Error code:", error.code);
  console.error("Error stack:", error.stack);
  routesLoaded = false;
  
  // Create fallback handlers
  const fallbackHandler = (req, res) => {
    res.status(500).json({
      msg: "Server configuration error - Routes failed to load",
      error: error.message,
      errorType: error.name || "ModuleLoadError",
      hint: "Check Vercel function logs for module loading errors"
    });
  };
  
  login = fallbackHandler;
  register = fallbackHandler;
  dashboard = fallbackHandler;
  getAllUsers = fallbackHandler;
  authMiddleware = (req, res, next) => {
    res.status(500).json({
      msg: "Authentication middleware not available",
      error: error.message
    });
  };
}

// Only set up routes if everything loaded
if (routesLoaded) {
  router.route("/login").post(asyncHandler(login));
  router.route("/register").post(asyncHandler(register));
  router.route("/dashboard").get(authMiddleware, asyncHandler(dashboard));
  router.route("/users").get(asyncHandler(getAllUsers));
} else {
  // Set up error routes
  router.use((req, res) => {
    res.status(500).json({
      msg: "Routes not available - Module loading failed",
      error: "Check Vercel function logs",
      path: req.path
    });
  });
}

module.exports = router;