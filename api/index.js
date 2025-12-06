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

const connectDatabase = async () => {
  if (!dbConnected) {
    try {
      await connectDB(process.env.MONGO_URI);
      dbConnected = true;
      console.log("✅ MongoDB connected");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
    }
  }
};

// Initialize database connection
connectDatabase();

// Mount routes
app.use("/api/v1", mainRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AuthFlow API is running" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "AuthFlow API", status: "running" });
});

module.exports = app;

