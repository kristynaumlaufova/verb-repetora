import axios from 'axios';
import config from '../config';

const apiClient = axios.create({
  baseURL: config.BASE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxRedirects: 0
});

// Add a response interceptor to handle common error cases
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized responses
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
    }
    
    // Handle error messages from the server
    if (error.response?.data) {
      throw new Error(error.response.data);
    }
    throw error;
  }
);

export { apiClient };
