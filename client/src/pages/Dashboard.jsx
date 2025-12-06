import React, { useEffect, useState } from 'react'
import "../styles/Dashboard.css";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_ENDPOINTS } from "../config/api";

const Dashboard = () => {
  const [ token, setToken ] = useState(() => {
    // Check both localStorage and sessionStorage
    const stored = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    return stored ? JSON.parse(stored) : "";
  });
  const [ data, setData ] = useState({});
  const navigate = useNavigate();

  const fetchLuckyNumber = async () => {

    let axiosConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
    }
    };

    try {
      const response = await axios.get(API_ENDPOINTS.DASHBOARD, axiosConfig);
      setData({ msg: response.data.msg, luckyNumber: response.data.secret });
    } catch (error) {
      const errorMessage = error.response?.data?.msg || error.message || "Failed to fetch dashboard data";
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
        navigate("/login");
      }
    }
  }


  
  useEffect(() => {
    fetchLuckyNumber();
    if(token === ""){
      navigate("/login");
      toast.warn("Please login first to access dashboard");
    }
  }, [token]);

  return (
    <div className='dashboard-main'>
      <h1>Dashboard</h1>
      <p>{ data.msg }! { data.luckyNumber }</p>
      <Link to="/logout" className="logout-button">Logout</Link>
    </div>
  )
}

export default Dashboard