import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Analysis() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const foodData = {
    name: 'Grilled Chicken Salad',
    confidence: 94,
    calories: 320,
    protein: 45,
    carbs: 15,
    fat: 12,
    fiber: 8,
    ingredients: [
      { name: 'Chicken Breast', weight: '180g', cals: 280 },
      { name: 'Mixed Greens', weight: '100g', cals: 15 },
      { name: 'Cherry Tomatoes', weight: '80g', cals: 14 },
      { name: 'Olive Oil Dressing', weight: '15ml', cals: 120 },
    ],
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <BlurView intensity={20} className="rounded-3xl p-8">
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text className="text-white text-center mt-4 font-semibold">Analyzing food...</Text>
          <Text className="text-gray-400 text-center text-sm mt-2">Using AI to identify calories</Text>
        </BlurView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-8 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold">AI Analysis</Text>
          <MaterialCommunityIcons name="check-circle" size={28} color="#4ADE80" />
        </View>

        {/* Food Card */}
        <View className="px-6 mt-8 mb-6">
          <BlurView intensity={20} className="rounded-2xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="p-6">
                <View className="items-center mb-6">
                  <Text className="text-4xl mb-4">🍗</Text>
                  <Text className="text-white text-2xl font-bold text-center">{foodData.name}</Text>
                  <View className="flex-row items-center mt-4 bg-green-500/20 px-4 py-2 rounded-full">
                    <MaterialCommunityIcons name="check" size={16} color="#4ADE80" />
                    <Text className="text-green-400 ml-2 font-semibold">{foodData.confidence}% Match</Text>
                  </View>
                </View>

                {/* Quantity Selector */}
                <View className="flex-row items-center justify-center gap-4 py-4 border-t border-white/10">
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                    className="w-10 h-10 rounded-lg bg-white/10 items-center justify-center"
                  >
                    <Text className="text-white font-bold">−</Text>
                  </TouchableOpacity>
                  <View className="items-center min-w-20">
                    <Text className="text-gray-400 text-xs mb-1">Quantity</Text>
                    <Text className="text-white text-xl font-bold">{quantity}x</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setQuantity(quantity + 0.5)}
                    className="w-10 h-10 rounded-lg bg-white/10 items-center justify-center"
                  >
                    <Text className="text-white font-bold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Calories Summary */}
        <View className="px-6 mb-6">
          <BlurView intensity={20} className="rounded-2xl overflow-hidden border border-white/10">
            <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
              <View className="p-6">
                <Text className="text-gray-400 text-sm mb-4">NUTRITIONAL VALUE</Text>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-400 text-xs">Total Energy</Text>
                    <Text className="text-4xl font-bold text-white mt-1">
                      {Math.round(foodData.calories * quantity)}
                    </Text>
                    <Text className="text-gray-500 text-sm">kilocalories</Text>
                  </View>
                  <View className="items-center">
                    <MaterialCommunityIcons name="fire" size={40} color="#FF6B6B" />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Macros Grid */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-sm mb-4">MACRONUTRIENTS</Text>
          <View className="gap-2">
            {[
              { label: 'Protein', value: foodData.protein, unit: 'g', color: '#4F46E5', icon: '💪' },
              { label: 'Carbs', value: foodData.carbs, unit: 'g', color: '#8B5CF6', icon: '🍞' },
              { label: 'Fat', value: foodData.fat, unit: 'g', color: '#EC4899', icon: '🧈' },
              { label: 'Fiber', value: foodData.fiber, unit: 'g', color: '#10B981', icon: '🌾' },
            ].map((macro, idx) => (
              <BlurView key={idx} intensity={20} className="rounded-xl overflow-hidden border border-white/10">
                <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
                  <View className="p-4 flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-4">{macro.icon}</Text>
                      <View>
                        <Text className="text-gray-400 text-sm">{macro.label}</Text>
                        <Text className="text-white font-semibold">
                          {Math.round(macro.value * quantity)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-500">{macro.unit}</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-4">DETECTED INGREDIENTS</Text>
          {foodData.ingredients.map((ingredient, idx) => (
            <BlurView key={idx} intensity={20} className="rounded-xl overflow-hidden mb-2 border border-white/10">
              <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
                <View className="p-4 flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{ingredient.name}</Text>
                    <Text className="text-gray-500 text-xs mt-1">{ingredient.weight}</Text>
                  </View>
                  <Text className="text-gray-400">{ingredient.cals} kcal</Text>
                </View>
              </LinearGradient>
            </BlurView>
          ))}
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-8 gap-3 flex-row">
          <TouchableOpacity className="flex-1">
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} className="rounded-xl p-4">
              <View className="flex-row items-center justify-center">
                <MaterialCommunityIcons name="pencil" size={20} color="#FF6B6B" />
                <Text className="text-white font-semibold ml-2">Edit</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1" onPress={() => router.push('/(tabs)/diary')}>
            <LinearGradient colors={['#FF6B6B', '#FF5252']} className="rounded-xl p-4">
              <View className="flex-row items-center justify-center">
                <MaterialCommunityIcons name="check" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Add to Diary</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
