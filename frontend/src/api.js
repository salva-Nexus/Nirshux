// src/api.js
import axios from 'axios';

const API = axios.create({
  // This looks for a variable named VITE_API_URL, 
  // and if it doesn't find it, it uses localhost for your local testing.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

export default API;