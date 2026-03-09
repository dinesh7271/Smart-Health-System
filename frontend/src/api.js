// src/api.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; 

// Health Check
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (err) {
    console.error("Health check failed:", err);
    return { status: "offline" };
  }
};

// Make a prediction
export const predict = async (wardData) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, { ward_data: wardData });
    return response.data; 
  } catch (err) {
    console.error("Error predicting:", err);
    return null;
  }
};

// Get 2024 Risk Graph Data
export const getRiskGraph2024 = async () => {
  try {
    const response = await axios.get(`${API_URL}/risk-graph-2024`);
    return response.data;
  } catch (err) {
    console.error("Error fetching risk graph:", err);
    return [];
  }
};