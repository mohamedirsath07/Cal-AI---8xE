import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { saveMeal } from '../lib/storage';
import { loadGoals, DEFAULT_GOALS } from '../lib/goals';
import type { NutritionGoals } from '../lib/goals';
import type { Meal, Food } from '../types';
import dayjs from 'dayjs';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#000000',
  surface: '#0D0D0D',
  accent: '#FF5252',
  accentEnd: '#E84393',
  protein: '#6366F1',
  proteinEnd: '#818CF8',
  carbs: '#F59E0B',
  carbsEnd: '#FBBF24',
  fat: '#EC4899',
  fatEnd: '#F472B6',
  success: '#22C55E',
  successEnd: '#4ADE80',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.10)',
  text1: 'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.60)',
  text3: 'rgba(255,255,255,0.35)',
  ring: 'rgba(255,255,255,0.06)',
};

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const isHigh = pct >= 80;
  const isMed = pct >= 50;
  const color = isHigh ? C.success : isMed ? C.carbs : C.accent;
  const label = isHigh ? 'High' : isMed ? 'Medium' : 'Low';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: `${color}18`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${color}30`,
      }}
    >
      <MaterialCommunityIcons
        name={isHigh ? 'check-decagram' : 'alert-circle'}
        size={14}
        color={color}
      />
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>
        {pct}% {label}
      </Text>
    </View>
  );
}

// ─── Macro Ring Card ──────────────────────────────────────────────────────────

interface MacroRingCardProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  colorEnd: string;
  icon: string;
  dailyTarget: number;
  delay: number;
}

const RING_SZ = 72;
const RING_SW = 6;
const RING_R = (RING_SZ - RING_SW) / 2;
const RING_C = 2 * Math.PI * RING_R;

function MacroRingCard({
  label,
  value,
  unit,
  color,
  colorEnd,
  icon,
  dailyTarget,
  delay,
}: MacroRingCardProps) {
  const pct = Math.min(value / dailyTarget, 1);
  const offset = RING_C * (1 - pct);
  const gradId = `grad_${label}`;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: C.glassBorder,
        }}
      >
        <BlurView intensity={15} tint="dark">
          <View
            style={{
              padding: 16,
              alignItems: 'center',
              backgroundColor: C.glass,
            }}
          >
            {/* Ring */}
            <View style={{ width: RING_SZ, height: RING_SZ, marginBottom: 10 }}>
              <Svg width={RING_SZ} height={RING_SZ}>
                <Defs>
                  <SvgLinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={color} />
                    <Stop offset="100%" stopColor={colorEnd} />
                  </SvgLinearGradient>
                </Defs>
                <Circle
                  cx={RING_SZ / 2}
                  cy={RING_SZ / 2}
                  r={RING_R}
                  stroke={C.ring}
                  strokeWidth={RING_SW}
                  fill="none"
                />
                <Circle
                  cx={RING_SZ / 2}
                  cy={RING_SZ / 2}
                  r={RING_R}
                  stroke={`url(#${gradId})`}
                  strokeWidth={RING_SW}
                  fill="none"
                  strokeDasharray={RING_C}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  rotation={-90}
                  origin={`${RING_SZ / 2}, ${RING_SZ / 2}`}
                />
              </Svg>
              <View style={[StyleSheet.absoluteFillObject, styles.center]}>
                <MaterialCommunityIcons name={icon as any} size={20} color={color} />
              </View>
            </View>

            {/* Value */}
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.white }}>
              {value}
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.text3 }}>
                {unit}
              </Text>
            </Text>

            {/* Label */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: C.text2,
                marginTop: 4,
              }}
            >
              {label}
            </Text>

            {/* % of daily */}
            <Text style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
              {Math.round(pct * 100)}% daily
            </Text>
          </View>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Nutrition Detail Row ─────────────────────────────────────────────────────

function NutritionRow({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
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
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: `${color}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '500', color: C.text1 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: C.white }}>
        {value}
        <Text style={{ fontSize: 13, fontWeight: '500', color: C.text3 }}> {unit}</Text>
      </Text>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  RESULT SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    imageUri?: string;
    food_name?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    confidence?: string;
  }>();

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [targets, setTargets] = useState<NutritionGoals>(DEFAULT_GOALS);

  // Parse params safely
  const imageUri = params.imageUri ?? '';
  const foodName = params.food_name ?? 'Unknown Food';
  const calories = Number(params.calories) || 0;
  const protein = Number(params.protein) || 0;
  const carbs = Number(params.carbs) || 0;
  const fat = Number(params.fat) || 0;
  const confidence = Number(params.confidence) || 0;

  // Load user's daily targets from storage
  useEffect(() => {
    loadGoals().then(setTargets).catch(() => {});
  }, []);

  // ── Animations ──
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const imageFade = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1.1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;

  // Saved checkmark scale
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      // Image
      Animated.parallel([
        Animated.timing(imageFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(imageScale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      // Header
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      // Content
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      // Buttons
      Animated.parallel([
        Animated.timing(btnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // ── Save Meal ──
  const handleSaveMeal = async () => {
    if (isSaved || isSaving) return;

    setIsSaving(true);
    try {
      const food: Food = {
        id: `food_${Date.now()}`,
        name: foodName,
        calories,
        protein,
        carbs,
        fat,
        fiber: 0,
        ingredients: [],
        timestamp: new Date(),
        image: imageUri || undefined,
        confidence,
      };

      const meal: Meal = {
        id: `meal_${Date.now()}`,
        name: foodName,
        time: dayjs().format('HH:mm'),
        foods: [food],
        totalCalories: calories,
      };

      const success = await saveMeal(meal);

      if (success) {
        setIsSaved(true);
        // Play checkmark animation
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }).start();

        // Navigate back to dashboard after a brief moment
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1600);
      } else {
        Alert.alert('Error', 'Failed to save meal. Please try again.');
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Something went wrong while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Retake ──
  const handleRetake = () => {
    router.back();
  };

  return (
    <View style={[styles.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Saved Overlay ── */}
      {isSaved && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.center,
            { backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100 },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: checkScale }],
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(34,197,94,0.15)',
                borderWidth: 2,
                borderColor: 'rgba(34,197,94,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                ...(Platform.OS === 'ios'
                  ? {
                      shadowColor: C.success,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 24,
                    }
                  : { elevation: 12 }),
              }}
            >
              <MaterialCommunityIcons name="check" size={48} color={C.success} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 6 }}>
              Meal Saved!
            </Text>
            <Text style={{ fontSize: 14, color: C.text2 }}>
              Added to your diary
            </Text>
          </Animated.View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
      >
        {/* ── Hero Image ── */}
        <Animated.View
          style={{
            opacity: imageFade,
            transform: [{ scale: imageScale }],
          }}
        >
          <View style={{ height: SCREEN_W * 0.75, overflow: 'hidden' }}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.flex1,
                  styles.center,
                  { backgroundColor: '#111' },
                ]}
              >
                <MaterialCommunityIcons name="food" size={64} color={C.text3} />
              </View>
            )}

            {/* Gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)', C.bg]}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '55%',
              }}
            />

            {/* Top gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 120,
              }}
            />
          </View>
        </Animated.View>

        {/* ── Back Button (absolute) ── */}
        <TouchableOpacity
          onPress={handleRetake}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 56 : 40,
            left: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <BlurView
            intensity={40}
            tint="dark"
            style={[
              styles.flex1,
              styles.center,
              {
                borderWidth: 1,
                borderColor: C.glassBorder,
                borderRadius: 22,
                backgroundColor: C.glass,
              },
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.white} />
          </BlurView>
        </TouchableOpacity>

        {/* ── AI Badge (absolute) ── */}
        <View
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 58 : 42,
            right: 20,
            zIndex: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255,82,82,0.15)',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,82,82,0.25)',
            }}
          >
            <MaterialCommunityIcons name="brain" size={14} color={C.accent} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>
              AI Analysis
            </Text>
          </View>
        </View>

        {/* ── Food Name + Confidence ── */}
        <Animated.View
          style={{
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
            paddingHorizontal: 24,
            marginTop: -28,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: C.white,
              letterSpacing: -0.5,
              marginBottom: 10,
            }}
            numberOfLines={2}
          >
            {foodName}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ConfidenceBadge confidence={confidence} />
            <Text style={{ fontSize: 12, color: C.text3 }}>
              Analyzed just now
            </Text>
          </View>
        </Animated.View>

        {/* ── Calorie Hero Card ── */}
        <Animated.View
          style={{
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
            paddingHorizontal: 24,
            marginTop: 24,
          }}
        >
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
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 22,
                    gap: 20,
                  }}
                >
                  {/* Calorie ring */}
                  <View style={{ width: 80, height: 80 }}>
                    <Svg width={80} height={80}>
                      <Defs>
                        <SvgLinearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#FF6B6B" />
                          <Stop offset="100%" stopColor="#E84393" />
                        </SvgLinearGradient>
                      </Defs>
                      <Circle
                        cx={40}
                        cy={40}
                        r={33}
                        stroke={C.ring}
                        strokeWidth={7}
                        fill="none"
                      />
                      <Circle
                        cx={40}
                        cy={40}
                        r={33}
                        stroke="url(#calGrad)"
                        strokeWidth={7}
                        fill="none"
                        strokeDasharray={2 * Math.PI * 33}
                        strokeDashoffset={
                          2 * Math.PI * 33 * (1 - Math.min(calories / targets.calories, 1))
                        }
                        strokeLinecap="round"
                        rotation={-90}
                        origin="40, 40"
                      />
                    </Svg>
                    <View style={[StyleSheet.absoluteFillObject, styles.center]}>
                      <MaterialCommunityIcons name="fire" size={22} color={C.accent} />
                    </View>
                  </View>

                  {/* Calorie text */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 1.5 }}>
                      CALORIES
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                      <Text
                        style={{
                          fontSize: 42,
                          fontWeight: '800',
                          color: C.white,
                          letterSpacing: -1.5,
                        }}
                      >
                        {calories}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: C.text3 }}>
                        kcal
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>
                      {Math.round((calories / targets.calories) * 100)}% of daily goal
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* ── Macro Rings Row ── */}
        <Animated.View
          style={{
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
            paddingHorizontal: 24,
            marginTop: 18,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <MacroRingCard
              label="Protein"
              value={protein}
              unit="g"
              color={C.protein}
              colorEnd={C.proteinEnd}
              icon="arm-flex"
              dailyTarget={targets.protein}
              delay={300}
            />
            <MacroRingCard
              label="Carbs"
              value={carbs}
              unit="g"
              color={C.carbs}
              colorEnd={C.carbsEnd}
              icon="barley"
              dailyTarget={targets.carbs}
              delay={420}
            />
            <MacroRingCard
              label="Fat"
              value={fat}
              unit="g"
              color={C.fat}
              colorEnd={C.fatEnd}
              icon="water"
              dailyTarget={targets.fat}
              delay={540}
            />
          </View>
        </Animated.View>

        {/* ── Nutrition Breakdown ── */}
        <Animated.View
          style={{
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
            paddingHorizontal: 24,
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: C.text3,
              letterSpacing: 2,
              marginBottom: 14,
            }}
          >
            NUTRITION BREAKDOWN
          </Text>

          <View style={{ gap: 8 }}>
            <NutritionRow
              icon="fire"
              label="Calories"
              value={String(calories)}
              unit="kcal"
              color={C.accent}
            />
            <NutritionRow
              icon="arm-flex"
              label="Protein"
              value={String(protein)}
              unit="g"
              color={C.protein}
            />
            <NutritionRow
              icon="barley"
              label="Carbohydrates"
              value={String(carbs)}
              unit="g"
              color={C.carbs}
            />
            <NutritionRow
              icon="water"
              label="Fat"
              value={String(fat)}
              unit="g"
              color={C.fat}
            />
          </View>
        </Animated.View>

        {/* ── Action Buttons ── */}
        <Animated.View
          style={{
            opacity: btnFade,
            transform: [{ translateY: btnSlide }],
            paddingHorizontal: 24,
            marginTop: 28,
          }}
        >
          {/* Save Meal */}
          <TouchableOpacity
            onPress={handleSaveMeal}
            disabled={isSaving || isSaved}
            activeOpacity={0.85}
          >
            <View
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                ...(Platform.OS === 'ios'
                  ? {
                      shadowColor: C.success,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                    }
                  : { elevation: 10 }),
              }}
            >
              <LinearGradient
                colors={
                  isSaved
                    ? [C.success, C.successEnd]
                    : isSaving
                    ? ['#333', '#222']
                    : [C.success, '#16A34A']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <MaterialCommunityIcons
                  name={isSaved ? 'check-circle' : 'content-save'}
                  size={22}
                  color={C.white}
                />
                <Text style={{ fontSize: 17, fontWeight: '700', color: C.white }}>
                  {isSaved ? 'Saved!' : isSaving ? 'Saving…' : 'Save Meal'}
                </Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* Retake Photo */}
          <TouchableOpacity
            onPress={handleRetake}
            activeOpacity={0.7}
            style={{ marginTop: 12 }}
          >
            <View
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.glassBorder,
              }}
            >
              <BlurView intensity={20} tint="dark">
                <View
                  style={{
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    backgroundColor: C.glass,
                  }}
                >
                  <MaterialCommunityIcons name="camera-retake" size={20} color={C.accent} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: C.text1 }}>
                    Retake Photo
                  </Text>
                </View>
              </BlurView>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
