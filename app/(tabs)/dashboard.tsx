import React, { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#000000',
  surface: '#0D0D0D',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  accent: '#FF5252',
  accentSoft: 'rgba(255, 82, 82, 0.12)',
  protein: '#6366F1',     // Indigo
  proteinGlow: 'rgba(99,102,241,0.25)',
  carbs: '#F59E0B',       // Amber
  carbsGlow: 'rgba(245,158,11,0.25)',
  fat: '#EC4899',         // Pink
  fatGlow: 'rgba(236,72,153,0.25)',
  streak: '#F97316',      // Orange
  streakGlow: 'rgba(249,115,22,0.20)',
  success: '#22C55E',
  white: '#FFFFFF',
  gray100: 'rgba(255,255,255,0.87)',
  gray200: 'rgba(255,255,255,0.60)',
  gray300: 'rgba(255,255,255,0.38)',
  gray400: 'rgba(255,255,255,0.20)',
  gray500: 'rgba(255,255,255,0.08)',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK = {
  userName: 'Alex',
  calories: { current: 1847, goal: 2500 },
  protein: { current: 124, goal: 150, unit: 'g' },
  carbs: { current: 198, goal: 280, unit: 'g' },
  fat: { current: 58, goal: 85, unit: 'g' },
  streak: { current: 14, best: 21 },
  weekActivity: [true, true, true, false, true, true, true], // Mon–Sun
  meals: [
    {
      id: '1',
      name: 'Grilled Salmon Bowl',
      emoji: '🍣',
      calories: 520,
      protein: 42,
      carbs: 38,
      fat: 22,
      time: '12:30 PM',
      timeAgo: '1h ago',
    },
    {
      id: '2',
      name: 'Greek Yogurt Parfait',
      emoji: '🥣',
      calories: 310,
      protein: 28,
      carbs: 34,
      fat: 8,
      time: '9:15 AM',
      timeAgo: '4h ago',
    },
    {
      id: '3',
      name: 'Protein Smoothie',
      emoji: '🥤',
      calories: 280,
      protein: 32,
      carbs: 24,
      fat: 6,
      time: '7:45 AM',
      timeAgo: '6h ago',
    },
    {
      id: '4',
      name: 'Chicken Caesar Wrap',
      emoji: '🌯',
      calories: 420,
      protein: 36,
      carbs: 32,
      fat: 16,
      time: 'Yesterday',
      timeAgo: 'Yesterday',
    },
    {
      id: '5',
      name: 'Overnight Oats',
      emoji: '🥣',
      calories: 317,
      protein: 14,
      carbs: 48,
      fat: 9,
      time: 'Yesterday',
      timeAgo: 'Yesterday',
    },
  ],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

// ─── Animated Calorie Ring ────────────────────────────────────────────────────

interface CalorieRingProps {
  current: number;
  goal: number;
}

const RING_SIZE = 200;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CalorieRing({ current, goal }: CalorieRingProps) {
  const progress = Math.min(current / goal, 1);
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B6B" />
              <Stop offset="50%" stopColor="#FF5252" />
              <Stop offset="100%" stopColor="#E84393" />
            </SvgLinearGradient>
          </Defs>

          {/* Track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={COLORS.gray500}
            strokeWidth={RING_STROKE}
            fill="none"
          />

          {/* Progress */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="url(#calorieGrad)"
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        {/* Center Label */}
        <View className="absolute inset-0 items-center justify-center">
          <Text
            style={{
              fontSize: 44,
              fontWeight: '800',
              color: COLORS.white,
              letterSpacing: -1.5,
            }}
          >
            {formatNum(current)}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: COLORS.gray300,
              letterSpacing: 1.5,
              marginTop: 2,
            }}
          >
            KCAL
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Macro Progress Ring ──────────────────────────────────────────────────────

interface MacroRingProps {
  current: number;
  goal: number;
  label: string;
  unit: string;
  color: string;
  glowColor: string;
  gradientEnd: string;
  delay?: number;
}

const MACRO_SIZE = 90;
const MACRO_STROKE = 7;
const MACRO_RADIUS = (MACRO_SIZE - MACRO_STROKE) / 2;
const MACRO_CIRCUMFERENCE = 2 * Math.PI * MACRO_RADIUS;

function MacroProgressRing({
  current,
  goal,
  label,
  unit,
  color,
  glowColor,
  gradientEnd,
  delay = 0,
}: MacroRingProps) {
  const progress = Math.min(current / goal, 1);
  const dashOffset = MACRO_CIRCUMFERENCE * (1 - progress);
  const percentage = Math.round(progress * 100);
  const gradientId = `macro_${label}`;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: translateAnim }],
        alignItems: 'center',
        flex: 1,
      }}
    >
      {/* Glow effect */}
      <View
        style={{
          position: 'absolute',
          top: 8,
          width: MACRO_SIZE - 10,
          height: MACRO_SIZE - 10,
          borderRadius: (MACRO_SIZE - 10) / 2,
          backgroundColor: glowColor,
          ...(Platform.OS === 'ios' ? {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
          } : { elevation: 8 }),
        }}
      />

      <View style={{ width: MACRO_SIZE, height: MACRO_SIZE }}>
        <Svg width={MACRO_SIZE} height={MACRO_SIZE}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={gradientEnd} />
            </SvgLinearGradient>
          </Defs>

          <Circle
            cx={MACRO_SIZE / 2}
            cy={MACRO_SIZE / 2}
            r={MACRO_RADIUS}
            stroke={COLORS.gray500}
            strokeWidth={MACRO_STROKE}
            fill="none"
          />
          <Circle
            cx={MACRO_SIZE / 2}
            cy={MACRO_SIZE / 2}
            r={MACRO_RADIUS}
            stroke={`url(#${gradientId})`}
            strokeWidth={MACRO_STROKE}
            fill="none"
            strokeDasharray={MACRO_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${MACRO_SIZE / 2}, ${MACRO_SIZE / 2}`}
          />
        </Svg>

        <View className="absolute inset-0 items-center justify-center">
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
            {current}
          </Text>
          <Text style={{ fontSize: 10, color: COLORS.gray300, marginTop: -1 }}>
            {unit}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: COLORS.gray200,
          marginTop: 8,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: COLORS.gray300, marginTop: 2 }}>
        {percentage}% of {goal}{unit}
      </Text>
    </Animated.View>
  );
}

// ─── Streak Card ──────────────────────────────────────────────────────────────

interface StreakCardProps {
  streak: number;
  best: number;
  weekActivity: boolean[];
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function StreakCard({ streak, best, weekActivity }: StreakCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
        }}
      >
        <BlurView intensity={20} tint="dark">
          <LinearGradient
            colors={[
              'rgba(249, 115, 22, 0.12)',
              'rgba(249, 115, 22, 0.03)',
              'rgba(0,0,0,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ padding: 20 }}>
              {/* Top row */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center" style={{ gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: COLORS.streakGlow,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: 'rgba(249,115,22,0.35)',
                    }}
                  >
                    <Text style={{ fontSize: 26 }}>🔥</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, color: COLORS.gray300, fontWeight: '500' }}>
                      Current Streak
                    </Text>
                    <View className="flex-row items-baseline" style={{ gap: 4 }}>
                      <Text
                        style={{
                          fontSize: 32,
                          fontWeight: '800',
                          color: COLORS.white,
                          letterSpacing: -0.5,
                        }}
                      >
                        {streak}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: COLORS.gray300,
                        }}
                      >
                        days
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: COLORS.gray300, fontWeight: '500' }}>
                    BEST
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.streak }}>
                    {best}
                  </Text>
                </View>
              </View>

              {/* Week dots */}
              <View
                className="flex-row justify-between"
                style={{
                  backgroundColor: COLORS.gray500,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                {weekActivity.map((active, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, color: COLORS.gray300, fontWeight: '600' }}>
                      {DAYS[i]}
                    </Text>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: active ? COLORS.streak : 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(active && Platform.OS === 'ios'
                          ? {
                              shadowColor: COLORS.streak,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.5,
                              shadowRadius: 8,
                            }
                          : {}),
                      }}
                    >
                      {active && (
                        <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Meal Item ────────────────────────────────────────────────────────────────

interface MealItemProps {
  emoji: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timeAgo: string;
  index: number;
}

function MealItem({ emoji, name, calories, protein, carbs, fat, timeAgo, index }: MealItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 600 + index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 600 + index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.7}>
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            marginBottom: 10,
          }}
        >
          <BlurView intensity={12} tint="dark">
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={{ padding: 16 }}>
                <View className="flex-row items-center justify-between">
                  {/* Left side */}
                  <View className="flex-row items-center flex-1" style={{ gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: COLORS.gray500,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: COLORS.white,
                          marginBottom: 3,
                        }}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.gray300 }}>
                        {timeAgo}
                      </Text>
                    </View>
                  </View>

                  {/* Right side – Calories */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: COLORS.accent,
                      }}
                    >
                      {calories}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.gray300 }}>kcal</Text>
                  </View>
                </View>

                {/* Macro pills */}
                <View className="flex-row" style={{ gap: 8, marginTop: 12 }}>
                  <MacroPill label="P" value={protein} color={COLORS.protein} />
                  <MacroPill label="C" value={carbs} color={COLORS.carbs} />
                  <MacroPill label="F" value={fat} color={COLORS.fat} />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: `${color}15`,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
      <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.gray200 }}>
        {label} {value}g
      </Text>
    </View>
  );
}

// ─── Quick Stats Row ──────────────────────────────────────────────────────────

interface QuickStatProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function QuickStat({ icon, label, value, color }: QuickStatProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.gray500,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
      }}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: COLORS.gray300, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  const { calories, protein, carbs, fat, streak, weekActivity, meals, userName } = MOCK;
  const remaining = Math.max(calories.goal - calories.current, 0);
  const burned = 340; // mock exercise burn

  // Pulsing FAB animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ───── Header ───── */}
        <View style={{ paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 8 }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text style={{ fontSize: 14, color: COLORS.gray300, fontWeight: '500' }}>
                {getGreeting()} 👋
              </Text>
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: '800',
                  color: COLORS.white,
                  marginTop: 2,
                  letterSpacing: -0.5,
                }}
              >
                {userName}
              </Text>
            </View>
            <View className="flex-row" style={{ gap: 10 }}>
              <TouchableOpacity
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: COLORS.gray500,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                }}
              >
                <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.gray200} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: COLORS.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,82,82,0.25)',
                }}
              >
                <MaterialCommunityIcons name="account" size={22} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ───── Main Calorie Card ───── */}
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <View
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
            }}
          >
            <BlurView intensity={25} tint="dark">
              <LinearGradient
                colors={[
                  'rgba(255, 82, 82, 0.10)',
                  'rgba(139, 92, 246, 0.04)',
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={{ padding: 28, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: COLORS.gray300,
                      letterSpacing: 2,
                      marginBottom: 20,
                    }}
                  >
                    TODAY'S INTAKE
                  </Text>

                  <CalorieRing current={calories.current} goal={calories.goal} />

                  {/* Stats row under ring */}
                  <View
                    className="flex-row"
                    style={{
                      gap: 10,
                      marginTop: 24,
                      width: '100%',
                    }}
                  >
                    <QuickStat
                      icon="flag-checkered"
                      label="Goal"
                      value={`${formatNum(calories.goal)}`}
                      color={COLORS.success}
                    />
                    <QuickStat
                      icon="silverware-fork-knife"
                      label="Remaining"
                      value={`${formatNum(remaining)}`}
                      color={COLORS.carbs}
                    />
                    <QuickStat
                      icon="fire"
                      label="Burned"
                      value={`${burned}`}
                      color={COLORS.accent}
                    />
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* ───── Macronutrient Rings ───── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: COLORS.gray300,
              letterSpacing: 2,
              marginBottom: 18,
            }}
          >
            MACRONUTRIENTS
          </Text>

          <View
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
            }}
          >
            <BlurView intensity={15} tint="dark">
              <View
                className="flex-row justify-around"
                style={{ paddingVertical: 24, paddingHorizontal: 12 }}
              >
                <MacroProgressRing
                  current={protein.current}
                  goal={protein.goal}
                  label="Protein"
                  unit="g"
                  color={COLORS.protein}
                  glowColor={COLORS.proteinGlow}
                  gradientEnd="#818CF8"
                  delay={100}
                />
                <MacroProgressRing
                  current={carbs.current}
                  goal={carbs.goal}
                  label="Carbs"
                  unit="g"
                  color={COLORS.carbs}
                  glowColor={COLORS.carbsGlow}
                  gradientEnd="#FBBF24"
                  delay={200}
                />
                <MacroProgressRing
                  current={fat.current}
                  goal={fat.goal}
                  label="Fat"
                  unit="g"
                  color={COLORS.fat}
                  glowColor={COLORS.fatGlow}
                  gradientEnd="#F472B6"
                  delay={300}
                />
              </View>
            </BlurView>
          </View>
        </View>

        {/* ───── Streak Card ───── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: COLORS.gray300,
              letterSpacing: 2,
              marginBottom: 18,
            }}
          >
            YOUR STREAK
          </Text>

          <StreakCard
            streak={streak.current}
            best={streak.best}
            weekActivity={weekActivity}
          />
        </View>

        {/* ───── Recent Meals ───── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: COLORS.gray300,
                letterSpacing: 2,
              }}
            >
              RECENT MEALS
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/diary')}
              className="flex-row items-center"
              style={{ gap: 4 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.accent }}>
                View All
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {meals.map((meal, index) => (
            <MealItem
              key={meal.id}
              emoji={meal.emoji}
              name={meal.name}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              timeAgo={meal.timeAgo}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      {/* ───── Floating Action Button ───── */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 96 : 80,
          right: 24,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/camera')}
          activeOpacity={0.85}
          style={{
            ...(Platform.OS === 'ios'
              ? {
                  shadowColor: COLORS.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                }
              : { elevation: 12 }),
          }}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF5252', '#E84393']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="camera-plus" size={26} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
