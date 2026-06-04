import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyLog, Meal, Food } from '../types';
import dayjs from 'dayjs';
import { updateStreak } from '../services/streak';

/**
 * AsyncStorage service layer for persistent meal and nutrition data
 * Handles all CRUD operations for meals, daily logs, and macro calculations
 */

const STORAGE_KEYS = {
  MEALS: 'meals_',
  DAILY_LOG: 'daily_log_',
  USER_MEALS: 'user_meals',
  DAILY_LOGS: 'daily_logs',
} as const;

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/**
 * Save a meal to AsyncStorage
 * Stores meal immediately and updates daily log
 * 
 * @param meal - Meal object to save
 * @returns Promise<boolean> - Success status
 * @example
 * const meal = { id: '1', name: 'Breakfast', time: '08:00', foods: [...], totalCalories: 500 };
 * await saveMeal(meal);
 */
export const saveMeal = async (meal: Meal): Promise<boolean> => {
  try {
    // Get existing meals
    const existingMeals = await getMeals();

    // Add new meal
    const updatedMeals = [...existingMeals, meal];

    // Save to storage
    await AsyncStorage.setItem(STORAGE_KEYS.USER_MEALS, JSON.stringify(updatedMeals));

    // Update daily log
    const today = dayjs().format('YYYY-MM-DD');
    const dailyLog = await getDailyLog(today);

    if (dailyLog) {
      const macros = calculateTotalMacros([...dailyLog.meals, meal]);

      const updatedLog: DailyLog = {
        ...dailyLog,
        meals: [...dailyLog.meals, meal],
        totalCalories: macros.calories,
        totalProtein: macros.protein,
        totalCarbs: macros.carbs,
        totalFat: macros.fat,
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.DAILY_LOG}${today}`,
        JSON.stringify(updatedLog)
      );
    } else {
      // Create new daily log
      const macros = calculateTotalMacros([meal]);

      const newDailyLog: DailyLog = {
        id: `log_${today}`,
        date: new Date(today),
        meals: [meal],
        totalCalories: macros.calories,
        totalProtein: macros.protein,
        totalCarbs: macros.carbs,
        totalFat: macros.fat,
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.DAILY_LOG}${today}`,
        JSON.stringify(newDailyLog)
      );
    }

    // Track in daily logs list
    const dailyLogsList = await getDailyLogsList();
    if (!dailyLogsList.includes(today)) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DAILY_LOGS,
        JSON.stringify([...dailyLogsList, today])
      );
    }

    // Update daily streak
    await updateStreak();

    return true;
  } catch (error) {
    console.error('Error saving meal:', error);
    return false;
  }
};

/**
 * Get all meals from storage
 * 
 * @returns Promise<Meal[]> - Array of all meals
 * @example
 * const meals = await getMeals();
 * console.log(meals.length); // Total meals logged
 */
export const getMeals = async (): Promise<Meal[]> => {
  try {
    const mealsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_MEALS);
    return mealsJson ? JSON.parse(mealsJson) : [];
  } catch (error) {
    console.error('Error getting meals:', error);
    return [];
  }
};

/**
 * Get today's meals
 * Returns all meals for the current date
 * 
 * @returns Promise<Meal[]> - Array of meals from today
 * @example
 * const todayMeals = await getTodayMeals();
 * const totalCalories = todayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
 */
export const getTodayMeals = async (): Promise<Meal[]> => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const dailyLog = await getDailyLog(today);
    return dailyLog?.meals || [];
  } catch (error) {
    console.error('Error getting today meals:', error);
    return [];
  }
};

/**
 * Get meals for a specific date
 * 
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise<Meal[]> - Meals for that date
 * @example
 * const meals = await getMealsByDate('2024-01-15');
 */
export const getMealsByDate = async (date: string): Promise<Meal[]> => {
  try {
    const dailyLog = await getDailyLog(date);
    return dailyLog?.meals || [];
  } catch (error) {
    console.error('Error getting meals by date:', error);
    return [];
  }
};

/**
 * Calculate total macros for a meal array
 * Sums all nutritional values from provided meals
 * 
 * @param meals - Array of meals to calculate from
 * @returns MacroTotals - Total nutritional values
 * @example
 * const macros = calculateMacros(todayMeals);
 * console.log(`Protein today: ${macros.protein}g`);
 */
export const calculateMacros = (meals: Meal[]): MacroTotals => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + calculateFoodMacros(meal.foods).protein,
      carbs: acc.carbs + calculateFoodMacros(meal.foods).carbs,
      fat: acc.fat + calculateFoodMacros(meal.foods).fat,
      fiber: acc.fiber + calculateFoodMacros(meal.foods).fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};

/**
 * Delete a meal from storage
 * Removes meal and updates daily log
 * 
 * @param mealId - ID of meal to delete
 * @returns Promise<boolean> - Success status
 * @example
 * await deleteMeal('meal_123');
 */
export const deleteMeal = async (mealId: string): Promise<boolean> => {
  try {
    const meals = await getMeals();
    const updatedMeals = meals.filter((m) => m.id !== mealId);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_MEALS, JSON.stringify(updatedMeals));

    // Update daily log
    const today = dayjs().format('YYYY-MM-DD');
    const dailyLog = await getDailyLog(today);

    if (dailyLog) {
      const updatedMeals = dailyLog.meals.filter((m) => m.id !== mealId);
      const macros = calculateTotalMacros(updatedMeals);

      const updatedLog: DailyLog = {
        ...dailyLog,
        meals: updatedMeals,
        totalCalories: macros.calories,
        totalProtein: macros.protein,
        totalCarbs: macros.carbs,
        totalFat: macros.fat,
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.DAILY_LOG}${today}`,
        JSON.stringify(updatedLog)
      );
    }

    return true;
  } catch (error) {
    console.error('Error deleting meal:', error);
    return false;
  }
};

/**
 * Get daily log for specific date
 * 
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise<DailyLog | null> - Daily log or null
 * @internal
 */
export const getDailyLog = async (date: string): Promise<DailyLog | null> => {
  try {
    const logJson = await AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_LOG}${date}`);
    return logJson ? JSON.parse(logJson) : null;
  } catch (error) {
    console.error('Error getting daily log:', error);
    return null;
  }
};

/**
 * Get all daily logs
 * 
 * @returns Promise<DailyLog[]> - Array of all daily logs
 * @example
 * const allLogs = await getAllDailyLogs();
 */
export const getAllDailyLogs = async (): Promise<DailyLog[]> => {
  try {
    const dates = await getDailyLogsList();
    const logs: DailyLog[] = [];

    for (const date of dates) {
      const log = await getDailyLog(date);
      if (log) logs.push(log);
    }

    return logs;
  } catch (error) {
    console.error('Error getting all daily logs:', error);
    return [];
  }
};

/**
 * Get today's nutrition totals
 * 
 * @returns Promise<MacroTotals> - Today's macro totals
 * @example
 * const todayStats = await getTodayStats();
 * console.log(`Consumed ${todayStats.calories} calories today`);
 */
export const getTodayStats = async (): Promise<MacroTotals> => {
  const meals = await getTodayMeals();
  return calculateMacros(meals);
};

/**
 * Get weekly stats (last 7 days)
 * 
 * @returns Promise<MacroTotals[]> - Array of daily totals for last 7 days
 * @example
 * const weeklyStats = await getWeeklyStats();
 * const avgCalories = weeklyStats.reduce((s, d) => s + d.calories, 0) / 7;
 */
export const getWeeklyStats = async (): Promise<MacroTotals[]> => {
  try {
    const stats: MacroTotals[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const meals = await getMealsByDate(date);
      stats.push(calculateMacros(meals));
    }

    return stats;
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    return [];
  }
};

/**
 * Clear all storage data
 * WARNING: This deletes all meals and logs
 * 
 * @returns Promise<boolean> - Success status
 * @example
 * // Use with caution!
 * await clearAllData();
 */
export const clearAllData = async (): Promise<boolean> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mealKeys = keys.filter((key) => key.includes('meal') || key.includes('log'));
    await AsyncStorage.multiRemove(mealKeys);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Export data as JSON
 * Useful for backup or data migration
 * 
 * @returns Promise<string> - JSON string of all data
 * @example
 * const jsonData = await exportData();
 * // Save to file or send to server
 */
export const exportData = async (): Promise<string> => {
  try {
    const meals = await getMeals();
    const logs = await getAllDailyLogs();

    return JSON.stringify(
      {
        export_date: new Date().toISOString(),
        meals,
        logs,
      },
      null,
      2
    );
  } catch (error) {
    console.error('Error exporting data:', error);
    return '';
  }
};

/**
 * Import data from JSON
 * Restores from backup
 * 
 * @param jsonData - JSON string containing meals and logs
 * @returns Promise<boolean> - Success status
 * @example
 * await importData(jsonDataString);
 */
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);

    if (data.meals) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_MEALS, JSON.stringify(data.meals));
    }

    if (data.logs) {
      for (const log of data.logs) {
        const date = dayjs(log.date).format('YYYY-MM-DD');
        await AsyncStorage.setItem(`${STORAGE_KEYS.DAILY_LOG}${date}`, JSON.stringify(log));
      }
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// ============================================
// Private Helper Functions
// ============================================

/**
 * Calculate macros for array of foods
 * @internal
 */
const calculateFoodMacros = (foods: Food[]): MacroTotals => {
  return foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      fiber: acc.fiber + food.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};

/**
 * Calculate total macros for meal array
 * @internal
 */
const calculateTotalMacros = (meals: Meal[]): MacroTotals => {
  return meals.reduce(
    (acc, meal) => {
      const foodMacros = calculateFoodMacros(meal.foods);
      return {
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + foodMacros.protein,
        carbs: acc.carbs + foodMacros.carbs,
        fat: acc.fat + foodMacros.fat,
        fiber: acc.fiber + foodMacros.fiber,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};

/**
 * Get list of daily log dates
 * @internal
 */
const getDailyLogsList = async (): Promise<string[]> => {
  try {
    const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch {
    return [];
  }
};
