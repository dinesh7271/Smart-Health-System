// src/api.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; 

// Train the model
export const trainModel = async () => {
  try {
    const response = await axios.post(`${API_URL}/train-model`);
    return response.data; // { accuracy: 0.95 }
  } catch (err) {
    console.error("Error training model:", err);
    return null;
  }
};

// Make a prediction
export const predict = async (inputData) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, inputData);
    return response.data; // { prediction: 1 } or { error: "Model not trained yet" }
  } catch (err) {
    console.error("Error predicting:", err);
    return null;
  }
};