# CalAI - Premium AI Calorie Tracker

A modern, beautiful React Native app for tracking calories and nutrition with AI-powered food recognition.

## 🎨 Features

### Core Screens
1. **Dashboard** - Daily calorie summary, macro tracking, recent meals
2. **Camera** - Snap photos of food for AI analysis
3. **Analysis Result** - AI-powered nutritional breakdown with quantity adjustment
4. **Food Diary** - Daily meal logging with history
5. **Progress History** - Charts, statistics, and achievements
6. **Profile** - User settings and personal information

### Design Elements
- **Glassmorphism** - Modern blur and transparency effects
- **Dark Mode** - Complete dark theme for night usage
- **Smooth Animations** - Fluid transitions and interactions
- **Responsive Layout** - Works on all device sizes

## 🛠️ Tech Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript** for type safety
- **NativeWind** for Tailwind CSS styling
- **Zustand** for state management
- **Expo Camera** for food photography
- **Expo Blur** & **Linear Gradient** for glassmorphism effects

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g eas-cli`

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Tailwind for NativeWind:
```bash
npm install -D tailwindcss
```

3. Start the app:
```bash
npm start
```

4. Run on device/emulator:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Project Structure

```
calai/
├── app/                          # Navigation & screens
│   ├── _layout.tsx              # Root layout
│   ├── (tabs)/                  # Tabbed screens
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── diary.tsx
│   │   ├── history.tsx
│   │   └── profile.tsx
│   ├── camera.tsx               # Camera screen
│   └── analysis.tsx             # Analysis results
├── components/                   # Reusable components
│   ├── common/
│   │   └── GlassmorphicCard.tsx
│   └── screens/                 # Screen-specific components
├── lib/                         # Utilities
│   ├── store.ts                # Zustand store
│   └── calculations.ts         # Nutrition math
├── hooks/                       # Custom React hooks
│   └── useNutrition.ts
├── types/                       # TypeScript types
│   └── index.ts
├── assets/                      # Images & icons
├── app.json                     # Expo configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── babel.config.js
```

## 🎯 Key Features Breakdown

### Dashboard
- Circular calorie progress indicator
- Macro nutrient breakdown (Protein, Carbs, Fat)
- Recent meals list
- Quick add food button

### Camera
- Real-time camera view
- Focus frame overlay
- Photo capture and preview
- Retake option

### Analysis Screen
- AI confidence score
- Detailed nutritional breakdown
- Ingredient detection
- Quantity adjuster
- Add to diary functionality

### Diary
- Date selector for past/future dates
- Daily calorie summary
- Meal-by-meal breakdown
- Edit/delete options

### History
- Weekly calorie chart
- Statistics (avg calories, protein, water, workouts)
- Achievements tracking
- Progress insights

### Profile
- User information card
- Settings menu
- Preferences (notifications, dark mode)
- Personal statistics

## 🎨 Design System

### Colors
- **Primary**: #FF6B6B (Red)
- **Success**: #4ADE80 (Green)
- **Background**: #000000 (Black)
- **Surface**: #0a0a0a (Dark Gray)
- **Text**: #FFFFFF (White)
- **Secondary**: #888888 (Gray)

### Components
- **Glassmorphic Cards** - Blur + gradient backgrounds
- **Progress Rings** - Circular progress indicators
- **Stat Cards** - Information display
- **Macro Trackers** - Progress bars with colors

## 🔧 State Management

Using Zustand for global state:
```typescript
- User profile
- Daily logs
- Food history
- Nutrition statistics
- Loading & error states
```

## 📱 Responsive Design

All screens are designed for:
- iPhone (6.1" to 6.9")
- Android (all sizes)
- Tablet support (iPad, Android tablets)

## 🚀 Future Enhancements

- Cloud sync with Firebase
- Apple HealthKit integration
- Social sharing features
- Meal plans & recipes
- Workout tracking integration
- AI training for better food recognition
- Dark/Light mode toggle
- Multi-language support
- Offline mode

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

## 👤 Author

Created with ❤️ for health tracking enthusiasts.

## 🙏 Acknowledgments

- Expo for the amazing React Native framework
- NativeWind for Tailwind CSS integration
- Design inspiration from Apple Health and Cal.com

---

**Made with ❤️ for your health journey**
