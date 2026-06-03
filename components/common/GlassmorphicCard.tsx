import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  intensity?: number;
  colors?: [string, string, string?];
  padding?: string;
  rounded?: string;
  borderColor?: string;
}

export function GlassmorphicCard({
  children,
  intensity = 20,
  colors = ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  padding = 'p-4',
  rounded = 'rounded-xl',
  borderColor = 'border-white/10',
}: GlassmorphicCardProps) {
  return (
    <BlurView intensity={intensity} className={`${rounded} overflow-hidden border ${borderColor}`}>
      <LinearGradient colors={colors as [string, string, ...(string | undefined)[]]}>
        <View className={padding}>{children}</View>
      </LinearGradient>
    </BlurView>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, unit, icon, color = '#FF6B6B' }: StatCardProps) {
  return (
    <GlassmorphicCard padding="p-4">
      <View className="flex-row items-center">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">
          <Text className="text-gray-400 text-xs mb-1">{label}</Text>
          <View className="flex-row items-baseline">
            <Text className="text-white text-lg font-bold">{value}</Text>
            {unit && <Text className="text-gray-500 text-xs ml-1">{unit}</Text>}
          </View>
        </View>
      </View>
    </GlassmorphicCard>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#FF6B6B',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        />
      </svg>
    </View>
  );
}
