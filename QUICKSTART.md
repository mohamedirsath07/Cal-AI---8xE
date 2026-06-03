# CalAI Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Clone & Install
```bash
cd calai
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

### Step 3: Run on Your Device
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📱 Testing the App

### Test Flow
1. **Dashboard** - View daily calorie summary
2. **Camera** - Tap "Add Food" to take a photo
3. **Analysis** - Adjust quantity and review nutritional breakdown
4. **Diary** - Food automatically added to today's log
5. **History** - Check weekly progress and statistics
6. **Profile** - Update personal information

## 🔧 Configuration

### Update API Endpoint
Edit `.env` file:
```
EXPO_PUBLIC_API_URL=your_api_url_here
```

### Customize Daily Goals
Edit `lib/constants.ts`:
```typescript
NUTRITION_DEFAULTS: {
  dailyCalorieGoal: 2500,  // Change your goal
  // ...
}
```

## 📦 Project Structure

### Key Files
- `app/_layout.tsx` - Root navigation setup
- `app/(tabs)/_layout.tsx` - Tab navigation
- `lib/store.ts` - Global state management
- `lib/calculations.ts` - Nutrition math
- `components/common/GlassmorphicCard.tsx` - Reusable UI component

### Data Flow
```
Camera Screen → Send Image → AI Analysis
    ↓
Analysis Screen → User Confirms
    ↓
Add to Diary → Update Store
    ↓
Display in Dashboard
```

## 🎨 Customization

### Change Primary Color
1. Edit `tailwind.config.js`
2. Update `lib/constants.ts` COLORS object
3. Update component color props

### Change Theme
- All components use NativeWind (Tailwind CSS)
- Dark mode is built-in
- Edit `global.css` for global styles

## 🔌 API Integration

### Food Analysis Endpoint
Expected response:
```json
{
  "name": "Grilled Chicken Salad",
  "calories": 320,
  "protein": 45,
  "carbs": 15,
  "fat": 12,
  "fiber": 8,
  "confidence": 94,
  "ingredients": ["Chicken", "Lettuce", "Tomato"]
}
```

### Implement Your AI Service
1. Update `API_ENDPOINTS.analyzeFood` in `lib/constants.ts`
2. Modify `lib/api.ts` analyzeFood method
3. Deploy your backend API

## 🐛 Debugging

### Enable Debug Mode
```bash
# In .env
DEBUG=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### View Logs
```bash
npm start
# Press 'i' for iOS or 'a' for Android
# Errors will display in console
```

### React DevTools
```bash
npm install -g react-devtools
react-devtools
```

## 📚 File Reference

### Screens
- `app/(tabs)/dashboard.tsx` - Home screen
- `app/(tabs)/diary.tsx` - Food logging
- `app/(tabs)/history.tsx` - Progress tracking
- `app/(tabs)/profile.tsx` - Settings
- `app/camera.tsx` - Photo capture
- `app/analysis.tsx` - AI results

### Components
- `components/common/GlassmorphicCard.tsx` - Card component

### Libraries
- `lib/store.ts` - Zustand state
- `lib/calculations.ts` - Math utilities
- `lib/constants.ts` - Configuration
- `lib/api.ts` - API service
- `hooks/useNutrition.ts` - Custom hooks
- `types/index.ts` - TypeScript types

## 🚚 Deployment

### Build for iOS
```bash
npm run build:ios
# Follow Expo EAS build prompts
npm run submit:ios
```

### Build for Android
```bash
npm run build:android
# Follow Expo EAS build prompts
npm run submit:android
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run type check: `npm run type-check`
4. Submit PR

## 📋 Checklist Before Launch

- [ ] Update `APP_VERSION` in `lib/constants.ts`
- [ ] Update app icon in `assets/`
- [ ] Update splash screen
- [ ] Configure Firebase/Backend
- [ ] Set privacy policy
- [ ] Update app description
- [ ] Add app screenshots
- [ ] Configure build for iOS/Android
- [ ] Test on real devices

## 🆘 Troubleshooting

### "Camera permission denied"
- Ensure camera permission is granted in settings
- Check `app.json` camera permissions config

### "Cannot find module"
```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### "Metro bundler error"
```bash
npm run clean
npm install
npm start
```

### "Types not found"
```bash
npm run type-check
```

## 📞 Support

- 📖 Read ARCHITECTURE.md for detailed technical docs
- 📱 Check README.md for feature overview
- 🔧 Review lib/constants.ts for configuration
- 💬 Open an issue on GitHub

## 🎓 Learning Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Expo Router Guide](https://expo.github.io/router)
- [NativeWind Docs](https://www.nativewind.dev)
- [Zustand Guide](https://github.com/pmndrs/zustand)

## 📝 License

MIT License - Feel free to use for personal or commercial projects

---

**Happy tracking! 🎯**

Questions? Check ARCHITECTURE.md for technical details.
