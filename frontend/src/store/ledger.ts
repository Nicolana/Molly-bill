import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ledger, UserLedger } from '@/types';
import { ledgersAPI } from '@/lib/api';

interface LedgerState {
  userLedgers: UserLedger[];
  currentLedgerId: number | null;
  currentLedger: Ledger | null;
  isLoading: boolean;
  
  // Actions
  fetchUserLedgers: () => Promise<void>;
  setCurrentLedger: (ledgerId: number) => Promise<void>;
  getCurrentLedger: () => Promise<void>;
  clearLedgerData: () => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      userLedgers: [],
      currentLedgerId: null,
      currentLedger: null,
      isLoading: false,

      // 获取用户账本列表
      fetchUserLedgers: async () => {
        try {
          set({ isLoading: true });
          const response = await ledgersAPI.getUserLedgers();
          
          if (response.data.success && response.data.data) {
            const ledgers = response.data.data;
            set({ userLedgers: ledgers });
            
            // 如果没有当前选中的账本，设置第一个为当前账本
            const { currentLedgerId } = get();
            if (!currentLedgerId && ledgers.length > 0) {
              await get().setCurrentLedger(ledgers[0].ledger!.id);
            }
          }
        } catch (error) {
          console.error('获取账本列表失败:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // 设置当前账本
      setCurrentLedger: async (ledgerId: number) => {
        try {
          const response = await ledgersAPI.setCurrentLedger(ledgerId);
          if (response.data.success) {
            set({ currentLedgerId: ledgerId });
          }
        } catch (error) {
          console.error('设置当前账本失败:', error);
          throw error;
        }
      },

      // 获取当前账本
      getCurrentLedger: async () => {
        try {
          const response = await ledgersAPI.getCurrentLedger();
          if (response.data.success && response.data.data?.current_ledger_id) {
            set({ currentLedgerId: response.data.data.current_ledger_id });
          }
        } catch (error) {
          console.error('获取当前账本失败:', error);
        }
      },

      // 清空账本数据（用于登出）
      clearLedgerData: () => {
        set({ 
          userLedgers: [], 
          currentLedgerId: null,
          isLoading: false 
        });
      },
    }),
    {
      name: 'ledger-storage',
      partialize: (state) => ({ 
        currentLedgerId: state.currentLedgerId 
      }),
    }
  )
); 