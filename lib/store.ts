import { create } from 'zustand';
import type { Food, DailyLog, UserProfile, NutritionStats } from '../types';

interface NutritionStore {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;

  // Daily Log
  dailyLog: DailyLog | null;
  setDailyLog: (log: DailyLog) => void;
  addFood: (food: Food) => void;
  removeFood: (foodId: string) => void;

  // History
  foodHistory: Food[];
  addToHistory: (food: Food) => void;

  // Stats
  stats: NutritionStats | null;
  updateStats: (stats: NutritionStats) => void;

  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useNutritionStore = create<NutritionStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  dailyLog: null,
  setDailyLog: (log) => set({ dailyLog: log }),
  addFood: (food) =>
    set((state) => {
      if (!state.dailyLog) return state;
      return {
        dailyLog: {
          ...state.dailyLog,
          foods: [...(state.dailyLog as any).foods || [], food],
          totalCalories: (state.dailyLog as any).totalCalories + food.calories,
          totalProtein: (state.dailyLog as any).totalProtein + food.protein,
          totalCarbs: (state.dailyLog as any).totalCarbs + food.carbs,
          totalFat: (state.dailyLog as any).totalFat + food.fat,
        },
      };
    }),
  removeFood: (foodId) =>
    set((state) => {
      if (!state.dailyLog) return state;
      const food = ((state.dailyLog as any).foods || []).find((f: Food) => f.id === foodId);
      if (!food) return state;
      return {
        dailyLog: {
          ...state.dailyLog,
          foods: ((state.dailyLog as any).foods || []).filter((f: Food) => f.id !== foodId),
          totalCalories: (state.dailyLog as any).totalCalories - food.calories,
          totalProtein: (state.dailyLog as any).totalProtein - food.protein,
          totalCarbs: (state.dailyLog as any).totalCarbs - food.carbs,
          totalFat: (state.dailyLog as any).totalFat - food.fat,
        },
      };
    }),

  foodHistory: [],
  addToHistory: (food) => set((state) => ({ foodHistory: [food, ...state.foodHistory] })),

  stats: null,
  updateStats: (stats) => set({ stats }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
