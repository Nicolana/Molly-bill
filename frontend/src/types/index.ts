export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Bill {
  id: number;
  amount: number;
  type: 'expense' | 'income';
  category?: string;
  description?: string;
  date: string;
  owner_id: number;
}

export interface BillCreate {
  amount: number;
  category?: string;
  type: 'expense' | 'income';
  description?: string;
  date?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
}

// AI记账助手相关类型
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  bills?: Bill[]; // 如果是AI解析出的账单信息（完整账单对象）
}

// 数据库聊天消息类型
export interface DBChatMessage {
  id: number;
  content: string;
  message_type: 'user' | 'assistant';
  timestamp: string;
  user_id: number;
  bill_id?: number;
  input_type?: string;
  ai_confidence?: number;
  is_processed: boolean;
}

// 后端返回的聊天消息类型（包含账单信息）
export interface APIChatMessage {
  id: number;
  content: string;
  message_type: 'user' | 'assistant';
  timestamp: string;
  user_id: number;
  bill_id?: number;
  input_type?: string;
  ai_confidence?: number;
  is_processed: boolean;
  bills: Bill[]; // 关联的账单信息（完整账单对象）
}

export interface ChatHistoryResponse {
  messages: DBChatMessage[];
  total: number;
}

// 统一的聊天请求和响应类型
export interface ChatRequest {
  message: string;
  image?: string; // base64编码的图片
  audio?: string; // base64编码的音频
}

export interface ChatResponse {
  message: string;
  bills?: BillCreate[];
  confidence?: number;
}

 