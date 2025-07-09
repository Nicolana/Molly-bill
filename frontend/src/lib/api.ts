import axios, { AxiosError } from 'axios';
import { User, Bill, BillCreate, AuthResponse, LoginForm, RegisterForm } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('请求拦截器 - 当前token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('已添加Authorization头:', config.headers.Authorization);
  }
  console.log('请求配置:', config);
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  register: (data: RegisterForm) => api.post<User>('/register', data),
  login: (data: LoginForm) => {
    // 将JSON数据转换为表单数据格式
    const formData = new URLSearchParams();
    formData.append('username', data.email); // OAuth2PasswordRequestForm期望username字段
    formData.append('password', data.password);
    
    return api.post<AuthResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  getMe: () => api.get<User>('/me'),
};

// 账单相关API
export const billsAPI = {
  getBills: () => api.get<Bill[]>('/bills/'),
  createBill: (data: BillCreate) => api.post<Bill>('/bills/', data),
  deleteBill: (id: number) => api.delete(`/bills/${id}`),
};

export default api; 