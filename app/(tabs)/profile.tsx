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
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { getMeals } from '../../lib/storage';
import { getStreak, getWeekActivity } from '../../services/streak';
import type { StreakData } from '../../services/streak';
import dayjs from 'dayjs';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#000000',
  accent: '#FF5252',
  accentEnd: '#E84393',
  protein: '#6366F1',
  proteinEnd: '#818CF8',
  carbs: '#F59E0B',
  carbsEnd: '#FBBF24',
  fat: '#EC4899',
  fatEnd: '#F472B6',
  success: '#22C55E',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text1: 'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.60)',
  text3: 'rgba(255,255,255,0.35)',
  text4: 'rgba(255,255,255,0.18)',
};

// ─── Goals Storage ────────────────────────────────────────────────────────────

const GOALS_KEY = '@calai/nutrition_goals';

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2500,
  protein: 150,
  carbs: 280,
  fat: 85,
};

async function loadGoals(): Promise<NutritionGoals> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_GOALS;
}

async function saveGoals(goals: NutritionGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// ─── Animated Stat Card ───────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, sub, color, delay }: StatCardProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.glassBorder }}>
        <BlurView intensity={12} tint="dark">
          <View style={{ padding: 16, alignItems: 'center', backgroundColor: C.glass }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: `${color}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <MaterialCommunityIcons name={icon as any} size={20} color={color} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.white }}>{value}</Text>
            <Text style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{label}</Text>
            <Text style={{ fontSize: 10, color, fontWeight: '600', marginTop: 4 }}>{sub}</Text>
          </View>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Goal Row ─────────────────────────────────────────────────────────────────

interface GoalRowProps {
  icon: string;
  label: string;
  value: number;
  unit: string;
  color: string;
}

function GoalRow({ icon, label, value, unit, color }: GoalRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 16,
        backgroundColor: C.glass,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.glassBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: `${color}15`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '500', color: C.text1 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.white }}>
        {value.toLocaleString()}
        <Text style={{ fontSize: 13, fontWeight: '500', color: C.text3 }}> {unit}</Text>
      </Text>
    </View>
  );
}

// ─── Week Dots ────────────────────────────────────────────────────────────────

function WeekDots({ activity }: { activity: boolean[] }) {
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // Align to last 7 days starting from 6 days ago
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().subtract(6 - i, 'day');
    return dayNames[d.day() === 0 ? 6 : d.day() - 1]; // Mon-indexed
  });

  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 12 }}>
      {activity.map((active, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: active ? C.success : 'rgba(255,255,255,0.08)',
              ...(active
                ? {
                    shadowColor: C.success,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                  }
                : {}),
            }}
          />
          <Text style={{ fontSize: 9, color: C.text3, fontWeight: '600' }}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Edit Goals Modal ─────────────────────────────────────────────────────────

interface EditGoalsModalProps {
  visible: boolean;
  goals: NutritionGoals;
  onSave: (goals: NutritionGoals) => void;
  onClose: () => void;
}

function EditGoalsModal({ visible, goals, onSave, onClose }: EditGoalsModalProps) {
  const [cals, setCals] = useState(String(goals.calories));
  const [prot, setProt] = useState(String(goals.protein));
  const [carb, setCarb] = useState(String(goals.carbs));
  const [fats, setFats] = useState(String(goals.fat));

  // Sync when modal opens
  useEffect(() => {
    if (visible) {
      setCals(String(goals.calories));
      setProt(String(goals.protein));
      setCarb(String(goals.carbs));
      setFats(String(goals.fat));
    }
  }, [visible]);

  const handleSave = () => {
    const updated: NutritionGoals = {
      calories: parseInt(cals, 10) || DEFAULT_GOALS.calories,
      protein: parseInt(prot, 10) || DEFAULT_GOALS.protein,
      carbs: parseInt(carb, 10) || DEFAULT_GOALS.carbs,
      fat: parseInt(fats, 10) || DEFAULT_GOALS.fat,
    };
    onSave(updated);
  };

  const fields = [
    { label: 'Calories', value: cals, set: setCals, unit: 'kcal', icon: 'fire', color: C.accent },
    { label: 'Protein', value: prot, set: setProt, unit: 'g', icon: 'arm-flex', color: C.protein },
    { label: 'Carbs', value: carb, set: setCarb, unit: 'g', icon: 'barley', color: C.carbs },
    { label: 'Fat', value: fats, set: setFats, unit: 'g', icon: 'water', color: C.fat },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.flex1]}
      >
        <View style={[styles.flex1, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }]}>
          <View
            style={{
              backgroundColor: '#0D0D0D',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: C.glassBorder,
              paddingBottom: Platform.OS === 'ios' ? 36 : 24,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}
              />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.white }}>Edit Goals</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: C.glass,
                    borderWidth: 1,
                    borderColor: C.glassBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="close" size={18} color={C.text2} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Fields */}
            <View style={{ paddingHorizontal: 24, gap: 12, marginTop: 8 }}>
              {fields.map((f) => (
                <View
                  key={f.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: C.glass,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: C.glassBorder,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: `${f.color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons name={f.icon as any} size={17} color={f.color} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: C.text2 }}>
                    {f.label}
                  </Text>
                  <TextInput
                    value={f.value}
                    onChangeText={f.set}
                    keyboardType="number-pad"
                    maxLength={5}
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: C.white,
                      textAlign: 'right',
                      minWidth: 60,
                      paddingVertical: 12,
                    }}
                    selectionColor={f.color}
                    placeholderTextColor={C.text3}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: C.text3, marginLeft: 4 }}>
                    {f.unit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Save Button */}
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
                <LinearGradient
                  colors={[C.accent, C.accentEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 18,
                    alignItems: 'center',
                    ...(Platform.OS === 'ios'
                      ? { shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 }
                      : { elevation: 8 }),
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: C.white }}>
                    Save Goals
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  PROFILE SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function Profile() {
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastLoggedDate: null,
    loggedToday: false,
  });
  const [weekActivity, setWeekActivity] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [mealsLogged, setMealsLogged] = useState(0);
  const [showEditor, setShowEditor] = useState(false);

  // ── Load Data ──
  const loadAll = useCallback(async () => {
    const [g, s, w, meals] = await Promise.all([
      loadGoals(),
      getStreak(),
      getWeekActivity(),
      getMeals(),
    ]);
    setGoals(g);
    setStreak(s);
    setWeekActivity(w);
    setMealsLogged(meals.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  // ── Save Goals ──
  const handleSaveGoals = async (newGoals: NutritionGoals) => {
    await saveGoals(newGoals);
    setGoals(newGoals);
    setShowEditor(false);
  };

  return (
    <View style={[styles.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5 }}>
            Profile
          </Text>
          <Text style={{ fontSize: 13, color: C.text3, marginTop: 4, fontWeight: '500' }}>
            Your nutrition goals & stats
          </Text>
        </View>

        {/* ── Streak Card ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: C.glassBorder,
            }}
          >
            <BlurView intensity={15} tint="dark">
              <LinearGradient
                colors={['rgba(34,197,94,0.10)', 'rgba(34,197,94,0.03)', 'rgba(0,0,0,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={{ padding: 22 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          backgroundColor: 'rgba(34,197,94,0.12)',
                          borderWidth: 1,
                          borderColor: 'rgba(34,197,94,0.25)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialCommunityIcons name="fire" size={26} color={C.success} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 1.5 }}>
                          CURRENT STREAK
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                          <Text style={{ fontSize: 36, fontWeight: '800', color: C.white, letterSpacing: -1 }}>
                            {streak.currentStreak}
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: C.text3 }}>
                            {streak.currentStreak === 1 ? 'day' : 'days'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Best streak badge */}
                    <View
                      style={{
                        backgroundColor: 'rgba(245,158,11,0.12)',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: 'rgba(245,158,11,0.20)',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '600', color: C.text3, letterSpacing: 0.5 }}>BEST</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: C.carbs, marginTop: 2 }}>
                        {streak.bestStreak}
                      </Text>
                    </View>
                  </View>

                  {/* Week dots */}
                  <WeekDots activity={weekActivity} />

                  {/* Logged today badge */}
                  <View style={{ alignItems: 'center', marginTop: 14 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: streak.loggedToday ? 'rgba(34,197,94,0.12)' : 'rgba(255,82,82,0.10)',
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={streak.loggedToday ? 'check-circle' : 'alert-circle-outline'}
                        size={14}
                        color={streak.loggedToday ? C.success : C.accent}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: streak.loggedToday ? C.success : C.accent,
                        }}
                      >
                        {streak.loggedToday ? 'Logged today ✓' : 'Not logged yet today'}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* ── Stat Cards Row ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              icon="food"
              label="Meals Logged"
              value={String(mealsLogged)}
              sub="All time"
              color={C.accent}
              delay={100}
            />
            <StatCard
              icon="fire"
              label="Current"
              value={`${streak.currentStreak}d`}
              sub={streak.loggedToday ? 'Active' : 'Log a meal!'}
              color={C.success}
              delay={200}
            />
            <StatCard
              icon="trophy"
              label="Best Streak"
              value={`${streak.bestStreak}d`}
              sub="Record"
              color={C.carbs}
              delay={300}
            />
          </View>
        </View>

        {/* ── Daily Goals ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 2 }}>
              DAILY GOALS
            </Text>
            <TouchableOpacity
              onPress={() => setShowEditor(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(255,82,82,0.10)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,82,82,0.20)',
                }}
              >
                <MaterialCommunityIcons name="pencil" size={14} color={C.accent} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.accent }}>Edit</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8 }}>
            <GoalRow icon="fire" label="Calories" value={goals.calories} unit="kcal" color={C.accent} />
            <GoalRow icon="arm-flex" label="Protein" value={goals.protein} unit="g" color={C.protein} />
            <GoalRow icon="barley" label="Carbs" value={goals.carbs} unit="g" color={C.carbs} />
            <GoalRow icon="water" label="Fat" value={goals.fat} unit="g" color={C.fat} />
          </View>
        </View>

        {/* ── Macro Split Visualization ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 2, marginBottom: 14 }}>
            MACRO SPLIT
          </Text>
          <View
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: C.glassBorder,
            }}
          >
            <BlurView intensity={12} tint="dark">
              <View style={{ padding: 20, backgroundColor: C.glass }}>
                {/* Bar */}
                <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                  {(() => {
                    const totalGrams = goals.protein + goals.carbs + goals.fat;
                    const pPct = totalGrams > 0 ? (goals.protein / totalGrams) * 100 : 33;
                    const cPct = totalGrams > 0 ? (goals.carbs / totalGrams) * 100 : 34;
                    const fPct = totalGrams > 0 ? (goals.fat / totalGrams) * 100 : 33;
                    return (
                      <>
                        <LinearGradient
                          colors={[C.protein, C.proteinEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: `${pPct}%` as any, height: '100%' }}
                        />
                        <LinearGradient
                          colors={[C.carbs, C.carbsEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: `${cPct}%` as any, height: '100%' }}
                        />
                        <LinearGradient
                          colors={[C.fat, C.fatEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: `${fPct}%` as any, height: '100%' }}
                        />
                      </>
                    );
                  })()}
                </View>

                {/* Legend */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  {[
                    { label: 'Protein', g: goals.protein, cal: goals.protein * 4, color: C.protein },
                    { label: 'Carbs', g: goals.carbs, cal: goals.carbs * 4, color: C.carbs },
                    { label: 'Fat', g: goals.fat, cal: goals.fat * 9, color: C.fat },
                  ].map((m) => {
                    const totalGrams = goals.protein + goals.carbs + goals.fat;
                    const pct = totalGrams > 0 ? Math.round((m.g / totalGrams) * 100) : 33;
                    return (
                      <View key={m.label} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.color }} />
                          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text2 }}>{m.label}</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: C.white }}>{pct}%</Text>
                        <Text style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
                          {m.g}g · {m.cal} kcal
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </BlurView>
          </View>
        </View>

        {/* ── App Info ── */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: C.text4, fontWeight: '500' }}>CalAI v1.0.0</Text>
          <Text style={{ fontSize: 11, color: C.text4, marginTop: 6 }}>Made with ❤️ for your health</Text>
        </View>
      </ScrollView>

      {/* ── Edit Goals Modal ── */}
      <EditGoalsModal
        visible={showEditor}
        goals={goals}
        onSave={handleSaveGoals}
        onClose={() => setShowEditor(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
