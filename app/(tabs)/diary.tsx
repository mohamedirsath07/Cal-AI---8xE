import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTodayMeals, getMealsByDate, deleteMeal, calculateMacros } from '../../lib/storage';
import { loadGoals, DEFAULT_GOALS } from '../../lib/goals';
import type { NutritionGoals } from '../../lib/goals';
import type { Meal, Food } from '../../types';
import dayjs from 'dayjs';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#000000',
  accent: '#FF5252',
  accentEnd: '#E84393',
  protein: '#6366F1',
  carbs: '#F59E0B',
  fat: '#EC4899',
  success: '#22C55E',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text1: 'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.60)',
  text3: 'rgba(255,255,255,0.35)',
  text4: 'rgba(255,255,255,0.18)',
  danger: '#EF4444',
};

// ─── Meal Category System ─────────────────────────────────────────────────────

interface MealCategory {
  key: string;
  label: string;
  emoji: string;
  icon: string;
  color: string;
  timeRange: string;
}

const CATEGORIES: MealCategory[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅', icon: 'weather-sunset-up', color: '#F59E0B', timeRange: '5:00 – 11:00' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️', icon: 'white-balance-sunny', color: '#22C55E', timeRange: '11:00 – 15:00' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙', icon: 'weather-night', color: '#8B5CF6', timeRange: '17:00 – 22:00' },
  { key: 'snacks', label: 'Snacks', emoji: '🍿', icon: 'food-apple', color: '#EC4899', timeRange: 'Anytime' },
];

/**
 * Classify a meal into a category based on its time (HH:mm).
 * Falls back to 'snacks' for anything outside standard windows.
 */
function classifyMeal(meal: Meal): string {
  const hour = parseInt(meal.time.split(':')[0], 10);
  if (isNaN(hour)) return 'snacks';
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'snacks';
}

/**
 * Sum macros across all foods in a meal.
 */
function mealMacros(meal: Meal) {
  return meal.foods.reduce(
    (acc, f) => ({
      protein: acc.protein + (f.protein || 0),
      carbs: acc.carbs + (f.carbs || 0),
      fat: acc.fat + (f.fat || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );
}

// ─── Date Chip ────────────────────────────────────────────────────────────────

function DateChip({
  date,
  isSelected,
  isToday,
  onPress,
}: {
  date: dayjs.Dayjs;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        style={{
          width: 52,
          paddingVertical: 10,
          borderRadius: 16,
          alignItems: 'center',
          marginRight: 8,
          backgroundColor: isSelected ? C.accent : C.glass,
          borderWidth: 1,
          borderColor: isSelected ? C.accent : C.glassBorder,
          ...(isSelected && Platform.OS === 'ios'
            ? { shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }
            : {}),
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: isSelected ? C.white : C.text3,
            textTransform: 'uppercase',
          }}
        >
          {date.format('ddd')}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            color: isSelected ? C.white : isToday ? C.accent : C.text1,
            marginTop: 4,
          }}
        >
          {date.format('D')}
        </Text>
        {isToday && !isSelected && (
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: C.accent,
              marginTop: 4,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Macro Pill ───────────────────────────────────────────────────────────────

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: `${color}12`,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: C.text2 }}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  );
}

// ─── Food Item Row ────────────────────────────────────────────────────────────

function FoodItemRow({ food }: { food: Food }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.glassBorder,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.text1 }} numberOfLines={1}>
          {food.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          <MacroPill label="P" value={food.protein} color={C.protein} />
          <MacroPill label="C" value={food.carbs} color={C.carbs} />
          <MacroPill label="F" value={food.fat} color={C.fat} />
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: C.accent }}>
          {food.calories}
        </Text>
        <Text style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>kcal</Text>
      </View>
    </View>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
  index: number;
}

function MealCard({ meal, onDelete, index }: MealCardProps) {
  const macros = mealMacros(meal);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDelete = () => {
    Alert.alert('Delete Meal', `Remove "${meal.name}" from your diary?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(meal.id),
      },
    ]);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: C.glassBorder,
          marginBottom: 10,
        }}
      >
        <BlurView intensity={12} tint="dark">
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ padding: 16 }}>
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: C.text1 }} numberOfLines={1}>
                    {meal.name}
                  </Text>
                  <View
                    style={{
                      backgroundColor: C.glass,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: C.glassBorder,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: C.text3, fontWeight: '500' }}>
                      {meal.time}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.text3} />
                </TouchableOpacity>
              </View>

              {/* Food items */}
              {meal.foods.map((food, i) => (
                <FoodItemRow key={food.id || `food-${i}`} food={food} />
              ))}

              {/* Meal totals */}
              {meal.foods.length > 1 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3 }}>
                    Meal Total
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.text1 }}>
                    {meal.totalCalories} kcal
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: MealCategory;
  meals: Meal[];
  onDeleteMeal: (id: string) => void;
}

function CategorySection({ category, meals, onDeleteMeal }: CategorySectionProps) {
  const totalCals = meals.reduce((sum, m) => sum + m.totalCalories, 0);

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: `${category.color}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name={category.icon as any} size={18} color={category.color} />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text1 }}>
              {category.label}
            </Text>
            <Text style={{ fontSize: 11, color: C.text3 }}>
              {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: `${category.color}12`,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: category.color }}>
            {totalCals} kcal
          </Text>
        </View>
      </View>

      {/* Meal cards */}
      {meals.map((meal, index) => (
        <MealCard key={meal.id} meal={meal} onDelete={onDeleteMeal} index={index} />
      ))}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAddMeal }: { onAddMeal: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: C.glass,
          borderWidth: 1,
          borderColor: C.glassBorder,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <MaterialCommunityIcons name="food-off" size={36} color={C.text3} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.text1, marginBottom: 8 }}>
        No meals logged
      </Text>
      <Text style={{ fontSize: 14, color: C.text3, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
        Start tracking your nutrition by scanning{'\n'}a meal with the camera.
      </Text>
      <TouchableOpacity onPress={onAddMeal} activeOpacity={0.85}>
        <LinearGradient
          colors={[C.accent, C.accentEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 16,
          }}
        >
          <MaterialCommunityIcons name="camera-plus" size={20} color={C.white} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.white }}>Add Meal</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  DIARY SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function Diary() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);

  // 7-day date range centered on today
  const dates = Array.from({ length: 7 }, (_, i) => dayjs().subtract(3 - i, 'day'));
  const isToday = selectedDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  // ── Load Meals ──
  const loadMeals = useCallback(async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const todayStr = dayjs().format('YYYY-MM-DD');

      const [fetched, g] = await Promise.all([
        dateStr === todayStr ? getTodayMeals() : getMealsByDate(dateStr),
        loadGoals(),
      ]);
      setMeals(fetched);
      setGoals(g);
    } catch (err) {
      console.error('Failed to load meals:', err);
      setMeals([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Reload on screen focus (e.g. coming back from saving a meal)
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadMeals();
    }, [loadMeals])
  );

  // Reload when date changes
  useEffect(() => {
    setIsLoading(true);
    loadMeals();
  }, [selectedDate]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMeals();
  }, [loadMeals]);

  // ── Delete Meal ──
  const handleDeleteMeal = async (mealId: string) => {
    const success = await deleteMeal(mealId);
    if (success) {
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    } else {
      Alert.alert('Error', 'Failed to delete meal.');
    }
  };

  // ── Group Meals by Category ──
  const grouped: Record<string, Meal[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };
  meals.forEach((meal) => {
    const cat = classifyMeal(meal);
    grouped[cat].push(meal);
  });

  // ── Calculate Totals ──
  const totals = meals.reduce(
    (acc, meal) => {
      const m = mealMacros(meal);
      return {
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieGoal = goals.calories;
  const remaining = Math.max(calorieGoal - totals.calories, 0);
  const progress = calorieGoal > 0 ? Math.min(totals.calories / calorieGoal, 1) : 0;

  // Populated categories
  const populatedCats = CATEGORIES.filter((cat) => grouped[cat.key].length > 0);

  return (
    <View style={[styles.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5 }}>
                Food Diary
              </Text>
              <Text style={{ fontSize: 13, color: C.text3, marginTop: 4, fontWeight: '500' }}>
                {isToday ? 'Today' : selectedDate.format('dddd')}, {selectedDate.format('MMM D')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/camera')}
              activeOpacity={0.8}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[C.accent, C.accentEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.flex1, styles.center]}
              >
                <MaterialCommunityIcons name="plus" size={24} color={C.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Date Selector ── */}
        <View style={{ paddingLeft: 24, marginTop: 20, marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
            {dates.map((date) => {
              const key = date.format('YYYY-MM-DD');
              return (
                <DateChip
                  key={key}
                  date={date}
                  isSelected={key === selectedDate.format('YYYY-MM-DD')}
                  isToday={key === dayjs().format('YYYY-MM-DD')}
                  onPress={() => setSelectedDate(date)}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* ── Summary Card ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: C.glassBorder,
            }}
          >
            <BlurView intensity={20} tint="dark">
              <LinearGradient
                colors={[
                  'rgba(255,82,82,0.10)',
                  'rgba(232,67,147,0.04)',
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={{ padding: 22 }}>
                  {/* Top row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 1.5 }}>
                        TOTAL CALORIES
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                        <Text
                          style={{
                            fontSize: 38,
                            fontWeight: '800',
                            color: C.white,
                            letterSpacing: -1,
                          }}
                        >
                          {totals.calories.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: C.text3 }}>
                          kcal
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: C.text3 }}>
                        REMAINING
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '700',
                          color: remaining > 0 ? C.success : C.accent,
                          marginTop: 4,
                        }}
                      >
                        {remaining.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      marginTop: 18,
                      marginBottom: 18,
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={[C.accent, C.accentEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: '100%',
                        width: `${Math.round(progress * 100)}%`,
                        borderRadius: 3,
                      }}
                    />
                  </View>

                  {/* Macro summary */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <MacroSummaryChip label="Protein" value={totals.protein} color={C.protein} />
                    <MacroSummaryChip label="Carbs" value={totals.carbs} color={C.carbs} />
                    <MacroSummaryChip label="Fat" value={totals.fat} color={C.fat} />
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* ── Meal Sections ── */}
        <View style={{ paddingHorizontal: 24 }}>
          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 14, color: C.text3 }}>Loading meals…</Text>
            </View>
          ) : meals.length === 0 ? (
            <EmptyState onAddMeal={() => router.push('/camera')} />
          ) : (
            <>
              {populatedCats.map((cat) => (
                <CategorySection
                  key={cat.key}
                  category={cat}
                  meals={grouped[cat.key]}
                  onDeleteMeal={handleDeleteMeal}
                />
              ))}

              {/* Empty categories as add prompts */}
              {CATEGORIES.filter((cat) => grouped[cat.key].length === 0).length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: C.text3,
                      letterSpacing: 2,
                      marginBottom: 14,
                    }}
                  >
                    ADD MORE
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.filter((cat) => grouped[cat.key].length === 0).map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => router.push('/camera')}
                        activeOpacity={0.7}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: C.glass,
                            borderWidth: 1,
                            borderColor: C.glassBorder,
                            borderStyle: 'dashed',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 14,
                          }}
                        >
                          <MaterialCommunityIcons name={cat.icon as any} size={16} color={C.text3} />
                          <Text style={{ fontSize: 13, fontWeight: '500', color: C.text3 }}>
                            {cat.label}
                          </Text>
                          <MaterialCommunityIcons name="plus" size={14} color={C.text4} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Macro Summary Chip (for totals card) ─────────────────────────────────────

function MacroSummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.glassBorder,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.white }}>
          {Math.round(value)}g
        </Text>
        <Text style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
