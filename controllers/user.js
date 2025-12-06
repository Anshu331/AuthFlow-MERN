const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Safely require emailService - don't crash if it fails
let emailService = null;
try {
  emailService = require("../utils/emailService");
  if (!emailService || typeof emailService.sendWelcomeEmail !== 'function') {
    console.error("⚠️  Email service loaded but sendWelcomeEmail is not a function");
    emailService = { transporter: null, sendWelcomeEmail: () => Promise.resolve({ success: false }) };
  }
} catch (error) {
  console.error("⚠️  Email service not available:", error.message);
  console.error("   Error stack:", error.stack);
  emailService = { 
    transporter: null, 
    sendWelcomeEmail: () => Promise.resolve({ success: false, message: 'Email service not available' })
  };
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(401).json({
        msg: "Incorrect email",
        errorType: "email"
      });
    }

    // Check if user exists
    let foundUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!foundUser) {
      return res.status(401).json({ 
        msg: "Incorrect email",
        errorType: "email"
      });
    }

    // Verify password
    const isMatch = await foundUser.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        msg: "Incorrect password",
        errorType: "password"
      });
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET environment variable is not set");
      return res.status(500).json({ 
        msg: "Server configuration error. Please contact support." 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: foundUser._id, name: foundUser.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    return res.status(200).json({ 
      msg: "Login successful", 
      token,
      user: {
        name: foundUser.name,
        email: foundUser.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      msg: "An error occurred during login. Please try again later." 
    });
  }
};

const dashboard = async (req, res) => {
  try {
    const luckyNumber = Math.floor(Math.random() * 100);

    res.status(200).json({
      msg: `Welcome, ${req.user.name}`,
      secret: `Here is your authorized data, your lucky number is ${luckyNumber}`,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let users = await User.find({}).select('-password'); // Don't send passwords

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ msg: "Server error. Please try again later." });
  }
};

const register = async (req, res) => {
  try {
    // Log registration attempt
    console.log("Registration attempt:", { 
      hasUsername: !!req.body.username,
      hasEmail: !!req.body.email,
      hasPassword: !!req.body.password,
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    });

    let { username, email, password } = req.body;

    // Validate all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ 
        msg: "All fields are required. Please fill in name, email, and password." 
      });
    }

    // Trim and validate
    username = username.trim();
    email = email.toLowerCase().trim();
    password = password.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        msg: "Please enter a valid email address" 
      });
    }

    // Validate name length
    if (username.length < 3) {
      return res.status(400).json({ 
        msg: "Name must be at least 3 characters long" 
      });
    }

    if (username.length > 50) {
      return res.status(400).json({ 
        msg: "Name must be less than 50 characters" 
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        msg: "Password must be at least 8 characters long" 
      });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        msg: "Password must contain at least 8 characters with 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)" 
      });
    }

    // Check if email already exists
    let foundUser = await User.findOne({ email: email });
    if (foundUser) {
      return res.status(409).json({ 
        msg: "An account with this email already exists. Please use a different email or try logging in." 
      });
    }

    // Create new user
    const person = new User({
      name: username,
      email: email,
      password: password,
    });

    await person.save();

    // Don't send password back
    const userResponse = {
      _id: person._id,
      name: person.name,
      email: person.email,
    };

    // Send welcome email via SMTP (non-blocking, real-time)
    // Fire and forget - doesn't block registration response
    // Wrap in try-catch to prevent any errors from breaking the response
    try {
      if (emailService && typeof emailService.sendWelcomeEmail === 'function') {
        setImmediate(() => {
          try {
            if (emailService.transporter) {
              emailService.sendWelcomeEmail({
                name: person.name,
                email: person.email
              }).catch(err => {
                // Already handled in the function, but catch here to be safe
                console.error('Email error (non-critical):', err.message);
              });
            }
          } catch (emailError) {
            console.error('Email setup error (non-critical):', emailError.message);
          }
        });
      }
    } catch (emailError) {
      // Email sending should never break registration
      console.error('Email setup error (non-critical):', emailError.message);
    }

    return res.status(201).json({ 
      msg: "Account created successfully! You can now log in.", 
      user: userResponse 
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Log environment check
    console.error("Environment check at error:", {
      hasMongoUri: !!process.env.MONGO_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        msg: errors.join(', ') 
      });
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(409).json({ 
        msg: "An account with this email already exists. Please use a different email or try logging in." 
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongoServerError' || error.message.includes('Mongo') || error.message.includes('connection')) {
      return res.status(500).json({ 
        msg: "Database connection error. Please try again later.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        errorType: "database_error"
      });
    }

    // Handle module not found errors
    if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('Cannot find module')) {
      console.error("❌ MODULE_NOT_FOUND - Missing dependency:", error.message);
      return res.status(500).json({ 
        msg: "Server configuration error. Please contact support.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        errorType: "module_not_found"
      });
    }

    // Return error details to help debug (more info in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    return res.status(500).json({ 
      msg: "An error occurred during registration. Please try again later.",
      error: isDevelopment ? error.message : undefined,
      errorType: error.name || "UnknownError",
      errorCode: error.code,
      ...(isDevelopment && error.stack ? { stack: error.stack } : {})
    });
  }
};

module.exports = {
  login,
  register,
  dashboard,
  getAllUsers,
};
