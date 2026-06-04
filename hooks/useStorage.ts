import { useEffect, useState } from 'react';
import type { Meal, DailyLog } from '../types';
import {
  getMeals,
  getTodayMeals,
  calculateMacros,
  getTodayStats,
  getWeeklyStats,
  deleteMeal as deleteStorageMeal,
  saveMeal as saveStorageMeal,
} from '../lib/storage';

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/**
 * Hook to manage today's meals
 * Automatically syncs with storage
 * 
 * @returns Object with meals, loading state, and actions
 * @example
 * const { meals, loading, addMeal, removeMeal } = useStorageMeals();
 */
export const useStorageMeals = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load meals on mount
  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const data = await getTodayMeals();
      setMeals(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (meal: Meal): Promise<boolean> => {
    try {
      const success = await saveStorageMeal(meal);
      if (success) {
        await loadMeals();
      }
      return success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const removeMeal = async (mealId: string): Promise<boolean> => {
    try {
      const success = await deleteStorageMeal(mealId);
      if (success) {
        await loadMeals();
      }
      return success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const refresh = async () => {
    await loadMeals();
  };

  return { meals, loading, error, addMeal, removeMeal, refresh };
};

/**
 * Hook to get today's nutrition stats
 * Automatically updates when meals change
 * 
 * @returns Object with macro totals, loading state, and refresh function
 * @example
 * const { macros, loading, refresh } = useTodayStats();
 * console.log(`Calories: ${macros.calories}`);
 */
export const useTodayStats = () => {
  const [macros, setMacros] = useState<MacroTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getTodayStats();
      setMacros(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { macros, loading, error, refresh: loadStats };
};

/**
 * Hook to get weekly stats for charts
 * 
 * @returns Object with weekly data, loading state, and refresh function
 * @example
 * const { weeklyStats, loading } = useWeeklyStats();
 * // Use for Victory charts
 */
export const useWeeklyStats = () => {
  const [weeklyStats, setWeeklyStats] = useState<MacroTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getWeeklyStats();
      setWeeklyStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { weeklyStats, loading, error, refresh: loadStats };
};

/**
 * Hook to get all meals (historical data)
 * 
 * @returns Object with all meals, loading state, and refresh function
 * @example
 * const { allMeals, loading } = useAllMeals();
 */
export const useAllMeals = () => {
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const data = await getMeals();
      setAllMeals(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  return { allMeals, loading, error, refresh: loadMeals };
};

/**
 * Hook to calculate macros from meal array
 * 
 * @param meals - Meals to calculate from
 * @returns MacroTotals object
 * @example
 * const macros = useCalculateMacros(meals);
 */
export const useCalculateMacros = (meals: Meal[]): MacroTotals => {
  const [macros, setMacros] = useState<MacroTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  useEffect(() => {
    const calculated = calculateMacros(meals);
    setMacros(calculated);
  }, [meals]);

  return macros;
};

/**
 * Hook to manage sync with storage
 * Syncs at interval (default 30 seconds)
 * 
 * @param interval - Sync interval in ms (default 30000)
 * @returns Sync status and refresh function
 * @example
 * const { isSyncing, refresh } = useStorageSync(60000);
 */
export const useStorageSync = (interval: number = 30000) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = async () => {
    setIsSyncing(true);
    try {
      // Could refresh multiple sources here
      await getTodayStats();
      await getTodayMeals();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const syncInterval = setInterval(refresh, interval);
    return () => clearInterval(syncInterval);
  }, [interval]);

  return { isSyncing, refresh };
};
