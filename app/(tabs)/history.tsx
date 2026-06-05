import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryLine,
} from 'victory-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { getWeeklyStats } from '../../lib/storage';
import { loadGoals } from '../../lib/goals';
import dayjs from 'dayjs';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 48;
const CHART_H = 260;

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#000000',
  accent: '#FF5252',
  accentEnd: '#E84393',
  success: '#22C55E',
  warning: '#F59E0B',
  protein: '#6366F1',
  carbs: '#F59E0B',
  fat: '#EC4899',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text1: 'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.60)',
  text3: 'rgba(255,255,255,0.35)',
};

const DEFAULT_CALORIE_GOAL = 2500;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  dayLabel: string;       // Mon, Tue, …
  dateLabel: string;      // Jun 2
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  index: number;          // 1-based for Victory
}

// ─── Mock Data (used when storage is empty) ───────────────────────────────────

function generateMockData(): DayData[] {
  const mockCalories = [2120, 1890, 2340, 2050, 2480, 1760, 2210];
  const mockProtein  = [130,  110,  145,  125,  140,  95,   135];
  const mockCarbs    = [245,  220,  270,  235,  285,  200,  250];
  const mockFat      = [72,   65,   80,   68,   85,   58,   75];

  return Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayLabel: dayNames[date.day()],
      dateLabel: date.format('MMM D'),
      calories: mockCalories[i],
      protein: mockProtein[i],
      carbs: mockCarbs[i],
      fat: mockFat[i],
      index: i + 1,
    };
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, sub, color, delay }: StatCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: C.glassBorder,
        }}
      >
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.white }}>{value}</Text>
            <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{label}</Text>
            <Text style={{ fontSize: 10, color, marginTop: 4, fontWeight: '600' }}>{sub}</Text>
          </View>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Day Breakdown Row ────────────────────────────────────────────────────────

function DayRow({ data, isHighest, isLowest }: { data: DayData; isHighest: boolean; isLowest: boolean }) {
  const pct = calorieGoal > 0 ? Math.min(data.calories / calorieGoal, 1) : 0;
  const overGoal = data.calories > calorieGoal;

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isHighest || isLowest ? `${isHighest ? C.warning : C.success}25` : C.glassBorder,
        marginBottom: 8,
      }}
    >
      <BlurView intensity={10} tint="dark">
        <View style={{ padding: 14, backgroundColor: C.glass }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left: Day + date */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: 90 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.text1, width: 32 }}>
                {data.dayLabel}
              </Text>
              <Text style={{ fontSize: 11, color: C.text3 }}>{data.dateLabel}</Text>
            </View>

            {/* Center: Progress bar */}
            <View style={{ flex: 1, marginHorizontal: 14 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={overGoal ? [C.warning, '#EAB308'] : [C.accent, C.accentEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    width: `${Math.round(pct * 100)}%`,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>

            {/* Right: Calories + badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.white }}>
                  {data.calories.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 10, color: C.text3 }}>
                  {Math.round(pct * 100)}%
                </Text>
              </View>
              {(isHighest || isLowest) && (
                <View
                  style={{
                    backgroundColor: isHighest ? `${C.warning}18` : `${C.success}18`,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name={isHighest ? 'arrow-up-bold' : 'arrow-down-bold'}
                    size={12}
                    color={isHighest ? C.warning : C.success}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  HISTORY SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function History() {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(DEFAULT_CALORIE_GOAL);

  // ── Load Data ──
  const loadData = useCallback(async () => {
    try {
      const g = await loadGoals();
      setCalorieGoal(g.calories);
      const stats = await getWeeklyStats();

      // Check if storage has any real data
      const hasData = stats.length > 0 && stats.some((s) => s.calories > 0);

      if (hasData) {
        const days: DayData[] = stats.map((s, i) => {
          const date = dayjs().subtract(6 - i, 'day');
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return {
            dayLabel: dayNames[date.day()],
            dateLabel: date.format('MMM D'),
            calories: s.calories,
            protein: s.protein,
            carbs: s.carbs,
            fat: s.fat,
            index: i + 1,
          };
        });
        setWeekData(days);
        setUsingMock(false);
      } else {
        setWeekData(generateMockData());
        setUsingMock(true);
      }
    } catch (err) {
      console.error('History load error:', err);
      setWeekData(generateMockData());
      setUsingMock(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Computed Stats ──
  const { average, highest, lowest, total, highIdx, lowIdx } = useMemo(() => {
    if (weekData.length === 0) {
      return { average: 0, highest: 0, lowest: 0, total: 0, highIdx: -1, lowIdx: -1 };
    }
    const cals = weekData.map((d) => d.calories);
    const sum = cals.reduce((a, b) => a + b, 0);
    const max = Math.max(...cals);
    const min = Math.min(...cals);
    return {
      average: Math.round(sum / cals.length),
      highest: max,
      lowest: min,
      total: sum,
      highIdx: cals.indexOf(max),
      lowIdx: cals.indexOf(min),
    };
  }, [weekData]);

  // Chart data for Victory
  const chartData = weekData.map((d) => ({ x: d.index, y: d.calories, label: d.dayLabel }));
  const goalLineData = weekData.map((d) => ({ x: d.index, y: calorieGoal }));
  const yMax = Math.max(highest, calorieGoal) + 300;

  // Macro averages
  const avgProtein = weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.protein, 0) / weekData.length) : 0;
  const avgCarbs = weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.carbs, 0) / weekData.length) : 0;
  const avgFat = weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.fat, 0) / weekData.length) : 0;

  // Trend: compare first half vs second half
  const firstHalf = weekData.slice(0, 3).reduce((s, d) => s + d.calories, 0) / 3;
  const secondHalf = weekData.slice(4).reduce((s, d) => s + d.calories, 0) / Math.max(weekData.slice(4).length, 1);
  const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;
  const trendUp = trendPct >= 0;

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
          <Text style={{ fontSize: 14, color: C.text3, fontWeight: '500' }}>Your Progress</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5, marginTop: 4 }}>
            History
          </Text>
        </View>

        {/* Mock data badge */}
        {usingMock && (
          <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(245,158,11,0.10)',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.20)',
              }}
            >
              <MaterialCommunityIcons name="information" size={16} color={C.warning} />
              <Text style={{ fontSize: 12, fontWeight: '500', color: C.warning }}>
                Showing sample data — log meals to see your stats
              </Text>
            </View>
          </View>
        )}

        {/* ── Chart Card ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
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
                colors={['rgba(255,82,82,0.08)', 'rgba(232,67,147,0.03)', 'rgba(0,0,0,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={{ padding: 20 }}>
                  {/* Chart header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 1.5 }}>
                        WEEKLY CALORIES
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                        <Text style={{ fontSize: 32, fontWeight: '800', color: C.white, letterSpacing: -1 }}>
                          {total.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: C.text3 }}>kcal</Text>
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: trendUp ? 'rgba(34,197,94,0.12)' : 'rgba(255,82,82,0.12)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={trendUp ? 'trending-up' : 'trending-down'}
                        size={16}
                        color={trendUp ? C.success : C.accent}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: trendUp ? C.success : C.accent,
                        }}
                      >
                        {trendUp ? '+' : ''}{trendPct}%
                      </Text>
                    </View>
                  </View>

                  {/* Victory Bar Chart */}
                  <View style={{ marginHorizontal: -8, marginTop: 8 }}>
                    <Svg width={CHART_W} height={CHART_H}>
                      {/* Gradient def for bars */}
                      <Defs>
                        <SvgLinearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <Stop offset="0%" stopColor="#FF6B6B" stopOpacity={1} />
                          <Stop offset="100%" stopColor="#E84393" stopOpacity={0.8} />
                        </SvgLinearGradient>
                      </Defs>

                      <VictoryChart
                        standalone={false}
                        width={CHART_W}
                        height={CHART_H}
                        domainPadding={{ x: 28, y: [0, 20] }}
                        domain={{ y: [0, yMax] }}
                        padding={{ top: 20, bottom: 40, left: 48, right: 16 }}
                      >
                        {/* Y Axis */}
                        <VictoryAxis
                          dependentAxis
                          tickCount={5}
                          style={{
                            axis: { stroke: 'transparent' },
                            tickLabels: {
                              fill: C.text3,
                              fontSize: 10,
                              fontWeight: '500',
                            },
                            grid: {
                              stroke: 'rgba(255,255,255,0.04)',
                              strokeDasharray: '4,6',
                            },
                          }}
                          tickFormat={(t: number) => (t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t)}
                        />

                        {/* X Axis */}
                        <VictoryAxis
                          style={{
                            axis: { stroke: 'rgba(255,255,255,0.06)' },
                            tickLabels: {
                              fill: C.text2,
                              fontSize: 11,
                              fontWeight: '600',
                            },
                          }}
                          tickFormat={(x: number) => weekData[x - 1]?.dayLabel || ''}
                        />

                        {/* Goal line */}
                        <VictoryLine
                          data={goalLineData}
                          style={{
                            data: {
                              stroke: 'rgba(255,255,255,0.15)',
                              strokeWidth: 1.5,
                              strokeDasharray: '6,4',
                            },
                          }}
                        />

                        {/* Bars */}
                        <VictoryBar
                          data={chartData}
                          x="x"
                          y="y"
                          cornerRadius={{ top: 6 }}
                          barWidth={24}
                          style={{
                            data: {
                              fill: ({ datum }: any) =>
                                datum.y > calorieGoal ? C.warning : 'url(#barGrad)',
                            },
                          }}
                          animate={{
                            duration: 600,
                            onLoad: { duration: 400 },
                          }}
                        />
                      </VictoryChart>
                    </Svg>
                  </View>

                  {/* Legend */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 20,
                      marginTop: 8,
                      paddingTop: 14,
                      borderTopWidth: 1,
                      borderTopColor: C.glassBorder,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.accent }} />
                      <Text style={{ fontSize: 11, color: C.text3 }}>Calories</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 10, height: 3, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.20)' }} />
                      <Text style={{ fontSize: 11, color: C.text3 }}>Goal ({calorieGoal.toLocaleString()})</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.warning }} />
                      <Text style={{ fontSize: 11, color: C.text3 }}>Over</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* ── Stat Cards ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 2, marginBottom: 14 }}>
            WEEKLY INSIGHTS
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              icon="chart-line"
              label="Avg / Day"
              value={average.toLocaleString()}
              sub={`${calorieGoal > 0 ? Math.round((average / calorieGoal) * 100) : 0}% of goal`}
              color={C.accent}
              delay={100}
            />
            <StatCard
              icon="arrow-up-bold"
              label="Highest"
              value={highest.toLocaleString()}
              sub={weekData[highIdx]?.dayLabel || '—'}
              color={C.warning}
              delay={200}
            />
            <StatCard
              icon="arrow-down-bold"
              label="Lowest"
              value={lowest.toLocaleString()}
              sub={weekData[lowIdx]?.dayLabel || '—'}
              color={C.success}
              delay={300}
            />
          </View>
        </View>

        {/* ── Macro Averages ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 2, marginBottom: 14 }}>
            AVG MACROS PER DAY
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
              <View
                style={{
                  flexDirection: 'row',
                  padding: 18,
                  backgroundColor: C.glass,
                  gap: 12,
                }}
              >
                <MacroAvgItem label="Protein" value={avgProtein} unit="g" color={C.protein} icon="arm-flex" />
                <MacroAvgItem label="Carbs" value={avgCarbs} unit="g" color={C.carbs} icon="barley" />
                <MacroAvgItem label="Fat" value={avgFat} unit="g" color={C.fat} icon="water" />
              </View>
            </BlurView>
          </View>
        </View>

        {/* ── Daily Breakdown ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text3, letterSpacing: 2, marginBottom: 14 }}>
            DAILY BREAKDOWN
          </Text>
          {weekData.map((data, i) => (
            <DayRow
              key={i}
              data={data}
              isHighest={i === highIdx}
              isLowest={i === lowIdx}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Macro Average Item ───────────────────────────────────────────────────────

function MacroAvgItem({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: `${color}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '800', color: C.white }}>
        {value}
        <Text style={{ fontSize: 12, fontWeight: '500', color: C.text3 }}>{unit}</Text>
      </Text>
      <Text style={{ fontSize: 11, color: C.text3 }}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
