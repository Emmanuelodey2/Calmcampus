
import axios from 'axios';

const apiRequest = axios.create({
  baseURL: 'https://calmcampus-5hry.onrender.com/', // Your Django server URL
  withCredentials: true,                // Automatically sends cookies with every request
});

export default apiRequest;
