// Vercel serverless function entry point
// Wrap in try-catch to prevent function crashes

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
  express = require("express");
  app = express();
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
        missing: missingVars.length > 0 ? missingVars : undefined
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: error.message 
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
    console.error("Unhandled error:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // Don't send response if already sent
    if (res.headersSent) {
      return next(error);
    }
    
    res.status(500).json({ 
      msg: "An unexpected error occurred. Please try again later.",
      error: error?.message || "Unknown error",
      errorType: error?.name || "UnknownError"
    });
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
