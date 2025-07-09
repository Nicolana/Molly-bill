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