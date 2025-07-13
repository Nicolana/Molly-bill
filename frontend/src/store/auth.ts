import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      login: (token: string, user: User) => {
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true, isLoading: false });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      },
      
      setUser: (user: User) => set({ user }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            set({ isLoading: true });
            // 动态导入API以避免循环依赖
            const { authAPI } = await import('@/lib/api');
            const { useLedgerStore } = await import('./ledger');
            
            const userResponse = await authAPI.getMe();
            const userData = userResponse.data.data;
            
            if (!userData) {
              throw new Error('用户数据为空');
            }
            
            set({ 
              token, 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false 
            });
            
            // 如果用户有账本信息，同时初始化账本 store
            if (userData.user_ledgers && userData.user_ledgers.length > 0) {
              const ledgerStore = useLedgerStore.getState();
              
              // 设置用户账本列表
              ledgerStore.userLedgers = userData.user_ledgers;
              
              // 设置当前账本ID
              if (userData.current_ledger_id) {
                ledgerStore.currentLedgerId = userData.current_ledger_id;
              } else if (userData.user_ledgers.length > 0) {
                // 如果没有设置当前账本，使用第一个账本
                ledgerStore.currentLedgerId = userData.user_ledgers[0].ledger_id;
              }
              
              // 更新 ledger store
              useLedgerStore.setState(ledgerStore);
            }
          } catch (error) {
            console.error('初始化认证状态失败:', error);
            // 如果获取用户信息失败，清除无效的token
            localStorage.removeItem('token');
            set({ 
              token: null, 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化token，用户信息通过API重新获取
      partialize: (state) => ({ token: state.token }),
    }
  )
); 