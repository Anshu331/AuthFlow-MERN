// Vercel serverless function entry point
require("dotenv").config();
require('express-async-errors');

const connectDB = require("../db/connect");
const express = require("express");
const cors = require('cors');
const mainRouter = require("../routes/user");

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

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
    return res.status(500).json({ 
      msg: "Database connection failed. Please check server configuration.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mount routes
app.use("/api/v1", mainRouter);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = dbConnected ? "connected" : "disconnected";
    res.json({ 
      status: "ok", 
      message: "AuthFlow API is running",
      database: dbStatus,
      env: {
        hasMongoUri: !!process.env.MONGO_URI,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
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
  res.json({ message: "AuthFlow API", status: "running" });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ 
    msg: "An unexpected error occurred. Please try again later.",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = app;

