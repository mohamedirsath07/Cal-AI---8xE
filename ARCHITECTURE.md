# CalAI Architecture & Implementation Guide

## Project Overview

CalAI is a premium React Native Expo application for tracking daily calorie and nutrition intake with AI-powered food recognition. The app features a modern glassmorphic design with dark mode and smooth animations.

## Architecture

### Folder Structure

```
calai/
├── app/                              # Expo Router navigation & screens
│   ├── _layout.tsx                   # Root layout with stack navigation
│   ├── (tabs)/                       # Tab-based screens
│   │   ├── _layout.tsx               # Tab navigator configuration
│   │   ├── dashboard.tsx             # Home screen with calorie summary
│   │   ├── diary.tsx                 # Daily meal logging
│   │   ├── history.tsx               # Progress tracking & charts
│   │   └── profile.tsx               # User settings & profile
│   ├── camera.tsx                    # Camera capture screen
│   └── analysis.tsx                  # AI food analysis results
│
├── components/                       # Reusable UI components
│   ├── common/                       # Generic components
│   │   └── GlassmorphicCard.tsx      # Styled card components
│   └── screens/                      # Screen-specific components
│
├── lib/                              # Business logic & utilities
│   ├── store.ts                      # Zustand global state
│   ├── calculations.ts               # Nutrition math utilities
│   ├── constants.ts                  # App-wide constants
│   ├── api.ts                        # API service layer
│   └── index.ts                      # Barrel export
│
├── hooks/                            # Custom React hooks
│   └── useNutrition.ts              # Nutrition-specific hooks
│
├── types/                            # TypeScript type definitions
│   └── index.ts                      # All interfaces & types
│
├── assets/                           # Images, icons, fonts
│
├── Configuration Files
│   ├── app.json                      # Expo configuration
│   ├── package.json                  # Dependencies & scripts
│   ├── tsconfig.json                 # TypeScript config
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── babel.config.js               # Babel configuration
│   ├── metro.config.js               # Metro bundler config
│   └── global.css                    # Global Tailwind styles
│
└── Documentation
    └── README.md                     # Setup & usage guide
```

## Key Technologies

### Core Framework
- **Expo** - React Native development platform
- **React Native** - Cross-platform mobile framework
- **Expo Router** - File-based navigation (like Next.js)

### UI & Styling
- **NativeWind** - Tailwind CSS for React Native
- **Expo Blur** - Glassmorphism effects
- **Linear Gradient** - Gradient overlays
- **React Native Reanimated** - Smooth animations

### State Management
- **Zustand** - Lightweight state management
- **AsyncStorage** - Local data persistence (ready to integrate)

### Type Safety
- **TypeScript** - Full type safety
- **Precise type definitions** for all data models

### Utilities
- **dayjs** - Date/time manipulation
- **@expo/vector-icons** - Icon library

## Component System

### GlassmorphicCard Component
```tsx
<GlassmorphicCard
  intensity={20}
  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
  padding="p-6"
  rounded="rounded-2xl"
>
  {/* Content */}
</GlassmorphicCard>
```

### StatCard Component
```tsx
<StatCard
  label="Protein"
  value={120}
  unit="g"
  icon={<Icon />}
  color="#4F46E5"
/>
```

## State Management (Zustand)

### Store Structure
```typescript
interface NutritionStore {
  user: UserProfile | null
  dailyLog: DailyLog | null
  foodHistory: Food[]
  stats: NutritionStats | null
  isLoading: boolean
  error: string | null
}
```

### Usage Example
```typescript
import { useNutritionStore } from '@lib/store'

const { dailyLog, addFood, removeFood } = useNutritionStore()

// Add food
addFood(foodData)

// Remove food
removeFood(foodId)
```

## Screen Specifications

### 1. Dashboard Screen
**Purpose**: Display daily nutrition overview
**Features**:
- Circular calorie progress ring
- Macro nutrient breakdown (3 cards)
- Recent meals list
- Quick add food button

**State Used**:
- dailyLog (calories, protein, carbs, fat)
- user (daily goals)

### 2. Camera Screen
**Purpose**: Capture food photos
**Features**:
- Real-time camera view
- Focus frame overlay
- Capture button
- Photo preview
- Retake option

**Permissions Required**:
- Camera (expo-camera)
- Photo library

### 3. Analysis Result Screen
**Purpose**: Display AI food analysis
**Features**:
- Food name & confidence score
- Calorie summary
- Macro breakdown
- Ingredient list
- Quantity adjuster
- Add to diary button

**Flow**:
1. User takes photo (Camera Screen)
2. Image sent to AI API
3. Results displayed (Analysis Screen)
4. User confirms and adds to diary

### 4. Food Diary Screen
**Purpose**: Log and track daily meals
**Features**:
- Date selector
- Daily calorie summary
- Meals grouped by category
- Edit/delete options
- Meal composition details

**Data Structure**:
```
Date
├── Breakfast
│   ├── Item 1
│   ├── Item 2
│   └── Total: XXX cal
├── Lunch
├── Snack
└── Dinner
```

### 5. History Screen
**Purpose**: Track progress over time
**Features**:
- Weekly calorie chart
- Statistics (avg calories, protein, water)
- Achievements
- Progress trends
- Time range selector (week/month/year)

### 6. Profile Screen
**Purpose**: User settings & information
**Features**:
- User info card
- Settings menu
- Preferences (notifications, dark mode)
- Personal statistics
- Version info

## Styling System

### Color Palette
```javascript
{
  primary: '#FF6B6B',       // Main red
  success: '#4ADE80',       // Green
  warning: '#FCD34D',       // Yellow
  error: '#EF4444',         // Dark red
  background: '#000000',    // Black
  surface: '#0a0a0a',       // Dark gray
  text: '#FFFFFF',          // White
  macroProtein: '#4F46E5',  // Indigo
  macroCarbs: '#8B5CF6',    // Purple
  macroFat: '#EC4899',      // Pink
}
```

### Typography
- **Header/Title**: 24-28px, font-bold
- **Subtitle**: 16-20px, font-semibold
- **Body**: 14-16px, regular
- **Caption**: 12-14px, light
- **Label**: 10-12px, text-gray-400

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- xxl: 24px

## Data Flow

### Food Addition Flow
```
User (Camera Screen)
    ↓
Capture Photo
    ↓
Send to API
    ↓
AI Analysis
    ↓
Display Results (Analysis Screen)
    ↓
User Adjusts Quantity
    ↓
Confirm & Add
    ↓
Update Store
    ↓
Save to Local Storage
    ↓
Update Diary Display
```

### Daily Log Update Flow
```
addFood(foodData)
    ↓
Zustand Store Update
    ↓
Recalculate Totals
    ↓
Update UI Components
    ↓
AsyncStorage Persist
```

## Custom Hooks

### useNutritionCalculations()
```typescript
const {
  getTotalNutrients,
  getCaloriePercentage,
  getRemainingCalories,
} = useNutritionCalculations()
```

### useMealCategories()
```typescript
const {
  getMealEmoji,
  getMealTime,
} = useMealCategories()
```

### useCalorieHealthStatus()
```typescript
const {
  getHealthStatus,
  getStatusMessage,
} = useCalorieHealthStatus()
```

## Utility Functions

### Calculations (lib/calculations.ts)
- `calculateBMR()` - Basal metabolic rate
- `calculateDailyCalories()` - TDEE calculation
- `calculateMacros()` - Macro distribution
- `calculateProgressPercentage()` - Progress tracking
- `getTotalNutrition()` - Sum nutrition values

### Constants (lib/constants.ts)
- Color schemes
- Activity levels
- Meal types with emojis
- Nutrition defaults
- Storage keys
- Error/success messages

## API Integration (lib/api.ts)

### Available Endpoints
```
POST   /api/v1/nutrition/analyze    - AI food analysis
GET    /api/v1/foods/search         - Food database search
GET    /api/v1/foods/database       - Full food database
POST   /api/v1/logs/upload          - Upload daily log
GET    /api/v1/stats                - Get user statistics
POST   /api/v1/sync                 - Sync user data
GET    /health                      - Health check
```

### Usage
```typescript
import { apiService } from '@lib/api'

const result = await apiService.analyzeFood({
  imageUri: 'file://...',
  quantity: 1,
})

if (result.success && result.data) {
  // Use result.data
}
```

## Responsive Design

### Breakpoints
- **Mobile**: < 480px
- **Tablet**: 480px - 1024px
- **Desktop**: > 1024px

### Screen Sizes Supported
- iPhone SE (375px)
- iPhone 12/13 (390px)
- iPhone 14 Pro (393px)
- iPhone 14 Pro Max (430px)
- Android (varies)
- Tablets (iPad, Galaxy Tab)

## Performance Optimization

### Image Optimization
- Compress before upload (0.8 quality)
- Cache locally
- Load progressively

### State Management
- Split state into logical chunks
- Use selectors to prevent unnecessary renders
- Lazy load heavy components

### Navigation
- Use Expo Router for lazy loading
- Prefetch screens when needed

## Security Considerations

- Sensitive data in secure storage
- API authentication headers
- Rate limiting for API calls
- Input validation
- XSS prevention through React Native
- HTTPS for all API calls

## Testing Strategy

### Unit Tests
- Utility functions (calculations, helpers)
- Zustand store actions
- TypeScript type checking

### Integration Tests
- API service layer
- Screen rendering
- Navigation flow

### E2E Tests
- Complete user flows
- Camera capture and analysis
- Diary management

## Future Enhancement Roadmap

### Phase 2
- [ ] Cloud sync with Firebase
- [ ] User authentication
- [ ] Social features (friend challenges)
- [ ] Meal plans & recipes

### Phase 3
- [ ] Apple HealthKit integration
- [ ] Workout tracking
- [ ] Wearable device sync
- [ ] Advanced analytics

### Phase 4
- [ ] Offline-first architecture
- [ ] Advanced ML models
- [ ] Personalization engine
- [ ] Community features

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npx prettier --write .
```

### Building
```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Submit to app stores
npm run submit
```

## Performance Metrics

### Target Metrics
- App startup: < 2s
- Screen navigation: < 300ms
- Image analysis: < 5s
- Calorie calculation: < 100ms
- Memory usage: < 150MB

## Accessibility

- High contrast colors (WCAG AA)
- Large touch targets (44x44px minimum)
- Screen reader support ready
- Text size scaling support
- Color-blind friendly palette

---

**Built with ❤️ for health enthusiasts**
