
import axios from 'axios';

// Get the base URL from environment variables or use a default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    console.log('Adding auth token to request:', token.substring(0, 15) + '...');
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('No auth token found in localStorage');
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add a response interceptor for debugging
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('API error response:', error.response?.data || error.message);
  return Promise.reject(error);
});

export default api;

// API endpoints
export const testDbConnection = () => api.get('/test-db');

// User authentication
export const loginUser = (credentials: { email: string; password: string }) => 
  api.post('/auth/login', credentials);

export const registerUser = (userData: { 
  email: string; 
  password: string; 
  role: 'applicant' | 'recruiter';
}) => api.post('/auth/register', userData);

// Applicant endpoints
export const getApplicantProfile = (userId: string) => 
  api.get(`/profile/${userId}`);

export const updateApplicantProfile = (userId: string, profileData: any) => 
  api.put(`/profile/${userId}`, profileData);

// Job endpoints
export const getJobs = () => api.get('/jobs');

export const getJobById = (jobId: string) => 
  api.get(`/jobs/${jobId}`);

export const createJob = (jobData: {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
}) => {
  console.log('Creating job with data:', jobData);
  return api.post('/jobs', jobData);
};

// Application endpoints
export const submitJobApplication = (jobId: string, applicationData: FormData) => {
  return api.post(`/applications/apply/${jobId}`, applicationData, {
    headers: {
      'Content-Type': 'multipart/form-data' // Override for file uploads
    }
  });
};

export const getUserApplications = (userId: string) => 
  api.get(`/applications/user/${userId}`);

export const getApplicationDetails = (applicationId: string) =>
  api.get(`/applications/${applicationId}`);

// AI-powered candidate search
export const searchAICandidates = (query: string) => 
  api.post('/ai-candidates/search', { query });

// AI Chat Assistant
export const sendChatMessage = (message: string, conversationHistory: any[] = []) => 
  api.post('/ai-chat/assistant', { message, conversationHistory });

// Add more API endpoints as needed
