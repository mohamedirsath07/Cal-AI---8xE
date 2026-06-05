/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CalAI — Shared Nutrition Goals
 *
 *  Reads / writes the user's daily nutrition targets from AsyncStorage.
 *  Used by Dashboard, Diary, History, Result, and Profile screens.
 *
 *  Storage key: @calai/nutrition_goals
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GOALS_KEY = '@calai/nutrition_goals';

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DEFAULT_GOALS: NutritionGoals = {
  calories: 2500,
  protein: 150,
  carbs: 280,
  fat: 85,
};

export async function loadGoals(): Promise<NutritionGoals> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_GOALS;
}

export async function saveGoals(goals: NutritionGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}
