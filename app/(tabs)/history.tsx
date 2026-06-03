import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip } from 'victory-native';
import { Svg } from 'react-native-svg';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');
const chartWidth = width - 48; // 48 = 2 * 24px padding

interface CalorieData {
  day: string;
  calories: number;
  goal: number;
  date: string;
}

export default function History() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  // Generate last 7 days of data
  const weekData: CalorieData[] = useMemo(() => {
    const data: CalorieData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayIndex = date.day();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];

      data.push({
        day: dayName,
        calories: Math.floor(Math.random() * (2600 - 1800) + 1800),
        goal: 2500,
        date: date.format('MM/DD'),
      });
    }
    return data;
  }, []);

  const chartData = weekData.map((item, index) => ({
    x: index + 1,
    y: item.calories,
    day: item.day,
    calories: item.calories,
    goal: item.goal,
  }));

  const maxCalories = Math.max(...weekData.map(d => d.calories), 2500);
  const minCalories = 0;
  const averageCalories = Math.round(
    weekData.reduce((sum, d) => sum + d.calories, 0) / weekData.length
  );
  const totalCalories = weekData.reduce((sum, d) => sum + d.calories, 0);

  // Statistics
  const stats = [
    {
      label: 'Avg Calories',
      value: averageCalories.toString(),
      unit: 'kcal/day',
      icon: '🔥',
      color: '#FF6B6B',
      change: '+5%',
    },
    {
      label: 'Protein Intake',
      value: '118',
      unit: 'g/day',
      icon: '💪',
      color: '#4F46E5',
      change: '+2%',
    },
    {
      label: 'Water Intake',
      value: '2.3',
      unit: 'L/day',
      icon: '💧',
      color: '#06B6D4',
      change: '-8%',
    },
    {
      label: 'Workouts',
      value: '5',
      unit: 'sessions',
      icon: '🏃',
      color: '#10B981',
      change: '+1',
    },
  ];

  const achievements = [
    { emoji: '🎯', title: 'On Track', desc: '5 days' },
    { emoji: '🔥', title: 'Streak', desc: '12 days' },
    { emoji: '⭐', title: 'Perfect Week', desc: 'Unlocked' },
  ];

  return (
    <View className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-12 pb-8">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-gray-400 text-sm">Your Progress</Text>
              <Text className="text-white text-4xl font-bold mt-2">History</Text>
            </View>
            <View className="bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
              <Text className="text-red-500 text-xs font-semibold">Week View</Text>
            </View>
          </View>
        </View>

        {/* Time Range Selector */}
        <View className="px-6 mb-8 flex-row gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => setTimeRange(range)}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                timeRange === range ? 'bg-red-500' : 'bg-gray-900'
              }`}
            >
              <Text
                className={`text-center capitalize text-sm font-semibold ${
                  timeRange === range ? 'text-white' : 'text-gray-500'
                }`}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Calorie Chart */}
        <View className="px-6 mb-8">
          <BlurView intensity={20} className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}>
              <View className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-gray-400 text-sm">Weekly Calories</Text>
                    <Text className="text-white text-2xl font-bold mt-1">{totalCalories}</Text>
                    <Text className="text-gray-500 text-xs mt-1">Total this week</Text>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center gap-1 bg-green-500/20 px-3 py-2 rounded-lg">
                      <MaterialCommunityIcons name="trending-up" size={16} color="#4ADE80" />
                      <Text className="text-green-400 font-semibold">+3%</Text>
                    </View>
                  </View>
                </View>

                {/* Victory Chart */}
                <View className="h-72 -mx-6">
                  <Svg width={chartWidth} height={280}>
                    <VictoryChart
                      width={chartWidth}
                      height={280}
                      domainPadding={{ top: 20, bottom: 40, left: 40, right: 20 }}
                      domain={{
                        y: [0, Math.ceil(maxCalories / 100) * 100],
                      }}
                    >
                      {/* Y-Axis */}
                      <VictoryAxis
                        dependentAxis
                        style={{
                          axis: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
                          tickLabels: {
                            fill: '#888888',
                            fontSize: 12,
                          },
                          grid: {
                            stroke: 'rgba(255, 255, 255, 0.05)',
                            strokeDasharray: '4,4',
                          },
                        }}
                        gridComponent={<></>}
                      />

                      {/* X-Axis */}
                      <VictoryAxis
                        style={{
                          axis: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
                          tickLabels: {
                            fill: '#888888',
                            fontSize: 12,
                            angle: 0,
                          },
                        }}
                        tickFormat={(x) => weekData[x - 1]?.day || ''}
                      />

                      {/* Goal Line */}
                      <VictoryBar
                        data={chartData}
                        x="x"
                        y="y"
                        style={{
                          data: {
                            fill: 'url(#barGradient)',
                            strokeWidth: 0,
                            width: 30,
                          },
                        }}
                        cornerRadius={8}
                        labels={({ datum }) => `${datum.calories}`}
                        labelComponent={
                          <VictoryTooltip
                            style={{
                              fill: '#FFFFFF',
                              stroke: 'none',
                              fontSize: 12,
                              fontWeight: 'bold',
                            }}
                            flyoutStyle={{
                              fill: '#1a1a1a',
                              stroke: '#FF6B6B',
                              strokeWidth: 1,
                              borderRadius: 4,
                            }}
                          />
                        }
                      />

                      {/* Defs for gradient */}
                      <defs>
                        <linearGradient
                          id="barGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#FF6B6B" />
                          <stop offset="100%" stopColor="#FF5252" />
                        </linearGradient>
                      </defs>
                    </VictoryChart>
                  </Svg>
                </View>

                {/* Chart Legend */}
                <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-400" />
                    <Text className="text-gray-400 text-xs">Calories Consumed</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full border-2 border-gray-600" />
                    <Text className="text-gray-400 text-xs">Daily Goal (2500)</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Weekly Summary Stats */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-4">WEEKLY STATISTICS</Text>
          <View className="gap-3">
            {stats.map((stat, idx) => (
              <BlurView key={idx} intensity={15} className="rounded-xl overflow-hidden border border-white/10">
                <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
                  <View className="p-4 flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-4">{stat.icon}</Text>
                      <View>
                        <Text className="text-gray-400 text-sm">{stat.label}</Text>
                        <Text className="text-white font-semibold text-lg">
                          {stat.value}
                          <Text className="text-gray-500 text-xs ml-1">{stat.unit}</Text>
                        </Text>
                      </View>
                    </View>
                    <View className="items-center gap-1">
                      <Text
                        className={`text-sm font-semibold ${
                          stat.change.includes('+')
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {stat.change}
                      </Text>
                      <Text className="text-gray-600 text-xs">vs last week</Text>
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-4">ACHIEVEMENTS</Text>
          <View className="flex-row gap-3">
            {achievements.map((achievement, idx) => (
              <BlurView key={idx} intensity={15} className="flex-1 rounded-2xl overflow-hidden border border-white/10">
                <LinearGradient colors={['rgba(255, 107, 107, 0.1)', 'rgba(139, 92, 246, 0.05)']}>
                  <View className="p-6 items-center">
                    <Text className="text-4xl mb-3">{achievement.emoji}</Text>
                    <Text className="text-white text-sm font-semibold text-center">{achievement.title}</Text>
                    <Text className="text-gray-500 text-xs text-center mt-2">{achievement.desc}</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Detailed Breakdown */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-4">DAILY BREAKDOWN</Text>
          <View className="gap-2">
            {weekData.map((item, idx) => {
              const percentage = (item.calories / item.goal) * 100;
              const overTarget = item.calories > item.goal;

              return (
                <BlurView key={idx} intensity={10} className="rounded-xl overflow-hidden border border-white/10">
                  <LinearGradient colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}>
                    <View className="p-4">
                      <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-row items-center gap-3 flex-1">
                          <Text className="text-white font-semibold w-12">{item.day}</Text>
                          <View className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <View
                              className={`h-full ${overTarget ? 'bg-yellow-500' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </View>
                        </View>
                        <View className="items-end ml-4">
                          <Text className="text-white font-bold">{item.calories}</Text>
                          <Text className="text-gray-500 text-xs">{Math.round(percentage)}%</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </BlurView>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
