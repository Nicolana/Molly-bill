export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Bill {
  id: number;
  amount: number;
  category?: string;
  description?: string;
  date: string;
  owner_id: number;
}

export interface BillCreate {
  amount: number;
  category?: string;
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
  bills?: BillCreate[]; // 如果是AI解析出的账单信息
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

export interface ChatHistoryResponse {
  messages: DBChatMessage[];
  total: number;
}

export interface AIAnalysisRequest {
  message: string;
  image?: string; // base64编码的图片
  audio?: string; // base64编码的音频
}

export interface AIAnalysisResponse {
  message: string;
  bills?: BillCreate[];
  confidence: number;
}

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
}

export interface ImageAnalysisResult {
  text: string;
  bills: BillCreate[];
} 