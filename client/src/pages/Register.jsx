import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import "../styles/Register.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";



const Register = () => {
  const [ showPassword, setShowPassword ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [passwordAlertShown, setPasswordAlertShown] = useState(false);
  const [passwordAlertId, setPasswordAlertId] = useState(null);
  const navigate = useNavigate();
  const [ token, setToken ] = useState(() => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : "";
  });

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation function
  const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("At least 1 lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("At least 1 uppercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("At least 1 number");
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push("At least 1 special character (@$!%*?&)");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // Validate form fields
  const validateForm = (name, lastname, email, password, confirmPassword) => {
    const newErrors = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = "First name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "First name must be at least 2 characters";
    }

    if (!lastname || lastname.trim().length === 0) {
      newErrors.lastname = "Last name is required";
    } else if (lastname.trim().length < 2) {
      newErrors.lastname = "Last name must be at least 2 characters";
    }

    if (!email || email.trim().length === 0) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password || password.length === 0) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        newErrors.password = `Password must contain: ${passwordValidation.errors.join(", ")}`;
      }
    }

    if (!confirmPassword || confirmPassword.length === 0) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // Mark all fields as touched on submit
    setTouched({
      name: true,
      lastname: true,
      email: true,
      password: true,
      confirmPassword: true
    });
    
    let name = e.target.name.value.trim();
    let lastname = e.target.lastname.value.trim();
    let email = e.target.email.value.trim();
    let password = e.target.password.value;
    let confirmPassword = e.target.confirmPassword.value;

    // Validate form
    if (!validateForm(name, lastname, email, password, confirmPassword)) {
      return;
    }

    setLoading(true);
    const formData = {
      username: name + " " + lastname,
      email,
      password
    };

    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, formData);
      toast.success("Registration successful! Redirecting to login...");
      
      // Small delay for better UX
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.log(err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.msg || "Registration failed. Please try again.";
        toast.error(errorMessage);
        
        // Set field-specific errors
        if (err.response.status === 409 || errorMessage.includes("email")) {
          setErrors({ email: errorMessage });
        } else if (errorMessage.includes("name")) {
          setErrors({ name: errorMessage });
        } else if (errorMessage.includes("password")) {
          setErrors({ password: errorMessage });
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
  }

  useEffect(() => {
    if(token !== ""){
      toast.success("You already logged in");
      navigate("/dashboard");
    }
  }, []);

  return (
    <div className="register-main">
      <div className="register-left">
        <div className="register-3d-shape register-3d-shape-1"></div>
        <div className="register-3d-shape register-3d-shape-2"></div>
        <div className="register-3d-shape register-3d-shape-3"></div>
        <div className="register-left-content">
          <h1 className="register-brand">AuthFlow</h1>
          <p className="register-tagline">Join Us Today</p>
          <div className="register-decoration"></div>
        </div>
      </div>
      <div className="register-right">
        <div className="register-right-container">
          <div className="register-center">
            <h2>Create Your Account</h2>
            <p>Please enter your details to get started</p>
            <form onSubmit={handleRegisterSubmit}>
              <div>
                <input 
                  type="text" 
                  placeholder="Name" 
                  name="name" 
                  className={errors.name && (touched.name || submitAttempted) ? "error-input" : ""}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, name: true }));
                    const name = e.target.value.trim();
                    if (!name || name.length === 0) {
                      setErrors(prev => ({ ...prev, name: "First name is required" }));
                    } else if (name.length < 2) {
                      setErrors(prev => ({ ...prev, name: "First name must be at least 2 characters" }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.name && (touched.name || submitAttempted) && <span className="error-message">{errors.name}</span>}
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Lastname" 
                  name="lastname" 
                  className={errors.lastname && (touched.lastname || submitAttempted) ? "error-input" : ""}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, lastname: true }));
                    const lastname = e.target.value.trim();
                    if (!lastname || lastname.length === 0) {
                      setErrors(prev => ({ ...prev, lastname: "Last name is required" }));
                    } else if (lastname.length < 2) {
                      setErrors(prev => ({ ...prev, lastname: "Last name must be at least 2 characters" }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.lastname;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.lastname && (touched.lastname || submitAttempted) && <span className="error-message">{errors.lastname}</span>}
              </div>
              <div>
                <input 
                  type="email" 
                  placeholder="Email" 
                  name="email" 
                  className={errors.email && (touched.email || submitAttempted) ? "error-input" : ""}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, email: true }));
                    const email = e.target.value.trim();
                    if (!email || email.length === 0) {
                      setErrors(prev => ({ ...prev, email: "Email is required" }));
                    } else if (!validateEmail(email)) {
                      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.email && (touched.email || submitAttempted) && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="pass-input-div">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  name="password" 
                  className={errors.password && (touched.password || submitAttempted) ? "error-input" : ""}
                  onChange={(e) => {
                    const password = e.target.value;
                    
                    // Real-time password strength checking (for internal state)
                    const strength = {
                      length: password.length >= 8,
                      lowercase: /[a-z]/.test(password),
                      uppercase: /[A-Z]/.test(password),
                      number: /\d/.test(password),
                      special: /[@$!%*?&]/.test(password)
                    };
                    setPasswordStrength(strength);
                    
                    // Clear error if password becomes valid
                    if (password.length > 0) {
                      const validation = validatePasswordStrength(password);
                      if (validation.isValid) {
                        // Dismiss alert when password is valid
                        if (passwordAlertId) {
                          toast.dismiss(passwordAlertId);
                          setPasswordAlertId(null);
                        }
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.password;
                          return newErrors;
                        });
                      }
                    } else {
                      // Clear alert when password field is empty
                      if (passwordAlertId) {
                        toast.dismiss(passwordAlertId);
                        setPasswordAlertId(null);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, password: true }));
                    const password = e.target.value;
                    const confirmPassword = e.target.form.confirmPassword.value;
                    if (!password || password.length === 0) {
                      setErrors(prev => ({ ...prev, password: "Password is required" }));
                    } else {
                      const validation = validatePasswordStrength(password);
                      if (!validation.isValid) {
                        // Show alert message if criteria not fulfilled
                        if (passwordAlertId) {
                          toast.dismiss(passwordAlertId);
                        }
                        
                        const strength = {
                          length: password.length >= 8,
                          lowercase: /[a-z]/.test(password),
                          uppercase: /[A-Z]/.test(password),
                          number: /\d/.test(password),
                          special: /[@$!%*?&]/.test(password)
                        };
                        
                        // Build alert message showing which requirements are not met
                        const requirements = [
                          `${strength.length ? "✓" : "✗"} At least 8 characters`,
                          `${strength.uppercase ? "✓" : "✗"} At least 1 uppercase letter`,
                          `${strength.lowercase ? "✓" : "✗"} At least 1 lowercase letter`,
                          `${strength.number ? "✓" : "✗"} At least 1 number`,
                          `${strength.special ? "✓" : "✗"} At least 1 special character (@$!%*?&)`
                        ];
                        
                        const alertMessage = `Password must contain:\n${requirements.join("\n")}`;
                        
                        const id = toast.info(alertMessage, {
                          autoClose: 10000,
                          style: { whiteSpace: 'pre-line', textAlign: 'left' }
                        });
                        
                        setPasswordAlertId(id);
                        setErrors(prev => ({ ...prev, password: `Password must contain: ${validation.errors.join(", ")}` }));
                      } else {
                        // Dismiss alert if password is valid
                        if (passwordAlertId) {
                          toast.dismiss(passwordAlertId);
                          setPasswordAlertId(null);
                        }
                        if (confirmPassword && password !== confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.password;
                            if (confirmPassword && password === confirmPassword) {
                              delete newErrors.confirmPassword;
                            }
                            return newErrors;
                          });
                        }
                      }
                    }
                  }}
                />
                {showPassword ? <FaEyeSlash onClick={() => {setShowPassword(!showPassword)}} /> : <FaEye onClick={() => {setShowPassword(!showPassword)}} />}
              </div>
              {errors.password && (touched.password || submitAttempted) && <span className="error-message">{errors.password}</span>}
              <div className="pass-input-div">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  name="confirmPassword" 
                  className={errors.confirmPassword && (touched.confirmPassword || submitAttempted) ? "error-input" : ""}
                  onBlur={(e) => {
                    setTouched(prev => ({ ...prev, confirmPassword: true }));
                    const confirmPassword = e.target.value;
                    const password = e.target.form.password.value;
                    if (!confirmPassword || confirmPassword.length === 0) {
                      setErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }));
                    } else if (password !== confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
                    } else {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.confirmPassword;
                        return newErrors;
                      });
                    }
                  }}
                />
                {showPassword ? <FaEyeSlash onClick={() => {setShowPassword(!showPassword)}} /> : <FaEye onClick={() => {setShowPassword(!showPassword)}} />}
              </div>
              {errors.confirmPassword && (touched.confirmPassword || submitAttempted) && <span className="error-message">{errors.confirmPassword}</span>}
              <div className="register-center-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
