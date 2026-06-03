import type { Food, UserProfile } from '../types';

export const calculateBMR = (profile: UserProfile): number => {
  const { weight, height, age } = profile;
  // Mifflin-St Jeor equation
  const basalMetabolicRate =
    10 * weight + 6.25 * height - 5 * age + (profile.goal === 'weight_loss' ? -161 : 5);
  return basalMetabolicRate;
};

export const calculateDailyCalories = (profile: UserProfile): number => {
  const bmr = calculateBMR(profile);
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };

  const multiplier = activityMultipliers[profile.activityLevel] || 1.2;
  let tdee = bmr * multiplier;

  // Adjust for goal
  if (profile.goal === 'weight_loss') {
    tdee -= 500; // 500 calorie deficit
  } else if (profile.goal === 'muscle_gain') {
    tdee += 500; // 500 calorie surplus
  }

  return Math.round(tdee);
};

export const calculateMacros = (
  calories: number,
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance'
): { protein: number; carbs: number; fat: number } => {
  let proteinPercent = 0.3;
  let carbsPercent = 0.4;
  let fatPercent = 0.3;

  if (goal === 'muscle_gain') {
    proteinPercent = 0.35;
    carbsPercent = 0.45;
    fatPercent = 0.2;
  } else if (goal === 'weight_loss') {
    proteinPercent = 0.35;
    carbsPercent = 0.35;
    fatPercent = 0.3;
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4),
    carbs: Math.round((calories * carbsPercent) / 4),
    fat: Math.round((calories * fatPercent) / 9),
  };
};

export const calculateProgressPercentage = (current: number, goal: number): number => {
  return Math.min((current / goal) * 100, 100);
};

export const getTotalNutrition = (foods: Food[]): { calories: number; protein: number; carbs: number; fat: number } => {
  return foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

export const formatCalories = (calories: number): string => {
  return calories.toLocaleString('en-US');
};

export const formatMacro = (value: number): string => {
  return value.toFixed(1);
};
