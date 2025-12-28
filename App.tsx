import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Purchases from 'react-native-purchases';
import 'react-native-reanimated';

import './global.css';

import { REVENUE_API_ANDROID, REVENUE_API_APPLE } from '@env';
import ChooseGoal from './src/FaceScan/ChooseGoal';
import FaceMetrics from './src/FaceScan/FaceMetrics';
import FaceScanWithDetection from './src/FaceScan/FaceScanWithDetection';
import UnlockFacialGym from './src/FaceScan/UnlockFacialGym';
import CreateNewPassword from './src/ForgotPassword/CreateNewPassword';
import Otp from './src/ForgotPassword/Otp';
import ResetPassword from './src/ForgotPassword/ResetPassword';
import DailyRoutine from './src/GymWorkout/DailyRoutine';
import Exercise from './src/GymWorkout/Exercise';
import Sessions from './src/GymWorkout/Sessions';
import AuthScreen from './src/Home/AuthScreen';
import Home from './src/Home/Home';
import OtpAuth from './src/Home/OtpAuth';
import { Toast, useToast } from './src/hooks/useToost';
import FaceCoach from './src/Messages/FaceCoach';
import { WorkoutProvider } from './src/providers/WorkoutProvider';
import DailyTrack from './src/TrackGym/DailyTrack';
import AppNavigationContainer from './src/utils/useNavigationCleaner';

const Stack = createStackNavigator();

// ======================
// No Internet Screen
// ======================
const NoInternetScreen = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <View style={styles.noInternetContainer}>
      <View style={styles.noInternetContent}>
        {/* WiFi Icon with Cross */}
        <View style={styles.iconContainer}>
          <Ionicons name="wifi-outline" size={100} color="#EF4444" />
          <View style={styles.crossLine} />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Internet Connection</Text>

        {/* Description */}
        <Text style={styles.description}>
          This app requires an active internet connection to function properly.
        </Text>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Check your connection:</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text style={styles.tipText}>Make sure WiFi or mobile data is enabled</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text style={styles.tipText}>Check if you have active data plan</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text style={styles.tipText}>Try turning airplane mode on and off</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => BackHandler.exitApp()}
            activeOpacity={0.8}
          >
            <Ionicons name="exit-outline" size={24} color="#EF4444" />
            <Text style={styles.exitButtonText}>Exit App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ======================
// RootStack
// ======================
function RootStack() {
  const toast = useToast();
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null);
  const [showNoInternet, setShowNoInternet] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  // Check internet connection + configure RevenueCat
  const checkConnection = React.useCallback(async () => {
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUE_API_ANDROID });
    } else if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: REVENUE_API_APPLE });
    }

    try {
      setIsChecking(true);
      const state = await NetInfo.fetch();
      console.log('Connection state:', state.isConnected);

      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setShowNoInternet(!connected);
      setIsChecking(false);
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      setShowNoInternet(true);
      setIsChecking(false);
    }
  }, []);

  React.useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      console.log('Connection changed:', connected);

      setIsConnected(connected);

      if (!connected) {
        setShowNoInternet(true);
        toast.show({
          message:
            'Connection Lost. Your internet connection was lost. Please reconnect to continue using the app.',
          type: 'warning',
          style: 'center',
          buttons: [{ text: 'OK', action: 'dismiss' }],
        });
      } else if (showNoInternet) {
        setShowNoInternet(false);
        toast.show({
          message: 'Connection Restored. Your internet connection has been restored.',
          type: 'success',
          style: 'top',
          duration: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, [showNoInternet, toast]);

  const handleRetry = () => {
    checkConnection();
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }

  if (showNoInternet || isConnected === false) {
    return <NoInternetScreen onRetry={handleRetry} />;
  }


  return (
    <WorkoutProvider>
      <AppNavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'default',
            gestureEnabled: false,
            gestureDirection: 'horizontal',
          }}
          initialRouteName="Home"
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="OtpAuth" component={OtpAuth} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="Otp" component={Otp} />
          <Stack.Screen name="CreateNewPassword" component={CreateNewPassword} />
          <Stack.Screen
            options={{ gestureEnabled: false }}
            name="DailyTrack"
            component={DailyTrack}
          />
          <Stack.Screen name="FaceCoach" options={{ gestureEnabled: false }} component={FaceCoach} />


          <Stack.Screen name="DailyRoutine" options={{ gestureEnabled: false }} component={DailyRoutine} />
          <Stack.Screen name="Exercise" options={{ gestureEnabled: false }} component={Exercise} />
          <Stack.Screen name="Sessions" options={{ gestureEnabled: false }} component={Sessions} />


          <Stack.Screen name="FaceScanWithDetection" component={FaceScanWithDetection} />
          <Stack.Screen name="FaceMetrics" component={FaceMetrics} />
          <Stack.Screen name="ChooseGoal" component={ChooseGoal} />
          <Stack.Screen name="UnlockFacialGym" component={UnlockFacialGym} />
        </Stack.Navigator>


        <Toast
          style={toast.style}
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          fadeAnim={toast.fadeAnim}
          buttons={toast.buttons}
          onHide={toast.hide}
        />
      </AppNavigationContainer>
    </WorkoutProvider>
  );
}

// ======================
// Styles
// ======================
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  noInternetContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  noInternetContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  crossLine: {
    position: 'absolute',
    top: '50%',
    left: '-10%',
    right: '-10%',
    height: 4,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  exitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});

// ======================
// App entry
// ======================
export default function App() {
  return <RootStack />;
}
