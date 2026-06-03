import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '@lib/api';

interface CapturedImage {
  uri: string;
  type: string;
  name: string;
}

export default function Camera() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [imagePermission, requestImagePermission] = ImagePicker.useMediaLibraryPermissions();
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  // Request permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    if (!imagePermission?.granted) {
      requestImagePermission();
    }
  }, []);

  // Handle camera permission denied
  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF6B6B" />
        <Text className="text-white text-2xl font-bold mt-4">Camera Permission</Text>
        <Text className="text-gray-400 text-center mt-2">
          We need camera access to scan your food. Please enable it in settings.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 bg-red-500 px-8 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <MaterialCommunityIcons name="alert-circle" size={64} color="#FCD34D" />
        <Text className="text-white text-2xl font-bold mt-4">Camera Access Denied</Text>
        <Text className="text-gray-400 text-center mt-2">
          Please grant camera permission in your device settings to use this feature.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 bg-red-500 px-8 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Take picture with camera
  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
        });

        if (photo) {
          setCapturedImage({
            uri: photo.uri,
            type: 'image/jpeg',
            name: `food_${Date.now()}.jpg`,
          });
          setAnalysisResult(null);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `food_${Date.now()}.jpg`,
        });
        setAnalysisResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Gallery error:', error);
    }
  };

  // Analyze food image
  const analyzeFood = async () => {
    if (!capturedImage) {
      Alert.alert('Error', 'Please capture or select an image first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiService.analyzeFood({
        imageUri: capturedImage.uri,
        quantity: 1,
      });

      if (response.success && response.data) {
        setAnalysisResult(response.data);
        // Navigate to analysis screen with results
        router.push({
          pathname: '/analysis',
          params: {
            foodName: response.data.name,
            calories: response.data.calories,
            protein: response.data.protein,
            carbs: response.data.carbs,
            fat: response.data.fat,
            confidence: response.data.confidence,
            imageUri: capturedImage.uri,
          },
        });
      } else {
        Alert.alert('Analysis Failed', response.error || 'Failed to analyze food. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze food. Please check your connection.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show captured image preview
  if (capturedImage) {
    return (
      <View className="flex-1 bg-black">
        {/* Image Preview */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: capturedImage.uri }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Overlay gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            className="absolute inset-0"
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          {/* Analyze Button (Primary) */}
          <TouchableOpacity
            onPress={analyzeFood}
            disabled={isAnalyzing}
            activeOpacity={0.8}
            className="mb-4"
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF5252']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl py-4 flex-row items-center justify-center gap-3"
            >
              {isAnalyzing ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-bold text-lg">Analyzing...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="robot" size={24} color="white" />
                  <Text className="text-white font-bold text-lg">Analyze Food</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Buttons */}
          <View className="flex-row gap-3">
            {/* Retake Button */}
            <TouchableOpacity
              onPress={() => {
                setCapturedImage(null);
                setAnalysisResult(null);
              }}
              className="flex-1"
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                className="rounded-xl py-3 border border-white/20"
              >
                <View className="flex-row items-center justify-center gap-2">
                  <MaterialCommunityIcons name="camera-retake" size={20} color="#FF6B6B" />
                  <Text className="text-white font-semibold">Retake</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1"
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                className="rounded-xl py-3 border border-white/20"
              >
                <View className="flex-row items-center justify-center gap-2">
                  <MaterialCommunityIcons name="close" size={20} color="#888888" />
                  <Text className="text-white font-semibold">Cancel</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Analysis Result Preview (if available) */}
          {analysisResult && (
            <BlurView intensity={20} className="rounded-xl mt-4 border border-white/20 overflow-hidden">
              <LinearGradient colors={['rgba(74, 222, 128, 0.1)', 'rgba(74, 222, 128, 0.05)']}>
                <View className="p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4ADE80" />
                    <Text className="text-green-400 font-semibold">Analysis Complete!</Text>
                  </View>
                  <Text className="text-white font-bold text-lg">{analysisResult.name}</Text>
                  <Text className="text-gray-400 text-sm mt-1">{analysisResult.calories} kcal</Text>
                </View>
              </LinearGradient>
            </BlurView>
          )}
        </View>
      </View>
    );
  }

  // Camera preview
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} className="flex-1">
        {/* Header */}
        <View className="absolute top-0 left-0 right-0 pt-12 px-6 flex-row justify-between items-center z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center border border-white/20"
          >
            <MaterialCommunityIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">Scan Food</Text>
          <View className="w-10 h-10 rounded-full bg-black/50 items-center justify-center border border-white/20">
            <MaterialCommunityIcons name="flash-off" size={24} color="white" />
          </View>
        </View>

        {/* Center Focus Frame */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-80 h-80 rounded-3xl border-2 border-red-500 opacity-50" />
          <View className="absolute w-80 h-80 rounded-3xl bg-red-500 opacity-5" />
          {/* Corner brackets */}
          <View className="absolute top-40 left-20 w-8 h-8 border-t-2 border-l-2 border-red-500 opacity-70" />
          <View className="absolute top-40 right-20 w-8 h-8 border-t-2 border-r-2 border-red-500 opacity-70" />
          <View className="absolute bottom-40 left-20 w-8 h-8 border-b-2 border-l-2 border-red-500 opacity-70" />
          <View className="absolute bottom-40 right-20 w-8 h-8 border-b-2 border-r-2 border-red-500 opacity-70" />
        </View>

        {/* Instructions Overlay */}
        <View className="absolute bottom-32 left-0 right-0 items-center px-6">
          <BlurView intensity={80} className="rounded-2xl overflow-hidden px-6 py-4 border border-white/10">
            <Text className="text-white text-center text-sm font-semibold">
              Point camera at your food
            </Text>
            <Text className="text-gray-400 text-center text-xs mt-1">
              Best results: clear lighting, good angle
            </Text>
          </BlurView>
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 pb-8 px-6">
          <View className="flex-row justify-between items-end gap-4">
            {/* Gallery Button */}
            <TouchableOpacity
              onPress={pickImage}
              className="w-14 h-14 rounded-full bg-black/40 items-center justify-center border border-white/20"
            >
              <MaterialCommunityIcons name="image-multiple" size={24} color="white" />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              onPress={takePicture}
              activeOpacity={0.8}
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF5252']}
                className="w-16 h-16 rounded-full items-center justify-center"
              >
                <MaterialCommunityIcons name="camera" size={32} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity
              onPress={() => Alert.alert('Settings', 'Camera settings will open here')}
              className="w-14 h-14 rounded-full bg-black/40 items-center justify-center border border-white/20"
            >
              <MaterialCommunityIcons name="cog" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <Text className="text-gray-400 text-xs text-center mt-6">
            Tap camera icon to capture • Tap gallery to upload
          </Text>
        </View>
      </CameraView>
    </View>
  );
}
