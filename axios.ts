
import axios from 'axios';

const apiRequest = axios.create({
  baseURL: 'http://localhost:8000/api/', // Your Django server URL
  withCredentials: true,                // Automatically sends cookies with every request
});

export default apiRequest;