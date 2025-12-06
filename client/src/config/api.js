// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  USERS: `${API_BASE_URL}/users`,
};

export default API_BASE_URL;

