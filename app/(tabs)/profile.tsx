import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Profile() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const userInfo = {
    name: 'Sarah Anderson',
    email: 'sarah@example.com',
    age: 28,
    weight: '65 kg',
    height: '173 cm',
    goal: 'Weight Loss',
  };

  const menuItems = [
    { icon: 'cog', label: 'Settings', color: '#FF6B6B' },
    { icon: 'heart', label: 'Health & Fitness', color: '#4ADE80' },
    { icon: 'bell', label: 'Notifications', color: '#FCD34D', toggle: true },
    { icon: 'moon', label: 'Dark Mode', color: '#8B5CF6', toggle: true },
    { icon: 'information', label: 'About', color: '#06B6D4' },
    { icon: 'logout', label: 'Sign Out', color: '#EF4444' },
  ];

  return (
    <View className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-white text-3xl font-bold">Profile</Text>
        </View>

        {/* User Card */}
        <View className="px-6 mb-6">
          <BlurView intensity={20} className="rounded-2xl overflow-hidden border border-white/10">
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.15)', 'rgba(139, 92, 246, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="p-6">
                <View className="flex-row items-center mb-6">
                  <View className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-500 items-center justify-center mr-4">
                    <Text className="text-3xl">👤</Text>
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">{userInfo.name}</Text>
                    <Text className="text-gray-400 text-sm">{userInfo.email}</Text>
                  </View>
                </View>

                <View className="grid gap-4">
                  {[
                    { label: 'Age', value: userInfo.age.toString() },
                    { label: 'Weight', value: userInfo.weight },
                    { label: 'Height', value: userInfo.height },
                    { label: 'Goal', value: userInfo.goal },
                  ].map((item, idx) => (
                    <View key={idx} className="flex-row justify-between">
                      <Text className="text-gray-400 text-sm">{item.label}</Text>
                      <Text className="text-white font-semibold">{item.value}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity className="mt-6 py-3 rounded-lg border border-white/20">
                  <Text className="text-white text-center font-semibold">Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Menu Items */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-4">PREFERENCES</Text>
          <View className="gap-2">
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                disabled={item.toggle}
                className="rounded-xl overflow-hidden border border-white/10"
              >
                <BlurView intensity={20}>
                  <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
                    <View className="flex-row items-center justify-between p-4">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                          style={{ backgroundColor: item.color + '20' }}
                        >
                          <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                        </View>
                        <Text className="text-white font-semibold">{item.label}</Text>
                      </View>
                      {item.toggle && item.label === 'Notifications' && (
                        <Switch value={notifications} onValueChange={setNotifications} />
                      )}
                      {item.toggle && item.label === 'Dark Mode' && (
                        <Switch value={darkMode} onValueChange={setDarkMode} />
                      )}
                      {!item.toggle && (
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                      )}
                    </View>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 mb-8">
          <Text className="text-gray-400 text-sm mb-4">YOUR JOURNEY</Text>
          <View className="flex-row gap-3">
            {[
              { label: 'Days Active', value: '145', icon: '📅' },
              { label: 'Meals Logged', value: '437', icon: '🍽️' },
              { label: 'Workouts', value: '52', icon: '💪' },
            ].map((stat, idx) => (
              <BlurView key={idx} intensity={20} className="flex-1 rounded-xl overflow-hidden border border-white/10">
                <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}>
                  <View className="p-4 items-center">
                    <Text className="text-2xl mb-2">{stat.icon}</Text>
                    <Text className="text-white text-lg font-bold">{stat.value}</Text>
                    <Text className="text-gray-400 text-xs mt-1 text-center">{stat.label}</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Version */}
        <View className="px-6 pb-8 items-center">
          <Text className="text-gray-600 text-xs">CalAI v1.0.0</Text>
          <Text className="text-gray-700 text-xs mt-2">Made with ❤️ for your health</Text>
        </View>
      </ScrollView>
    </View>
  );
}
