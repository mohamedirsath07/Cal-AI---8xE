// App Constants
export const APP_NAME = 'CalAI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Premium AI Calorie Tracker';

// Colors
export const COLORS = {
  primary: '#FF6B6B',
  primaryDark: '#FF5252',
  success: '#4ADE80',
  warning: '#FCD34D',
  error: '#EF4444',
  info: '#06B6D4',
  background: '#000000',
  surface: '#0a0a0a',
  surfaceLight: '#1a1a1a',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  macroProtein: '#4F46E5',
  macroCarbs: '#8B5CF6',
  macroFat: '#EC4899',
  macroFiber: '#10B981',
};

// Nutrition Defaults
export const NUTRITION_DEFAULTS = {
  dailyCalorieGoal: 2500,
  minCalories: 1200,
  maxCalories: 5000,
  proteinPercentage: 0.3,
  carbsPercentage: 0.4,
  fatPercentage: 0.3,
};

// Activity Levels
export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary', multiplier: 1.2 },
  lightlyActive: { label: 'Lightly Active', multiplier: 1.375 },
  moderatelyActive: { label: 'Moderately Active', multiplier: 1.55 },
  veryActive: { label: 'Very Active', multiplier: 1.725 },
};

// Goals
export const GOALS = {
  weightLoss: { label: 'Weight Loss', calorieDifference: -500 },
  maintenance: { label: 'Maintenance', calorieDifference: 0 },
  muscleGain: { label: 'Muscle Gain', calorieDifference: 500 },
};

// Meal Types
export const MEAL_TYPES = {
  breakfast: { label: 'Breakfast', emoji: '🌅', defaultTime: '08:00' },
  brunch: { label: 'Brunch', emoji: '🥐', defaultTime: '11:00' },
  lunch: { label: 'Lunch', emoji: '🍽️', defaultTime: '12:30' },
  snack: { label: 'Snack', emoji: '🍿', defaultTime: '15:00' },
  dinner: { label: 'Dinner', emoji: '🌙', defaultTime: '19:00' },
  dessert: { label: 'Dessert', emoji: '🍰', defaultTime: '21:00' },
  drink: { label: 'Drink', emoji: '🥤', defaultTime: 'anytime' },
};

// Storage Keys
export const STORAGE_KEYS = {
  userProfile: '@calai/user_profile',
  dailyLogs: '@calai/daily_logs',
  foodHistory: '@calai/food_history',
  preferences: '@calai/preferences',
  achievements: '@calai/achievements',
  syncStatus: '@calai/sync_status',
};

// API Endpoints (when backend is ready)
export const API_ENDPOINTS = {
  analyzeFood: '/api/v1/nutrition/analyze',
  searchFood: '/api/v1/foods/search',
  getFoodDatabase: '/api/v1/foods/database',
  uploadLog: '/api/v1/logs/upload',
  getStats: '/api/v1/stats',
  syncData: '/api/v1/sync',
};

// Error Messages
export const ERROR_MESSAGES = {
  cameraPermissionDenied: 'Camera permission is required to scan food',
  imageAnalysisFailed: 'Failed to analyze image. Please try again.',
  networkError: 'Network connection error. Please check your internet.',
  dataStorageError: 'Failed to save data. Please try again.',
  invalidInput: 'Invalid input. Please check your data.',
  serverError: 'Server error. Please try again later.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  foodAdded: 'Food added to diary!',
  profileUpdated: 'Profile updated successfully!',
  dataSynced: 'Data synced successfully!',
  achievementUnlocked: 'Achievement unlocked!',
};

// Time Format
export const TIME_FORMAT = 'HH:mm';
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'dddd, MMM D';

// Animation Durations (in ms)
export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Size Constants
export const SIZES = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Border Radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};
