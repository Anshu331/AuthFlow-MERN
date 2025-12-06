import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if user previously chose to remember
    const remembered = localStorage.getItem("rememberMe");
    return remembered === "true";
  });
  const [ token, setToken ] = useState(() => {
    // Check both localStorage and sessionStorage
    const stored = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    return stored ? JSON.parse(stored) : "";
  });
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form fields
  const validateForm = (email, password) => {
    const newErrors = {};

    if (!email || email.trim().length === 0) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password || password.length === 0) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    let email = e.target.email.value.trim();
    let password = e.target.password.value;

    // Validate form
    if (!validateForm(email, password)) {
      return;
    }

    setLoading(true);
    const formData = {
      email,
      password,
    };

    try {
      const response = await axios.post(
        API_ENDPOINTS.LOGIN,
        formData
      );
      
      // Store token based on remember me checkbox
      if (rememberMe) {
        localStorage.setItem('auth', JSON.stringify(response.data.token));
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('auth', JSON.stringify(response.data.token));
        localStorage.removeItem('rememberMe');
      }
      toast.success("Login successful! Redirecting...");
      
      // Small delay for better UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      console.log(err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error
        // Try multiple ways to access the data
        const responseData = err.response.data || {};
        const errorMessage = responseData.msg || responseData.message || "";
        const errorType = responseData.errorType || err.response.data?.errorType;
        
        // Debug: Log the actual response
        console.log("Login Error Response:", {
          status: err.response.status,
          fullResponse: err.response,
          responseData: responseData,
          errorType: errorType,
          errorMessage: errorMessage,
          errorTypeEqualsEmail: errorType === "email",
          errorTypeEqualsPassword: errorType === "password",
          hasErrorType: errorType !== undefined && errorType !== null
        });
        
        // Set field-specific errors for authentication errors
        if (err.response.status === 401 || err.response.status === 400) {
          // Method 1: Check errorType first (most reliable)
          if (errorType === "email") {
            // Only set error on email field, clear password field
            setErrors({ email: "Incorrect email", password: "" });
            toast.error("Incorrect email");
          } 
          else if (errorType === "password") {
            // Only set error on password field, clear email field
            setErrors({ email: "", password: "Incorrect password" });
            toast.error("Incorrect password");
          }
          // Method 2: If errorType not found, check message content
          else {
            const msg = String(errorMessage || "").trim().toLowerCase();
            
            if (msg === "incorrect email" || (msg.includes("email") && !msg.includes("password"))) {
              setErrors({ email: "Incorrect email", password: "" });
              toast.error("Incorrect email");
            } 
            else if (msg === "incorrect password" || (msg.includes("password") && !msg.includes("email"))) {
              setErrors({ email: "", password: "Incorrect password" });
              toast.error("Incorrect password");
            }
            // Method 3: Generic fallback only if nothing matched - show only toast, no field errors
            else {
              console.warn("No specific error matched, using generic:", { errorType, errorMessage, responseData });
              setErrors({ email: "", password: "" }); // Clear any previous errors
              toast.error("Incorrect or invalid credentials");
            }
          }
        } else {
          toast.error(errorMessage || "An error occurred");
        }
      } else if (err.request) {
        // Request made but no response
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        // Something else happened
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(token !== ""){
      toast.success("You already logged in");
      navigate("/dashboard");
    }
  }, []);

  return (
    <div className="login-main">
      <div className="login-left">
        <div className="login-3d-shape login-3d-shape-1"></div>
        <div className="login-3d-shape login-3d-shape-2"></div>
        <div className="login-3d-shape login-3d-shape-3"></div>
        <div className="login-left-content">
          <h1 className="login-brand">AuthFlow</h1>
          <p className="login-tagline">Secure Authentication Made Simple</p>
          <div className="login-decoration"></div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-center">
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>
            <form onSubmit={handleLoginSubmit}>
              <div>
                <input 
                  type="email" 
                  placeholder="Email" 
                  name="email" 
                  className={errors.email ? "error-input" : ""}
                  onBlur={(e) => {
                    const email = e.target.value.trim();
                    if (email && !validateEmail(email)) {
                      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
                    } else if (email) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  className={errors.password ? "error-input" : ""}
                  onBlur={(e) => {
                    const password = e.target.value;
                    if (password && password.length < 8) {
                      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
                    } else if (password) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.password;
                        return newErrors;
                      });
                    }
                  }}
                />
                {showPassword ? (
                  <FaEyeSlash
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  />
                ) : (
                  <FaEye
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  />
                )}
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}

              <div className="login-center-options">
                <div className="remember-div">
                  <input 
                    type="checkbox" 
                    id="remember-checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-checkbox">
                    Remember me
                  </label>
                </div>
              </div>
              <div className="login-center-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
