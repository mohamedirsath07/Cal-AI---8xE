/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CalAI — Streak Tracking Service
 *
 *  Persists a daily logging streak in AsyncStorage.
 *
 *  Rules:
 *    • If a meal was already logged today  → do nothing (streak unchanged)
 *    • If the last log was yesterday       → streak + 1
 *    • If the gap is > 1 day              → reset streak to 1
 *    • First-ever log                     → streak = 1
 *
 *  Call `updateStreak()` every time a meal is saved.
 *  Call `getStreak()` to read the current value for display.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  CURRENT_STREAK: '@calai/streak_current',
  BEST_STREAK: '@calai/streak_best',
  LAST_LOGGED_DATE: '@calai/streak_last_logged',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakData {
  /** How many consecutive days the user has logged a meal. */
  currentStreak: number;
  /** The all-time best streak. */
  bestStreak: number;
  /** The last date a meal was logged (YYYY-MM-DD), or null if never. */
  lastLoggedDate: string | null;
  /** Whether the user has already logged a meal today. */
  loggedToday: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Today's date as YYYY-MM-DD, based on the device clock. */
function today(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Calculate the gap in calendar days between two YYYY-MM-DD strings.
 * Returns the absolute difference so order doesn't matter.
 */
function daysBetween(dateA: string, dateB: string): number {
  return Math.abs(dayjs(dateA).diff(dayjs(dateB), 'day'));
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Read the current streak data from AsyncStorage.
 *
 * @returns The full `StreakData` object.
 *
 * @example
 * ```ts
 * const { currentStreak, bestStreak, loggedToday } = await getStreak();
 * ```
 */
export async function getStreak(): Promise<StreakData> {
  try {
    const [currentRaw, bestRaw, lastDate] = await AsyncStorage.multiGet([
      KEYS.CURRENT_STREAK,
      KEYS.BEST_STREAK,
      KEYS.LAST_LOGGED_DATE,
    ]);

    const currentStreak = parseInt(currentRaw[1] ?? '0', 10) || 0;
    const bestStreak = parseInt(bestRaw[1] ?? '0', 10) || 0;
    const lastLoggedDate = lastDate[1] ?? null;

    // Check if the streak is still valid (not broken by a missed day)
    const todayStr = today();
    let effectiveStreak = currentStreak;

    if (lastLoggedDate) {
      const gap = daysBetween(lastLoggedDate, todayStr);
      // If the last log was more than 1 day ago and it's not today,
      // the streak is broken — but we don't persist the reset here,
      // we just report it accurately.
      if (gap > 1) {
        effectiveStreak = 0;
      }
    }

    return {
      currentStreak: effectiveStreak,
      bestStreak: Math.max(bestStreak, effectiveStreak),
      lastLoggedDate,
      loggedToday: lastLoggedDate === todayStr,
    };
  } catch (error) {
    console.error('[Streak] Error reading streak:', error);
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastLoggedDate: null,
      loggedToday: false,
    };
  }
}

/**
 * Update the streak after a meal is logged.
 *
 * This should be called every time `saveMeal()` succeeds.
 * The function is idempotent — calling it multiple times on the same day
 * will not change the streak.
 *
 * @returns The updated `StreakData`.
 *
 * @example
 * ```ts
 * import { updateStreak } from '@services/streak';
 *
 * const saved = await saveMeal(meal);
 * if (saved) {
 *   const streak = await updateStreak();
 *   console.log(`Streak: ${streak.currentStreak} days`);
 * }
 * ```
 */
export async function updateStreak(): Promise<StreakData> {
  try {
    const todayStr = today();

    // Read current state
    const [currentRaw, bestRaw, lastDateRaw] = await AsyncStorage.multiGet([
      KEYS.CURRENT_STREAK,
      KEYS.BEST_STREAK,
      KEYS.LAST_LOGGED_DATE,
    ]);

    const storedStreak = parseInt(currentRaw[1] ?? '0', 10) || 0;
    const storedBest = parseInt(bestRaw[1] ?? '0', 10) || 0;
    const lastLoggedDate = lastDateRaw[1] ?? null;

    let newStreak: number;

    // ── Rule 1: Already logged today → no change ──
    if (lastLoggedDate === todayStr) {
      return {
        currentStreak: storedStreak,
        bestStreak: storedBest,
        lastLoggedDate,
        loggedToday: true,
      };
    }

    // ── Rule 2: First-ever log ──
    if (!lastLoggedDate) {
      newStreak = 1;
    }
    // ── Rule 3: Logged yesterday → increment ──
    else if (daysBetween(lastLoggedDate, todayStr) === 1) {
      newStreak = storedStreak + 1;
    }
    // ── Rule 4: Gap > 1 day → reset ──
    else {
      newStreak = 1;
    }

    // Update best streak
    const newBest = Math.max(storedBest, newStreak);

    // Persist all three values atomically
    await AsyncStorage.multiSet([
      [KEYS.CURRENT_STREAK, String(newStreak)],
      [KEYS.BEST_STREAK, String(newBest)],
      [KEYS.LAST_LOGGED_DATE, todayStr],
    ]);

    return {
      currentStreak: newStreak,
      bestStreak: newBest,
      lastLoggedDate: todayStr,
      loggedToday: true,
    };
  } catch (error) {
    console.error('[Streak] Error updating streak:', error);
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastLoggedDate: null,
      loggedToday: false,
    };
  }
}

/**
 * Reset the streak entirely. Useful for debug or account reset.
 */
export async function resetStreak(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.CURRENT_STREAK,
      KEYS.BEST_STREAK,
      KEYS.LAST_LOGGED_DATE,
    ]);
  } catch (error) {
    console.error('[Streak] Error resetting streak:', error);
  }
}

/**
 * Get a boolean array representing which of the last 7 days had a log.
 * Index 0 = 6 days ago, index 6 = today.
 *
 * This reads from the daily logs list in storage to determine activity.
 * Used by the Dashboard streak card's weekly dots.
 *
 * @example
 * ```ts
 * const activity = await getWeekActivity();
 * // [true, true, false, true, true, true, true]
 * ```
 */
export async function getWeekActivity(): Promise<boolean[]> {
  try {
    const raw = await AsyncStorage.getItem('daily_logs');
    const loggedDates: string[] = raw ? JSON.parse(raw) : [];

    const logSet = new Set(loggedDates);

    return Array.from({ length: 7 }, (_, i) => {
      const date = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
      return logSet.has(date);
    });
  } catch (error) {
    console.error('[Streak] Error reading week activity:', error);
    return [false, false, false, false, false, false, false];
  }
}
