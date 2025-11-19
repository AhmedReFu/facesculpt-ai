
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import * as React from 'react';
import "./global.css";
import AuthScreen from './src/auth/AuthScreen';
import OtpAuth from './src/auth/OtpAuth';
import CreateNewPassword from './src/ForgotPassword/CreateNewPassword';
import Otp from './src/ForgotPassword/Otp';
import ResetPassword from './src/ForgotPassword/ResetPassword';
import DailyRoutine from './src/GymWorkout/DailyRoutine';
import Exercise from './src/GymWorkout/Exercise';
import Sessions from './src/GymWorkout/Sessions';
import ChooseGoal from './src/Home/ChooseGoal';
import FaceMetrics from './src/Home/FaceMetrics';
import FaceScan from './src/Home/FaceScan';
import Home from './src/Home/Home';
import UnlockFacialGym from './src/Home/UnlockFacialGym';
import FaceCoach from './src/Messages/FaceCoach';
import DailyTrack from './src/TrackGym/DailyTrack';


const Stack = createStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' }, // Set background to black
        ...TransitionPresets.SlideFromRightIOS, // Smooth slide transition
      }}
      initialRouteName='Auth'
    >

      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="Otp" component={Otp} />
      <Stack.Screen name="OtpAuth" component={OtpAuth} />
      <Stack.Screen name="CreateNewPassword" component={CreateNewPassword} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="FaceScan" component={FaceScan} />
      <Stack.Screen name="FaceMetrics" component={FaceMetrics} />
      <Stack.Screen name="ChooseGoal" component={ChooseGoal} />
      <Stack.Screen name="UnlockFacialGym" component={UnlockFacialGym} />
      <Stack.Screen name="DailyRoutine" component={DailyRoutine} />
      <Stack.Screen name="Exercise" component={Exercise} />
      <Stack.Screen name="Sessions" component={Sessions} />
      <Stack.Screen name="DailyTrack" component={DailyTrack} />
      <Stack.Screen name="FaceCoach" component={FaceCoach} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
