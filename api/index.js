// Vercel serverless function entry point
// Wrap in try-catch to prevent function crashes

// Handle unhandled promise rejections and errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

let app;
let connectDB;
let express;
let cors;
let mainRouter;
let initializationError = null;

try {
  require("dotenv").config();
  require('express-async-errors');

  connectDB = require("../db/connect");
  express = require("express");
  cors = require('cors');
  mainRouter = require("../routes/user");

  app = express();
} catch (error) {
  console.error("❌ Failed to initialize dependencies:", error);
  console.error("Error message:", error.message);
  console.error("Error stack:", error.stack);
  initializationError = error;
  
  // Create a minimal app that returns errors
  try {
    express = require("express");
    app = express();
  } catch (expressError) {
    console.error("❌ Even Express failed to load:", expressError);
    // Last resort - return a simple function
    module.exports = (req, res) => {
      res.status(500).json({
        msg: "Critical server error",
        error: initializationError.message
      });
    };
  }
}

// Always set up basic middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// If initialization failed, return error for all routes
if (initializationError) {
  app.use((req, res) => {
    res.status(500).json({
      msg: "Server initialization failed",
      error: initializationError.message,
      errorType: "initialization_error",
      hint: "Check Vercel function logs for details"
    });
  });
  module.exports = app;
} else {
  // Normal initialization - continue with full setup
  
  // Connect to MongoDB
  let dbConnected = false;
  let dbConnectionPromise = null;

  const connectDatabase = async () => {
    if (dbConnected) {
      return;
    }

    if (dbConnectionPromise) {
      return dbConnectionPromise;
    }

    dbConnectionPromise = (async () => {
      try {
        if (!process.env.MONGO_URI) {
          console.error("❌ MONGO_URI environment variable is not set");
          throw new Error("MONGO_URI is required");
        }

        await connectDB(process.env.MONGO_URI);
        dbConnected = true;
        console.log("✅ MongoDB connected");
        return true;
      } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        dbConnectionPromise = null;
        throw error;
      }
    })();

    return dbConnectionPromise;
  };

  // Middleware to ensure database is connected before handling requests
  app.use(async (req, res, next) => {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      console.error("Database connection failed:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return res.status(500).json({ 
        msg: "Database connection failed. Please check server configuration.",
        error: error.message,
        errorType: "database_connection"
      });
    }
  });

  // Mount routes
  // In Vercel, when /api/(.*) is rewritten to /api/index.js,
  // the path that reaches Express might be /v1/register (without /api prefix)
  // So we mount at /v1, not /api/v1
  app.use("/v1", mainRouter);
  
  // Also handle /api/v1 for direct access (though rewrite should handle this)
  app.use("/api/v1", mainRouter);

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const dbStatus = dbConnected ? "connected" : "disconnected";
      const envCheck = {
        hasMongoUri: !!process.env.MONGO_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasSmtpHost: !!process.env.SMTP_HOST,
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasFrontendUrl: !!process.env.FRONTEND_URL
      };
      
      // Debug: Log all environment variables (values masked)
      console.log("Environment check:", {
        MONGO_URI: process.env.MONGO_URI ? `Set (${process.env.MONGO_URI.length} chars)` : "NOT SET",
        JWT_SECRET: process.env.JWT_SECRET ? `Set (${process.env.JWT_SECRET.length} chars)` : "NOT SET",
        SMTP_HOST: process.env.SMTP_HOST || "NOT SET",
        SMTP_USER: process.env.SMTP_USER ? "Set" : "NOT SET",
        FRONTEND_URL: process.env.FRONTEND_URL || "NOT SET"
      });
      
      const missingVars = [];
      if (!envCheck.hasMongoUri) missingVars.push("MONGO_URI");
      if (!envCheck.hasJwtSecret) missingVars.push("JWT_SECRET");
      
      res.json({ 
        status: dbStatus === "connected" && missingVars.length === 0 ? "ok" : "warning",
        message: missingVars.length > 0 
          ? `Missing required environment variables: ${missingVars.join(", ")}`
          : "AuthFlow API is running - All required environment variables are set",
        database: dbStatus,
        env: envCheck,
        missing: missingVars.length > 0 ? missingVars : undefined,
        debug: {
          mongoUriLength: process.env.MONGO_URI?.length || 0,
          jwtSecretLength: process.env.JWT_SECRET?.length || 0,
          nodeEnv: process.env.NODE_ENV || "not set",
          initializationError: initializationError ? initializationError.message : null
        }
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: error.message 
      });
    }
  });

  // Debug endpoint to test registration without actually registering
  app.post("/api/v1/test-register", async (req, res) => {
    try {
      console.log("Test register endpoint called");
      console.log("Request body:", req.body);
      console.log("Environment check:", {
        hasMongoUri: !!process.env.MONGO_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasSmtpUser: !!process.env.SMTP_USER
      });
      
      // Try to require modules
      let modulesStatus = {
        User: false,
        emailService: false,
        jwt: false
      };
      
      try {
        const User = require("../models/User");
        modulesStatus.User = !!User;
      } catch (e) {
        console.error("User model error:", e.message);
      }
      
      try {
        const emailService = require("../utils/emailService");
        modulesStatus.emailService = !!emailService;
      } catch (e) {
        console.error("Email service error:", e.message);
      }
      
      try {
        const jwt = require("jsonwebtoken");
        modulesStatus.jwt = !!jwt;
      } catch (e) {
        console.error("JWT error:", e.message);
      }
      
      res.json({
        status: "ok",
        message: "Test endpoint working",
        modules: modulesStatus,
        env: {
          hasMongoUri: !!process.env.MONGO_URI,
          hasJwtSecret: !!process.env.JWT_SECRET
        }
      });
    } catch (error) {
      console.error("Test endpoint error:", error);
      res.status(500).json({
        status: "error",
        message: error.message,
        stack: error.stack
      });
    }
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({ 
      message: "AuthFlow API", 
      status: "running"
    });
  });

  // Error handling middleware (must be last)
  app.use((error, req, res, next) => {
    console.error("❌ Unhandled error in middleware:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Request path:", req.path);
    console.error("Request method:", req.method);
    
    // Don't send response if already sent
    if (res.headersSent) {
      return next(error);
    }
    
    // In development or if error is known, provide more details
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse = {
      msg: "An unexpected error occurred. Please try again later.",
      error: error?.message || "Unknown error",
      errorType: error?.name || "UnknownError"
    };
    
    // Add stack trace in development
    if (isDevelopment && error?.stack) {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  });

  // Handle 404 for API routes
  app.use((req, res) => {
    res.status(404).json({ 
      msg: "Route not found",
      path: req.path
    });
  });
}

module.exports = app;
