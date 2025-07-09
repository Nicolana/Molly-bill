import axios, { AxiosError } from 'axios';
import { User, Bill, BillCreate, AuthResponse, LoginForm, RegisterForm, ChatRequest, ChatResponse, DBChatMessage, ChatHistoryResponse } from '@/types';

// 统一响应格式接口
interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error_code?: string;
}

interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 添加超时设置
  timeout: 10000,
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
}, (error) => {
  console.error('请求拦截器错误:', error);
  return Promise.reject(error);
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => {
    console.log('响应成功:', response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error('响应错误:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('Token 无效，清除本地存储并跳转到登录页');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  register: (data: RegisterForm) => api.post<BaseResponse<User>>('/register', data),
  login: (data: LoginForm) => {
    // 直接以JSON格式发送数据
    const payload = {
      email: data.email,
      password: data.password,
    };
    return api.post<BaseResponse<AuthResponse>>('/token', payload);
  },
  getMe: () => api.get<BaseResponse<User>>('/me'),
};

// 账单相关API
export const billsAPI = {
  getBills: (skip?: number, limit?: number) => api.get<BaseResponse<PaginatedResponse<Bill>>>('/bills/', {
    params: { skip, limit }
  }),
  createBill: (data: BillCreate) => api.post<BaseResponse<Bill>>('/bills/', data),
  deleteBill: (id: number) => api.delete<BaseResponse>(`/bills/${id}`),
};

// 聊天消息相关API
export const chatAPI = {
  // 获取聊天历史
  getChatHistory: (skip: number = 0, limit: number = 50) => 
    api.get<BaseResponse<ChatHistoryResponse>>(`/chat/messages?skip=${skip}&limit=${limit}`),
  
  // 获取最近的聊天消息
  getRecentMessages: (limit: number = 50) => 
    api.get<BaseResponse<DBChatMessage[]>>(`/chat/messages/recent?limit=${limit}`),
  
  // 删除聊天消息
  deleteMessage: (messageId: number) => 
    api.delete<BaseResponse>(`/chat/messages/${messageId}`),
};

// AI记账助手相关API
export const aiAPI = {
  // 统一的聊天接口（支持文本、语音、图片）
  chat: (data: ChatRequest) => api.post<BaseResponse<ChatResponse>>('/ai/chat', data),
};

export default api; 