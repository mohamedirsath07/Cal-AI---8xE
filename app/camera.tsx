import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { analyzeFood as geminiAnalyze } from '../services/gemini';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIEWFINDER_SIZE = SCREEN_W * 0.78;
const CORNER_LEN = 32;
const CORNER_THICK = 3.5;

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#000000',
  accent: '#FF5252',
  accentEnd: '#E84393',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.15)',
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.35)',
  scanline: 'rgba(255,82,82,0.45)',
  success: '#22C55E',
};

// ─── Corner Bracket ───────────────────────────────────────────────────────────

type CornerPos = 'tl' | 'tr' | 'bl' | 'br';

function CornerBracket({ position }: { position: CornerPos }) {
  const isTop = position.startsWith('t');
  const isLeft = position.endsWith('l');

  return (
    <View
      style={{
        position: 'absolute',
        width: CORNER_LEN,
        height: CORNER_LEN,
        ...(isTop ? { top: -1 } : { bottom: -1 }),
        ...(isLeft ? { left: -1 } : { right: -1 }),
        borderColor: C.accent,
        ...(isTop ? { borderTopWidth: CORNER_THICK } : { borderBottomWidth: CORNER_THICK }),
        ...(isLeft ? { borderLeftWidth: CORNER_THICK } : { borderRightWidth: CORNER_THICK }),
        ...(isTop && isLeft ? { borderTopLeftRadius: 14 } : {}),
        ...(isTop && !isLeft ? { borderTopRightRadius: 14 } : {}),
        ...(!isTop && isLeft ? { borderBottomLeftRadius: 14 } : {}),
        ...(!isTop && !isLeft ? { borderBottomRightRadius: 14 } : {}),
      }}
    />
  );
}

// ─── Scanning Line Animation ──────────────────────────────────────────────────

function ScanLine() {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: VIEWFINDER_SIZE - 4,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 8,
        right: 8,
        height: 2,
        transform: [{ translateY }],
      }}
    >
      <LinearGradient
        colors={['transparent', C.scanline, C.scanline, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: '100%', height: 2, borderRadius: 1 }}
      />
    </Animated.View>
  );
}

// ─── Glass Icon Button ────────────────────────────────────────────────────────

interface GlassButtonProps {
  icon: string;
  size?: number;
  onPress: () => void;
  accent?: boolean;
  disabled?: boolean;
}

function GlassButton({ icon, size = 44, onPress, accent, disabled }: GlassButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
      }}
    >
      <BlurView
        intensity={40}
        tint="dark"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: accent ? 'rgba(255,82,82,0.3)' : C.glassBorder,
          backgroundColor: accent ? 'rgba(255,82,82,0.15)' : C.glass,
        }}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={size * 0.5}
          color={accent ? C.accent : C.white}
        />
      </BlurView>
    </TouchableOpacity>
  );
}

// ─── Capture Button ───────────────────────────────────────────────────────────

function CaptureButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 4,
          borderColor: C.white,
          padding: 4,
          ...(Platform.OS === 'ios'
            ? {
                shadowColor: C.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
              }
            : { elevation: 10 }),
        }}
      >
        <LinearGradient
          colors={[C.accent, C.accentEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="camera" size={30} color={C.white} />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Permission Denied Screen ─────────────────────────────────────────────────

function PermissionScreen({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  onBack,
}: {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack: () => void;
}) {
  return (
    <View style={[styles.flex1, styles.centerAll, { backgroundColor: C.bg, paddingHorizontal: 32 }]}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: 'rgba(255,82,82,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,82,82,0.2)',
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={44} color={C.accent} />
      </View>

      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          color: C.textPrimary,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: C.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 32,
        }}
      >
        {subtitle}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.8} style={{ width: '100%', marginBottom: 14 }}>
          <LinearGradient
            colors={[C.accent, C.accentEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.white }}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onBack}
        style={{
          width: '100%',
          paddingVertical: 16,
          alignItems: 'center',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.glassBorder,
          backgroundColor: C.glass,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: C.textSecondary }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Image Preview Mode ───────────────────────────────────────────────────────

interface PreviewProps {
  uri: string;
  onRetake: () => void;
  onAnalyze: () => void;
  onCancel: () => void;
  isAnalyzing: boolean;
}

function ImagePreview({ uri, onRetake, onAnalyze, onCancel, isAnalyzing }: PreviewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const imageScale = useRef(new Animated.Value(1.08)).current;

  // Pulsing dots for analyzing state
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(imageScale, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isAnalyzing) return;
    const createPulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    const a1 = createPulse(dot1, 0);
    const a2 = createPulse(dot2, 150);
    const a3 = createPulse(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [isAnalyzing]);

  return (
    <View style={[styles.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen image */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: imageScale }] }]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      </Animated.View>

      {/* Top gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140 }}
      />

      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.45 }}
      />

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 56 : 40,
          left: 20,
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <GlassButton icon="arrow-left" onPress={onCancel} />
        <View
          style={{
            backgroundColor: C.glass,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: C.glassBorder,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>
            Preview
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Check badge */}
      <View style={[styles.centerAll, { position: 'absolute', top: '35%', left: 0, right: 0 }]}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: 'rgba(34,197,94,0.15)',
            borderWidth: 2,
            borderColor: 'rgba(34,197,94,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="check" size={36} color={C.success} />
        </Animated.View>
        <Animated.View style={{ opacity: fadeAnim, marginTop: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.textPrimary, textAlign: 'center' }}>
            Photo captured
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 4 }}>
            Tap Analyze to identify the food
          </Text>
        </Animated.View>
      </View>

      {/* Bottom controls */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === 'ios' ? 48 : 32,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Analyze Food Button */}
        <TouchableOpacity
          onPress={onAnalyze}
          disabled={isAnalyzing}
          activeOpacity={0.85}
          style={{ marginBottom: 14 }}
        >
          <View
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              ...(Platform.OS === 'ios'
                ? {
                    shadowColor: C.accent,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.45,
                    shadowRadius: 20,
                  }
                : { elevation: 14 }),
            }}
          >
            <LinearGradient
              colors={isAnalyzing ? ['#333', '#222'] : [C.accent, '#FF4040', C.accentEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              {isAnalyzing ? (
                <>
                  <MaterialCommunityIcons name="brain" size={22} color={C.accent} />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: C.accent }}>
                    Analyzing
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4, marginLeft: 2 }}>
                    {[dot1, dot2, dot3].map((dot, i) => (
                      <Animated.View
                        key={i}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: C.accent,
                          opacity: dot,
                        }}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="brain" size={22} color={C.white} />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: C.white }}>
                    Analyze Food
                  </Text>
                  <MaterialCommunityIcons name="sparkles" size={18} color="rgba(255,255,255,0.7)" />
                </>
              )}
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Secondary Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Retake */}
          <TouchableOpacity
            onPress={onRetake}
            disabled={isAnalyzing}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.glassBorder,
              }}
            >
              <BlurView intensity={30} tint="dark">
                <View
                  style={{
                    paddingVertical: 15,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: C.glass,
                  }}
                >
                  <MaterialCommunityIcons name="camera-retake" size={20} color={C.accent} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.textPrimary }}>
                    Retake
                  </Text>
                </View>
              </BlurView>
            </View>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onCancel}
            disabled={isAnalyzing}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: C.glassBorder,
              }}
            >
              <BlurView intensity={30} tint="dark">
                <View
                  style={{
                    paddingVertical: 15,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: C.glass,
                  }}
                >
                  <MaterialCommunityIcons name="close" size={20} color={C.textSecondary} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.textSecondary }}>
                    Cancel
                  </Text>
                </View>
              </BlurView>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CAMERA SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Subtle viewfinder pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.015, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Permission states ──

  if (!permission) {
    return (
      <PermissionScreen
        icon="camera-off"
        title="Camera Access"
        subtitle="Loading camera permissions…"
        onBack={() => router.back()}
      />
    );
  }

  if (!permission.granted) {
    return (
      <PermissionScreen
        icon="camera-lock"
        title="Camera Permission Required"
        subtitle="CalAI needs access to your camera to scan and identify food items using AI."
        actionLabel="Grant Permission"
        onAction={requestPermission}
        onBack={() => router.back()}
      />
    );
  }

  // ── Actions ──

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        exif: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (err) {
      console.error('Capture error:', err);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Gallery error:', err);
    }
  };

  const analyzeFood = async () => {
    if (!capturedUri) return;
    setIsAnalyzing(true);

    try {
      const result = await geminiAnalyze(capturedUri);

      if (result.success && result.data) {
        router.push({
          pathname: '/result',
          params: {
            imageUri: capturedUri,
            food_name: result.data.food_name,
            calories: String(result.data.calories),
            protein: String(result.data.protein),
            carbs: String(result.data.carbs),
            fat: String(result.data.fat),
            confidence: String(result.data.confidence),
          },
        });
      } else {
        Alert.alert(
          'Analysis Failed',
          result.error || 'Could not analyze the food. Please try again.'
        );
      }
    } catch (err) {
      console.error('Analyze error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retake = () => {
    setCapturedUri(null);
    setIsAnalyzing(false);
  };

  const toggleFlash = () => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'));
  };

  const flipCamera = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  // ── Preview mode ──

  if (capturedUri) {
    return (
      <ImagePreview
        uri={capturedUri}
        onRetake={retake}
        onAnalyze={analyzeFood}
        onCancel={() => router.back()}
        isAnalyzing={isAnalyzing}
      />
    );
  }

  // ── Camera mode ──

  return (
    <View style={[styles.flex1, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
      >
        {/* ── Dark overlay with cutout illusion ── */}
        <View style={StyleSheet.absoluteFillObject}>
          {/* Top strip */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: (SCREEN_H - VIEWFINDER_SIZE) / 2 - 30,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* Bottom strip */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: (SCREEN_H - VIEWFINDER_SIZE) / 2 + 30,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* Left strip */}
          <View
            style={{
              position: 'absolute',
              top: (SCREEN_H - VIEWFINDER_SIZE) / 2 - 30,
              left: 0,
              width: (SCREEN_W - VIEWFINDER_SIZE) / 2,
              height: VIEWFINDER_SIZE,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* Right strip */}
          <View
            style={{
              position: 'absolute',
              top: (SCREEN_H - VIEWFINDER_SIZE) / 2 - 30,
              right: 0,
              width: (SCREEN_W - VIEWFINDER_SIZE) / 2,
              height: VIEWFINDER_SIZE,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />
        </View>

        {/* ── Viewfinder Frame ── */}
        <View style={[styles.centerAll, StyleSheet.absoluteFillObject]}>
          <Animated.View
            style={{
              width: VIEWFINDER_SIZE,
              height: VIEWFINDER_SIZE,
              borderRadius: 24,
              transform: [{ scale: pulseAnim }],
            }}
          >
            {/* Faint border */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: 'rgba(255,82,82,0.20)',
              }}
            />

            {/* Corners */}
            <CornerBracket position="tl" />
            <CornerBracket position="tr" />
            <CornerBracket position="bl" />
            <CornerBracket position="br" />

            {/* Scan line */}
            <ScanLine />
          </Animated.View>
        </View>

        {/* ── Top Header ── */}
        <View
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 56 : 40,
            left: 20,
            right: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <GlassButton icon="close" onPress={() => router.back()} />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: C.glass,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: C.glassBorder,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: C.success,
                ...(Platform.OS === 'ios'
                  ? { shadowColor: C.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }
                  : {}),
              }}
            />
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>
              Scan Food
            </Text>
          </View>

          <GlassButton
            icon={flash === 'off' ? 'flash-off' : 'flash'}
            onPress={toggleFlash}
            accent={flash === 'on'}
          />
        </View>

        {/* ── Instruction Pill ── */}
        <View
          style={{
            position: 'absolute',
            bottom: 200,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: C.glassBorder,
            }}
          >
            <BlurView intensity={60} tint="dark">
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: C.glass,
                }}
              >
                <MaterialCommunityIcons name="food-apple" size={16} color={C.accent} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.textPrimary }}>
                  Point at your food to scan
                </Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* ── Bottom Controls ── */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: Platform.OS === 'ios' ? 50 : 34,
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Gallery */}
            <View style={{ alignItems: 'center', gap: 6, width: 60 }}>
              <GlassButton icon="image-multiple" size={52} onPress={pickFromGallery} />
              <Text style={{ fontSize: 11, fontWeight: '500', color: C.textMuted }}>
                Gallery
              </Text>
            </View>

            {/* Shutter */}
            <CaptureButton onPress={takePicture} />

            {/* Flip */}
            <View style={{ alignItems: 'center', gap: 6, width: 60 }}>
              <GlassButton icon="camera-flip" size={52} onPress={flipCamera} />
              <Text style={{ fontSize: 11, fontWeight: '500', color: C.textMuted }}>
                Flip
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: C.textMuted,
              textAlign: 'center',
              marginTop: 18,
            }}
          >
            Capture a photo or choose from gallery
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
});
