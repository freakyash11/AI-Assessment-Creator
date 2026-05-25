import axios from 'axios';
import { AssignmentFormData, QuestionPaper } from '../store/assessmentStore';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/`,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vedaai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message ?? error.message ?? 'An unknown error occurred';
    return Promise.reject(new Error(message));
  }
);

export interface CreateAssignmentResponse {
  assignment: { _id: string; status: string; [key: string]: any };
  jobId: string;
}

export const createAssignment = async (data: AssignmentFormData): Promise<CreateAssignmentResponse> => {
  const response = await api.post('assignments', data);
  return response.data;
};

export const getAssignment = async (id: string): Promise<any> => {
  const response = await api.get(`assignments/${id}`);
  return response.data;
};

export const getAssignments = async (page = 1, limit = 10): Promise<{ data: any[]; total: number; hasNext: boolean }> => {
  const response = await api.get(`assignments?page=${page}&limit=${limit}`);
  return response.data;
};

export const getPaper = async (assignmentId: string): Promise<QuestionPaper> => {
  const response = await api.get(`papers/${assignmentId}`);
  return response.data;
};

export const regenerateAssignment = async (id: string): Promise<{ jobId: string }> => {
  const response = await api.post(`assignments/${id}/regenerate`);
  return response.data;
};

export const deleteAssignment = async (id: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`assignments/${id}`);
  return response.data;
};

export default api;
