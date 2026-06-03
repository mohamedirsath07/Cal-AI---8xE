import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

export default function Diary() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [meals, setMeals] = useState([
    { id: '1', name: 'Breakfast', time: '08:30', items: ['Oatmeal', 'Banana', 'Honey'], calories: 350 },
    { id: '2', name: 'Lunch', time: '12:45', items: ['Chicken Breast', 'Brown Rice', 'Broccoli'], calories: 520 },
    { id: '3', name: 'Snack', time: '15:30', items: ['Protein Bar', 'Apple'], calories: 280 },
  ]);

  const dates = Array.from({ length: 7 }).map((_, i) => dayjs().subtract(3 - i, 'day'));

  return (
    <View className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-white text-3xl font-bold">Food Diary</Text>
          <Text className="text-gray-400 text-sm mt-2">{selectedDate.format('dddd, MMM D')}</Text>
        </View>

        {/* Date Selector */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            {dates.map((date, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedDate(date)}
                className={`rounded-lg px-4 py-2 ${
                  selectedDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
                    ? 'bg-red-500'
                    : 'bg-gray-900'
                }`}
              >
                <Text
                  className={`text-center ${
                    selectedDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
                      ? 'text-white font-bold'
                      : 'text-gray-500'
                  }`}
                >
                  {date.format('MM/DD')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Daily Summary */}
        <View className="px-6 mb-6">
          <BlurView intensity={20} className="rounded-2xl overflow-hidden border border-white/10">
            <LinearGradient colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 107, 107, 0.05)']}>
              <View className="p-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-400 text-sm">Total Consumed</Text>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4ADE80" />
                </View>
                <View className="flex-row justify-between items-end">
                  <View>
                    <Text className="text-4xl font-bold text-white">1,150</Text>
                    <Text className="text-gray-400 text-sm mt-1">calories</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-green-400 font-semibold">+1,350</Text>
                    <Text className="text-gray-500 text-xs">remaining</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Meals */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-400 text-sm">MEALS TODAY</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {meals.map((meal) => (
            <BlurView key={meal.id} intensity={20} className="rounded-xl overflow-hidden mb-3 border border-white/10">
              <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-white font-semibold text-lg">{meal.name}</Text>
                      <Text className="text-gray-500 text-xs">{meal.time}</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-red-500 font-bold">{meal.calories}</Text>
                      <Text className="text-gray-600 text-xs">kcal</Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {meal.items.map((item, idx) => (
                      <View key={idx} className="bg-gray-800 px-3 py-1 rounded-full">
                        <Text className="text-gray-300 text-xs">{item}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="flex-row gap-2 mt-4 pt-4 border-t border-white/10">
                    <TouchableOpacity className="flex-1">
                      <View className="items-center py-2">
                        <MaterialCommunityIcons name="pencil" size={18} color="#FF6B6B" />
                        <Text className="text-gray-400 text-xs mt-1">Edit</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1">
                      <View className="items-center py-2">
                        <MaterialCommunityIcons name="delete" size={18} color="#EF4444" />
                        <Text className="text-gray-400 text-xs mt-1">Delete</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
