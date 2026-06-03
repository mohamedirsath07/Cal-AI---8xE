import { useCallback } from 'react';
import type { Food } from '../types';
import { calculateProgressPercentage, getTotalNutrition } from '../lib/calculations';

export function useNutritionCalculations() {
  const getTotalNutrients = useCallback((foods: Food[]) => {
    return getTotalNutrition(foods);
  }, []);

  const getCaloriePercentage = useCallback((consumed: number, goal: number) => {
    return calculateProgressPercentage(consumed, goal);
  }, []);

  const getMacroPercentage = useCallback((consumed: number, goal: number) => {
    return calculateProgressPercentage(consumed, goal);
  }, []);

  const getRemainingCalories = useCallback((consumed: number, goal: number) => {
    return Math.max(0, goal - consumed);
  }, []);

  const getRemainingMacro = useCallback((consumed: number, goal: number) => {
    return Math.max(0, goal - consumed);
  }, []);

  return {
    getTotalNutrients,
    getCaloriePercentage,
    getMacroPercentage,
    getRemainingCalories,
    getRemainingMacro,
  };
}

export function useMealCategories() {
  const getMealEmoji = (mealName: string): string => {
    const mealMap: Record<string, string> = {
      breakfast: '🌅',
      brunch: '🥐',
      lunch: '🍽️',
      snack: '🍿',
      dinner: '🌙',
      dessert: '🍰',
      drink: '🥤',
    };
    return mealMap[mealName.toLowerCase()] || '🍽️';
  };

  const getMealTime = (mealName: string): string => {
    const timeMap: Record<string, string> = {
      breakfast: '08:00',
      brunch: '11:00',
      lunch: '12:30',
      snack: '15:00',
      dinner: '19:00',
      dessert: '21:00',
      drink: 'anytime',
    };
    return timeMap[mealName.toLowerCase()] || '12:00';
  };

  return {
    getMealEmoji,
    getMealTime,
  };
}

export function useCalorieHealthStatus() {
  const getHealthStatus = (consumed: number, goal: number) => {
    const percentage = (consumed / goal) * 100;

    if (percentage <= 80) return { status: 'under', color: '#3B82F6' };
    if (percentage <= 100) return { status: 'perfect', color: '#10B981' };
    if (percentage <= 120) return { status: 'over', color: '#F59E0B' };
    return { status: 'way_over', color: '#EF4444' };
  };

  const getStatusMessage = (status: string): string => {
    const messages: Record<string, string> = {
      under: 'Add more to reach your goal',
      perfect: 'Perfect intake for today',
      over: 'Slightly over goal',
      way_over: 'Significantly over goal',
    };
    return messages[status] || '';
  };

  return {
    getHealthStatus,
    getStatusMessage,
  };
}
