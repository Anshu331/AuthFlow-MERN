// API Configuration
// In production (Vercel), use the same domain (relative path)
// In development, use localhost
const getBaseURL = () => {
  // Check if we have a custom API URL from environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (Vercel), use relative path (same domain)
  if (import.meta.env.PROD) {
    return '/api/v1';
  }
  
  // In development, use localhost
  return 'http://localhost:3000/api/v1';
};

const API_BASE_URL = getBaseURL();

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  USERS: `${API_BASE_URL}/users`,
};

export default API_BASE_URL;

