import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface MacroRingProps {
  value: number;
  target: number;
  label: string;
  color: string;
  size: number;
}

function MacroRing({ value, target, label, color, size }: MacroRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value / target, 1) * circumference);
  const percentage = Math.round((value / target) * 100);

  return (
    <View className="items-center gap-3">
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transform: `rotate(-90deg)`,
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transitionDuration: '500ms',
            }}
          />
        </Svg>
        {/* Center text */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-white font-bold text-lg">{value}g</Text>
          <Text className="text-gray-500 text-xs">{percentage}%</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-sm">{label}</Text>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [calories, setCalories] = useState(1850);
  const [protein, setProtein] = useState(120);
  const [carbs, setCarbs] = useState(210);
  const [fat, setFat] = useState(65);
  const [streak, setStreak] = useState(12);

  const targets = { calories: 2500, protein: 150, carbs: 300, fat: 85 };
  const caloriePercent = Math.min((calories / targets.calories) * 100, 100);
  const calorieRemaining = Math.max(targets.calories - calories, 0);

  const recentMeals = [
    { id: 1, name: 'Grilled Chicken Salad', calories: 320, time: '2 hours ago', icon: '🥗' },
    { id: 2, name: 'Protein Smoothie', calories: 280, time: '5 hours ago', icon: '🥤' },
    { id: 3, name: 'Brown Rice Bowl', calories: 450, time: 'Yesterday', icon: '🍚' },
  ];

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-8">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-400 text-sm">Today's Summary</Text>
              <Text className="text-white text-4xl font-bold mt-1">CalAI</Text>
            </View>
            <TouchableOpacity className="w-12 h-12 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20">
              <MaterialCommunityIcons name="bell" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Calorie Card */}
        <View className="px-6 mb-8">
          <BlurView intensity={25} className="rounded-3xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.15)', 'rgba(139, 92, 246, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="p-8 items-center">
                <Text className="text-gray-400 text-sm mb-4">DAILY CALORIES</Text>
                
                {/* Calorie Ring */}
                <View className="mb-6">
                  <Svg width={180} height={180}>
                    {/* Background circle */}
                    <Circle
                      cx="90"
                      cy="90"
                      r="75"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <Circle
                      cx="90"
                      cy="90"
                      r="75"
                      stroke="url(#grad)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(caloriePercent / 100) * 471} 471`}
                      strokeLinecap="round"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '90px 90px',
                      }}
                    />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF6B6B" />
                        <stop offset="100%" stopColor="#FF5252" />
                      </linearGradient>
                    </defs>
                  </Svg>
                  
                  {/* Center content */}
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="items-center">
                      <Text className="text-5xl font-bold text-white">{calories}</Text>
                      <Text className="text-gray-400 text-sm mt-2">kcal</Text>
                    </View>
                  </View>
                </View>

                {/* Calorie Details */}
                <View className="w-full gap-3">
                  <View className="flex-row justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="target" size={20} color="#4ADE80" />
                      <Text className="text-gray-400 text-sm">Goal</Text>
                    </View>
                    <Text className="text-white font-semibold">{targets.calories} kcal</Text>
                  </View>

                  <View className="flex-row justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="plus" size={20} color="#8B5CF6" />
                      <Text className="text-gray-400 text-sm">Remaining</Text>
                    </View>
                    <Text className="text-white font-semibold">{calorieRemaining} kcal</Text>
                  </View>

                  <View className="flex-row justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />
                      <Text className="text-gray-400 text-sm">Progress</Text>
                    </View>
                    <Text className="text-white font-semibold">{Math.round(caloriePercent)}%</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Macronutrient Rings */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-6">MACRONUTRIENTS</Text>
          <View className="flex-row justify-around items-end gap-4">
            <MacroRing value={protein} target={targets.protein} label="Protein" color="#4F46E5" size={120} />
            <MacroRing value={carbs} target={targets.carbs} label="Carbs" color="#8B5CF6" size={120} />
            <MacroRing value={fat} target={targets.fat} label="Fat" color="#EC4899" size={120} />
          </View>
        </View>

        {/* Streak Card */}
        <View className="px-6 mb-8">
          <BlurView intensity={20} className="rounded-2xl overflow-hidden border border-white/10">
            <LinearGradient colors={['rgba(74, 222, 128, 0.1)', 'rgba(74, 222, 128, 0.05)']}>
              <View className="flex-row items-center justify-between p-6">
                <View className="flex-row items-center gap-4">
                  <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center border-2 border-amber-500/30">
                    <Text className="text-3xl">🔥</Text>
                  </View>
                  <View>
                    <Text className="text-gray-400 text-sm">Current Streak</Text>
                    <Text className="text-white text-3xl font-bold">{streak} days</Text>
                  </View>
                </View>
                <View className="items-center">
                  <MaterialCommunityIcons name="chevron-right" size={28} color="#888888" />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Recent Meals */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-gray-400 text-sm font-semibold">RECENT MEALS</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/diary')}>
              <View className="flex-row items-center gap-1">
                <Text className="text-red-500 text-sm font-semibold">View All</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#FF6B6B" />
              </View>
            </TouchableOpacity>
          </View>

          <View className="gap-3">
            {recentMeals.map((meal) => (
              <BlurView key={meal.id} intensity={15} className="rounded-2xl overflow-hidden border border-white/10">
                <LinearGradient colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}>
                  <TouchableOpacity className="flex-row justify-between items-center p-4 active:opacity-70">
                    <View className="flex-row items-center gap-4 flex-1">
                      <Text className="text-3xl">{meal.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{meal.name}</Text>
                        <Text className="text-gray-500 text-xs mt-1">{meal.time}</Text>
                      </View>
                    </View>
                    <View className="items-center gap-1">
                      <Text className="text-red-500 font-bold text-lg">{meal.calories}</Text>
                      <Text className="text-gray-600 text-xs">kcal</Text>
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Quick Add Button */}
        <TouchableOpacity
          onPress={() => router.push('/camera')}
          activeOpacity={0.8}
          className="mx-6 mb-4"
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl py-5 shadow-lg"
          >
            <View className="flex-row justify-center items-center gap-3">
              <MaterialCommunityIcons name="plus" size={28} color="white" />
              <Text className="text-white font-bold text-lg">Add Food</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
